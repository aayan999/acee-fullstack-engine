import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import fs from "fs";

// Anti-patterns that indicate a function needs optimization
// Pre-compiled once at module load — avoids re-creation on every call
const ANTI_PATTERNS = [
    // Old variable declarations
    { pattern: /\bvar\s+/, weight: 3, reason: "uses 'var' (should be let/const)" },
    // Promise .then/.catch chains (could be async/await)
    { pattern: /\.then\s*\(/, weight: 3, reason: "uses .then() chain (could be async/await)" },
    { pattern: /\.catch\s*\(/, weight: 2, reason: "uses .catch() chain (could be async/await)" },
    // Old string concatenation when template literals would be better
    { pattern: /['"]\s*\+\s*\w/, weight: 2, reason: "uses string concatenation (could use template literals)" },
    // Old-style error-first callbacks (function(err, result))
    { pattern: /function\s*\(\s*err\s*,/, weight: 3, reason: "uses error-first callback pattern (could be async/await)" },
    // for loops that could be array methods
    { pattern: /for\s*\(\s*(var|let)\s+\w+\s*=\s*0/, weight: 2, reason: "uses index for-loop (could be .map/.filter/.forEach)" },
    // arguments object (old variadic pattern)
    { pattern: /\barguments\b/, weight: 3, reason: "uses 'arguments' object (should use rest params)" },
    // Unnecessary self/that = this pattern
    { pattern: /\b(self|that)\s*=\s*this\b/, weight: 3, reason: "uses self/that=this hack (use arrow functions)" },
    // Object.assign for shallow merge (could use spread)
    { pattern: /Object\.assign\s*\(\s*\{\s*\}/, weight: 1, reason: "uses Object.assign({}, ...) (could use spread)" },
    // apply/call with null/undefined (could use spread)
    { pattern: /\.(apply|call)\s*\(\s*(null|undefined)/, weight: 1, reason: "uses .apply(null) (could use spread)" },
    // hasOwnProperty check (could use Object.hasOwn)
    { pattern: /\.hasOwnProperty\s*\(/, weight: 1, reason: "uses .hasOwnProperty (prefer Object.hasOwn)" },
    // Long function with no early returns (complexity signal)
    { pattern: /if[\s\S]{400,}else/, weight: 2, reason: "deeply nested if/else (could use early return)" },
];

export class Analyzer {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(JavaScript);
        // Cache the compiled query — avoids recompilation per-file
        this._query = new Parser.Query(JavaScript, `
            (function_declaration) @func
            (function_expression) @func
            (arrow_function) @func
            (method_definition) @func
        `);
    }

    analyzeFile(filePath) {
        const sourceCode = fs.readFileSync(filePath, "utf-8");
        const tree = this.parser.parse(sourceCode);
        const functionsFound = [];

        const matches = this._query.matches(tree.rootNode);

        for (const match of matches) {
            for (const capture of match.captures) {
                const node = capture.node;

                let name = 'anonymous';
                if (node.type === 'function_declaration') {
                    name = node.childForFieldName('name')?.text || 'anonymous';
                } else if (node.type === 'method_definition') {
                    name = node.childForFieldName('name')?.text || 'method';
                } else if (node.type === 'arrow_function') {
                    const parent = node.parent;
                    if (parent && parent.type === 'variable_declarator') {
                        name = parent.childForFieldName('name')?.text || 'arrow_func';
                    }
                }

                // 🎯 Character indices for surgical patching
                functionsFound.push({
                    functionName: name,
                    functionBody: node.text,
                    startIndex: node.startIndex,
                    endIndex: node.endIndex
                });
            }
        }

        // 🛡️ O(1) De-duplicate using a Set (was O(n²) with findIndex)
        const seen = new Set();
        return functionsFound.filter(fn => {
            if (seen.has(fn.functionBody)) return false;
            seen.add(fn.functionBody);
            return true;
        });
    }

    /**
     * Scores a function body for optimization potential using static analysis.
     * Returns { score, reasons[] } — score 0 means already modern, skip it.
     */
    scoreOptimizationNeed(functionBody) {
        const reasons = [];
        let score = 0;

        for (const { pattern, weight, reason } of ANTI_PATTERNS) {
            if (pattern.test(functionBody)) {
                score += weight;
                reasons.push(reason);
            }
        }

        return { score, reasons };
    }
}

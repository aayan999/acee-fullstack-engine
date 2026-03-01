import fs from "fs";
import fsp from "fs/promises";
import { Ingestor } from "./modules/ingestor.js";
import { Analyzer } from "./modules/analyzer.js";
import { CodeEvolver } from "./modules/evolver.js";
import { Validator } from "./modules/validator.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_FILE = path.join(__dirname, 'run_status.json');
const DASHBOARD_FILE = path.join(__dirname, 'dashboard_data.json');

// ⚡ Configurable concurrency — process this many files in parallel
const FILE_CONCURRENCY = parseInt(process.env.ACEE_FILE_CONCURRENCY, 10) || 3;

const writeStatus = (status, repoUrl, extra = {}) => {
    try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify({ status, repoUrl, ...extra }, null, 2));
    } catch (e) {
        console.error('Could not write status file:', e.message);
    }
};

// ── MongoDB reporting (when launched from backend) ────────────────────────────
async function updateRunInDB(runId, update) {
    if (!runId) return; // Not launched from backend, skip DB update
    try {
        const mongoUri = process.env.ACEE_MONGODB_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            console.log('⚠️ No MongoDB URI available, skipping DB update.');
            return;
        }
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState === 0) {
            await mongoose.default.connect(mongoUri);
        }
        // Direct collection update — avoids needing to import the model
        await mongoose.default.connection.db
            .collection('runs')
            .updateOne(
                { _id: new mongoose.default.Types.ObjectId(runId) },
                { $set: update }
            );
    } catch (e) {
        console.error('⚠️ DB update error:', e.message);
    }
}

async function disconnectDB() {
    try {
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState !== 0) {
            await mongoose.default.disconnect();
        }
    } catch (_) { /* ignore */ }
}

const projectAudit = {
    totalScanned: 0,
    successfulFixes: 0,
    syntaxErrorsPrevented: 0,
    totalCharsSaved: 0
};

/**
 * Processes a single file through the evolution pipeline.
 * Extracted from the main loop so files can be processed concurrently.
 */
async function processFile(targetFile, ingestor, analyzer, evolver, validator) {
    const fullPath = path.join(ingestor.workspacePath, targetFile);
    console.log(`\n📂 Processing: ${targetFile}`);
    projectAudit.totalScanned++;

    const functions = analyzer.analyzeFile(fullPath);
    if (!functions || functions.length === 0) {
        console.log(`   ⏭️ No functions found, skipping.`);
        return;
    }

    let currentFileContent = fs.readFileSync(fullPath, 'utf8');
    const originalFileLength = currentFileContent.length;

    // Sort BACKWARDS to keep indices stable during replacement
    const sortedFunctions = [...functions].sort((a, b) => b.startIndex - a.startIndex);

    for (const func of sortedFunctions) {
        // 📏 Complexity Check
        const lineCount = func.functionBody.split('\n').length;
        const charCount = func.functionBody.length;

        // SKIP if the function is less than 4 lines OR less than 60 characters
        if (lineCount < 4 && charCount < 60) {
            console.log(`⏭️ Skipping ${func.functionName}: Too simple to evolve.`);
            continue;
        }

        // 🧠 Optimization Score Gate — only evolve if there are real anti-patterns
        const { score, reasons } = analyzer.scoreOptimizationNeed(func.functionBody);
        if (score === 0) {
            console.log(`✨ Skipping ${func.functionName}: Already modern, no anti-patterns detected.`);
            continue;
        }

        const displayName = func.functionName === 'anonymous'
            ? `anonymous_at_line_${func.startIndex}`
            : func.functionName;

        console.log(`🔧 Evolving: ${displayName} (score: ${score}) — ${reasons.join(', ')}`);
        try {
            const upgradedCode = await evolver.evolveFunction(func.functionName, func.functionBody);

            if (upgradedCode && upgradedCode.trim() && upgradedCode !== func.functionBody) {
                // 🛡️ Bracket Guard: Ensure AI didn't lose punctuation
                const openBraces = (upgradedCode.match(/{/g) || []).length;
                const closeBraces = (upgradedCode.match(/}/g) || []).length;
                const openParens = (upgradedCode.match(/\(/g) || []).length;
                const closeParens = (upgradedCode.match(/\)/g) || []).length;

                if (openBraces !== closeBraces || openParens !== closeParens) {
                    console.log(`   ⚠️ [${displayName}] skipped: Unbalanced brackets detected.`);
                    continue;
                }

                const prefix = currentFileContent.substring(0, func.startIndex);
                const suffix = currentFileContent.substring(func.endIndex);
                currentFileContent = prefix + upgradedCode + suffix;
            }
        } catch (err) {
            console.log(`   ⚠️ Evolution error in ${displayName}: ${err.message}`);
        }
    }

    // 3. File-Level Validation (async — non-blocking)
    validator.saveEvolution(targetFile, currentFileContent);
    let result = await validator.validateAsync(targetFile);

    let didAttemptCorrection = false;

    // 🧠 Self-Correction Logic
    if (!result.success && sortedFunctions.length > 0) {
        didAttemptCorrection = true;

        const lineMatch = result.error ? String(result.error).match(/:(\d+)/) : null;
        const errorLine = lineMatch ? lineMatch[1] : '?';

        console.log(`🔄 [${targetFile}] Validation failed at line ${errorLine}. Attempting Self-Correction...`);

        validator.revert(targetFile);
        let retryContent = fs.readFileSync(fullPath, 'utf8');

        const targetFunc = sortedFunctions[0];
        const fixPrompt = `Your previous refactor of "${targetFunc.functionName}" caused a SyntaxError: ${result.error}. Please fix the syntax (check your parentheses and braces) and return ONLY the raw code.\n\nOriginal Code:\n${targetFunc.functionBody}`;

        const fixedCode = await evolver.evolveFunction(targetFunc.functionName, fixPrompt);

        if (fixedCode && fixedCode.trim()) {
            const prefix = retryContent.substring(0, targetFunc.startIndex);
            const suffix = retryContent.substring(targetFunc.endIndex);
            retryContent = prefix + fixedCode + suffix;

            validator.saveEvolution(targetFile, retryContent);
            result = await validator.validateAsync(targetFile);

            if (result.success) {
                currentFileContent = retryContent;
                console.log(`   ✅ Self-Correction successful! AI fixed the syntax.`);
            } else {
                console.log(`   ❌ Self-Correction failed. AI could not resolve the error.`);
            }
        }
    }

    // 4. Final Verdict
    if (!result.success) {
        projectAudit.syntaxErrorsPrevented++;
        const revertReason = didAttemptCorrection ? "Self-correction failed" : "Syntax Error blocked";
        console.log(`🛡️ ACEE: Reverting ${targetFile}. ${revertReason}.`);

        const auditData = {
            timestamp: new Date().toISOString(),
            file: targetFile,
            error: result.error || "Syntax/Validation Error"
        };
        // ⚡ Async audit log write — non-blocking
        fsp.appendFile('validation_audit.log', JSON.stringify(auditData, null, 2) + ',\n')
            .catch(e => console.error('Audit log write error:', e.message));

        validator.revert(targetFile);
    } else {
        projectAudit.successfulFixes++;
        const charsRemoved = originalFileLength - currentFileContent.length;
        projectAudit.totalCharsSaved += charsRemoved;
        console.log(`   ✅ ${targetFile} successfully evolved. (${charsRemoved > 0 ? charsRemoved + ' chars removed' : Math.abs(charsRemoved) + ' chars added'})`);
    }
}

async function startEvolution() {
    const startTimestamp = Date.now();
    const runId = process.env.ACEE_RUN_ID || null;

    // Read repo URL from CLI argument
    const repoUrl = process.argv[2];
    if (!repoUrl) {
        console.error('❌ Usage: node main.js <github-repo-url>');
        process.exit(1);
    }

    writeStatus('running', repoUrl, { startedAt: new Date().toISOString() });

    try {
        // 1. Ingest: Clone and prepare workspace
        const ingestor = new Ingestor("./workspace");
        ingestor.prepareWorkSpace();
        const cloneSuccess = await ingestor.cloneRepo(repoUrl);
        if (!cloneSuccess) {
            throw new Error(`Failed to clone repository: ${repoUrl}`);
        }

        // ⚡ Use async file discovery (non-blocking I/O)
        const availableFiles = await ingestor.getFilesByLanguageAsync('javascript');
        if (availableFiles.length === 0) {
            console.log("⚠️ No JS files found.");
            // Update DB with "done" even if no files found
            await updateRunInDB(runId, {
                status: 'done',
                finishedAt: new Date(),
                'stats.totalScanned': 0,
            });
            return;
        }

        const analyzer = new Analyzer();
        const evolver = new CodeEvolver();
        const validator = new Validator("./workspace");

        console.log(`🚀 ACEE: Starting Mass Evolution on ${availableFiles.length} files (concurrency: ${FILE_CONCURRENCY})...`);

        // 2. ⚡ Batch-process files with configurable concurrency
        for (let i = 0; i < availableFiles.length; i += FILE_CONCURRENCY) {
            const batch = availableFiles.slice(i, i + FILE_CONCURRENCY);
            console.log(`\n📦 Processing batch ${Math.floor(i / FILE_CONCURRENCY) + 1}/${Math.ceil(availableFiles.length / FILE_CONCURRENCY)} (${batch.length} files)...`);

            const results = await Promise.allSettled(
                batch.map(file => processFile(file, ingestor, analyzer, evolver, validator))
            );

            // Log any unexpected rejections
            for (const r of results) {
                if (r.status === 'rejected') {
                    console.error(`   ❌ Batch error: ${r.reason?.message || r.reason}`);
                }
            }
        }

        const totalTime = ((Date.now() - startTimestamp) / 1000).toFixed(1);

        console.log("\n🏁 ACEE: Batch processing complete.");

        // 5. Executive Summary & Dashboard Export
        console.log("\n====================================");
        console.log("📊 ACEE FINAL PROJECT AUDIT");
        console.log("====================================");
        console.log(`📂 Total Files Scanned:      ${projectAudit.totalScanned}`);
        console.log(`✅ Successful Evolutions:    ${projectAudit.successfulFixes}`);
        console.log(`🛡️ Syntax Errors Blocked:    ${projectAudit.syntaxErrorsPrevented}`);
        console.log(`📉 Net Code Reduction:       ${projectAudit.totalCharsSaved} characters`);
        console.log(`📈 Success Rate:             ${projectAudit.totalScanned > 0 ? ((projectAudit.successfulFixes / projectAudit.totalScanned) * 100).toFixed(2) : 0}%`);
        console.log(`⏱️  Total Execution Time:     ${totalTime}s`);

        // ⚡ Display LLM cache performance
        const cacheStats = evolver.getCacheStats();
        console.log(`⚡ LLM Cache Hits:           ${cacheStats.hits} (${cacheStats.hitRate})`);
        console.log(`📡 LLM API Calls:            ${cacheStats.misses}`);
        console.log(`📦 Cached Evolutions:        ${cacheStats.cachedEntries}`);
        console.log("====================================\n");

        const finalStats = {
            ...projectAudit,
            repoUrl,
            executionTimeSeconds: parseFloat(totalTime),
            cacheStats,
            concurrency: FILE_CONCURRENCY,
            completionTime: new Date().toLocaleString()
        };

        // Write local JSON files (for standalone/dev usage)
        try {
            fs.writeFileSync(DASHBOARD_FILE, JSON.stringify(finalStats, null, 2));
        } catch (_) { /* may fail on ephemeral FS */ }

        writeStatus('done', repoUrl, {
            startedAt: new Date(startTimestamp).toISOString(),
            finishedAt: new Date().toISOString()
        });

        // ✅ Update MongoDB (per-user run record)
        await updateRunInDB(runId, {
            status: 'done',
            finishedAt: new Date(),
            stats: {
                totalScanned: projectAudit.totalScanned,
                successfulFixes: projectAudit.successfulFixes,
                syntaxErrorsPrevented: projectAudit.syntaxErrorsPrevented,
                totalCharsSaved: projectAudit.totalCharsSaved,
            },
        });

    } catch (error) {
        console.error("🛡️ ACEE: An error occurred during evolution:", error);
        writeStatus('error', repoUrl, {
            finishedAt: new Date().toISOString(),
            errorMessage: error.message
        });

        // ❌ Update MongoDB with error status
        await updateRunInDB(runId, {
            status: 'error',
            finishedAt: new Date(),
            errorMessage: error.message,
        });
    } finally {
        await disconnectDB();
    }
}

startEvolution();
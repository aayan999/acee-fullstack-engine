import Groq from "groq-sdk";
import { config } from "dotenv";
import path from "path";
import crypto from "crypto";

config({
    path: path.resolve(process.cwd(), '../.env')
});

/**
 * Simple concurrency limiter (semaphore).
 * Prevents flooding the API with too many parallel requests.
 */
class ConcurrencyLimiter {
    constructor(maxConcurrent = 2) {
        this.maxConcurrent = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.running < this.maxConcurrent) {
            this.running++;
            return;
        }
        // Wait until a slot opens up
        return new Promise(resolve => this.queue.push(resolve));
    }

    release() {
        this.running--;
        if (this.queue.length > 0) {
            this.running++;
            const next = this.queue.shift();
            next();
        }
    }
}

export class CodeEvolver {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('Missing environment variable: GROQ_API_KEY');
        }
        this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        this.maxRetries = 3;
        this.baseWaitTime = 10000;

        // 🧠 Content-addressable LLM response cache
        // Identical function bodies skip the API call entirely
        this._cache = new Map();

        // 🚦 Concurrency limiter — prevents API overload
        this._limiter = new ConcurrencyLimiter(2);

        // 📊 Cache metrics
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * Creates a fast hash of the function body for cache lookups.
     */
    _hashBody(body) {
        return crypto.createHash('sha256').update(body).digest('hex');
    }

    async evolveFunction(functionName, functionBody, retryCount = 0) {
        if (!functionName || typeof functionName !== 'string') {
            throw new Error('Function name must be a non-empty string');
        }
        if (!functionBody) return functionBody;

        // 🧠 Check cache first — skip API call for identical function bodies
        const bodyHash = this._hashBody(functionBody);
        if (this._cache.has(bodyHash)) {
            this.cacheHits++;
            console.log(`   ⚡ Cache hit for ${functionName} — skipping API call`);
            return this._cache.get(bodyHash);
        }
        this.cacheMisses++;

        const startTime = Date.now();
        const originalLength = functionBody.length;

        // 🚦 Acquire a concurrency slot before making the API call
        await this._limiter.acquire();

        try {
            const prompt = this.buildPrompt(functionName, functionBody);

            // 🔥 Using Groq: High speed, High reliability
            const chatCompletion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                max_tokens: 4096
            });

            const evolvedCode = chatCompletion.choices?.[0]?.message?.content;

            if (!evolvedCode) {
                console.warn(`No response from Groq for function: ${functionName}`);
                return functionBody;
            }

            const sanitizedCode = this.sanitizeCode(evolvedCode, functionBody);

            // 🛡️ THE COSMETIC FILTER: Block formatting-only changes
            if (this.isCosmeticChange(functionBody, sanitizedCode)) {
                console.log(`   ⏭️ Skipped [${functionName}]: Code is already optimized (Cosmetic changes only).`);
                // Cache the result (original body) so we don't re-try next time
                this._cache.set(bodyHash, functionBody);
                return functionBody;
            }

            this.logMetrics(functionName, startTime, originalLength, sanitizedCode.length);

            // 🧠 Cache the successful evolution
            this._cache.set(bodyHash, sanitizedCode);
            return sanitizedCode;

        } catch (error) {
            // 🐛 AWAIT REQUIRED: Wait for the retry execution to finish
            return await this.handleError(error, functionName, functionBody, retryCount);
        } finally {
            // 🚦 Always release the concurrency slot
            this._limiter.release();
        }
    }

    // ASYNC REQUIRED: So it can pause execution during rate-limit cooldowns
    async handleError(error, functionName, functionBody, retryCount) {
        // Handle Rate Limits (HTTP 429)
        if (error.status === 429 && retryCount < this.maxRetries) {
            return await this.retryWithBackoff(functionName, functionBody, retryCount);
        }

        if (error.status === 401) {
            console.error('🔑 Authentication Error: Invalid GROQ_API_KEY');
            throw new Error('Invalid API key. Please check your GROQ_API_KEY environment variable.');
        }

        if (error.status >= 500) {
            console.error(`Server Error [${functionName}]: ${error.message}`);
        } else {
            console.error(`Groq Error [${functionName}]:`, error.message);
        }

        // Return original code if we've exhausted retries or hit a non-rate-limit error
        return functionBody;
    }

    async retryWithBackoff(functionName, functionBody, retryCount) {
        // Exponential backoff: 10s, 20s, 40s
        const wait = this.baseWaitTime * Math.pow(2, retryCount);
        console.log(`⏳ Groq Rate Limit. Retry ${retryCount + 1}/${this.maxRetries}. Waiting ${wait / 1000}s...`);

        await new Promise(resolve => setTimeout(resolve, wait));
        return this.evolveFunction(functionName, functionBody, retryCount + 1);
    }

    buildPrompt(functionName, functionBody) {
        const sanitizedFunctionName = functionName.trim();
        const sanitizedFunctionBody = functionBody.trim();

        return `You are an expert JavaScript/Node.js refactoring engine.
Your task is to modernize and optimize the provided function while strictly preserving its original behavior, inputs, and outputs.

### REFACTORING GOALS:
- Convert Promise chains (.then/.catch) and callbacks to \`async/await\`.
- Reduce nesting by using early returns (guard clauses).
- Use modern ES6+ features (destructuring, template literals, default parameters, optional chaining \`?.\`, nullish coalescing \`??\`).
- Replace traditional \`for\` loops with modern array methods (\`.map\`, \`.filter\`, \`.reduce\`) where appropriate and readable.
- Remove redundant variable assignments and unnecessary \`let\`/\`var\` declarations (prefer \`const\`).

### STRICT CONSTRAINTS:
1. **PRESERVE SIGNATURE**: Do NOT change the function name, parameters, or their order.
2. **NO ASSIGNMENT WRAPPERS**: Do NOT wrap the output in \`const functionName = ...\` or \`export ...\` unless it was in the original code. 
3. **PRESERVE FUNCTION TYPE**: If the original is an anonymous arrow function \`(req, res) =>\`, keep it as an anonymous arrow function.
4. **NO MARKDOWN**: Return ONLY the raw JavaScript code. Do not wrap in \`\`\`javascript ... \`\`\`. Do not include any explanations or conversational text.
5. **PRESERVE LOGIC**: Do not remove error handling, logging, or alter business logic.
6. **FORMATTING**: Do not aggressively reformat or add/remove semicolons if no logical optimizations are needed.

Original Name: ${sanitizedFunctionName}
Original Code:
${sanitizedFunctionBody}`;
    }

    // Robust sanitization against Markdown code block wrappers
    sanitizeCode(code, fallback) {
        if (!code || typeof code !== 'string') return fallback;

        const cleanedCode = code
            .replace(/```javascript|```js|```/g, '') // Strip markdown wrappers
            .replace(/^\s+|\s+$/g, '')               // Remove leading/trailing blank lines
            .replace(/;+$/, '');                     // Remove trailing semicolons

        return cleanedCode || fallback;
    }

    // 🛡️ Checks if the LLM only changed spaces, tabs, newlines, or semicolons
    isCosmeticChange(oldCode, newCode) {
        const strip = (str) => str.replace(/[\s;]/g, '');
        return strip(oldCode) === strip(newCode);
    }

    logMetrics(functionName, startTime, originalLength, evolvedLength) {
        const elapsedTime = Date.now() - startTime;
        const diff = originalLength - evolvedLength;
        const sign = diff > 0 ? '-' : '+';
        const speed = Math.round((evolvedLength / (elapsedTime / 1000)));
        console.log(`🚀 Evolved: ${functionName} (${originalLength} chars -> ${evolvedLength} chars) in ${elapsedTime / 1000}s [Diff: ${sign}${Math.abs(diff)}] (${speed} chars/s)`);
    }

    /**
     * Returns cache performance metrics.
     */
    getCacheStats() {
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: this.cacheHits + this.cacheMisses > 0
                ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(1) + '%'
                : 'N/A',
            cachedEntries: this._cache.size
        };
    }
}
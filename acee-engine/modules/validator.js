import { execSync, execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

export class Validator {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        // Set VALIDATE_WITH_DOCKER=true in your .env to use Docker validation
        this.useDocker = process.env.VALIDATE_WITH_DOCKER === 'true';

        if (this.useDocker) {
            // Check once at startup whether the Docker daemon is reachable
            try {
                execSync('docker info', { stdio: 'pipe' });
                console.log('🐳 Validator: Docker daemon detected — using containerised validation.');
            } catch {
                console.warn('⚠️  Validator: VALIDATE_WITH_DOCKER=true but Docker daemon is not running. Falling back to local node --check.');
                this.useDocker = false;
            }
        } else {
            console.log('🔍 Validator: Using local node --check (fast mode). Set VALIDATE_WITH_DOCKER=true to use Docker.');
        }
    }

    // 1. Save the AI's new code to the file
    saveEvolution(fileName, newCode) {
        const filePath = path.join(this.workspacePath, fileName);

        // Safety: Create a backup if it doesn't exist yet
        if (!fs.existsSync(`${filePath}.bak`)) {
            fs.copyFileSync(filePath, `${filePath}.bak`);
        }

        fs.writeFileSync(filePath, newCode);
        console.log(`ACEE: Evolution saved to ${fileName}`);
    }

    // 2. Validate — Docker (isolated, pinned Node version) or local node --check
    //    Now supports both sync and async modes
    validate(fileName) {
        return this.useDocker
            ? this._validateWithDocker(fileName)
            : this._validateLocal(fileName);
    }

    async validateAsync(fileName) {
        return this.useDocker
            ? this._validateWithDockerAsync(fileName)
            : this._validateLocalAsync(fileName);
    }

    // --- Sync validation (legacy) ---

    _validateWithDocker(fileName) {
        try {
            const absolutePath = path.resolve(this.workspacePath);
            const internalPath = fileName.replace(/\\/g, '/');
            const dockerCmd = `docker run --rm -v "${absolutePath}:/app" -w /app node:20-slim node --check "${internalPath}"`;
            execSync(dockerCmd, { stdio: 'pipe' });
            console.log("VALIDATION SUCCESS (Docker): Code is stable.");
            return { success: true };
        } catch (error) {
            const errorDetails = error.stderr ? error.stderr.toString() : error.message;
            console.error("VALIDATION FAILED (Docker):", errorDetails);
            return { success: false, error: errorDetails };
        }
    }

    _validateLocal(fileName) {
        try {
            const filePath = path.resolve(this.workspacePath, fileName);
            execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
            console.log("VALIDATION SUCCESS (local): Code is stable.");
            return { success: true };
        } catch (error) {
            const errorDetails = error.stderr ? error.stderr.toString() : error.message;
            console.error("VALIDATION FAILED (local):", errorDetails);
            return { success: false, error: errorDetails };
        }
    }

    // --- Async validation (non-blocking) ---

    async _validateWithDockerAsync(fileName) {
        try {
            const absolutePath = path.resolve(this.workspacePath);
            const internalPath = fileName.replace(/\\/g, '/');
            await execFileAsync('docker', [
                'run', '--rm',
                '-v', `${absolutePath}:/app`,
                '-w', '/app',
                'node:20-slim',
                'node', '--check', internalPath
            ]);
            console.log("VALIDATION SUCCESS (Docker): Code is stable.");
            return { success: true };
        } catch (error) {
            const errorDetails = error.stderr ? error.stderr.toString() : error.message;
            console.error("VALIDATION FAILED (Docker):", errorDetails);
            return { success: false, error: errorDetails };
        }
    }

    async _validateLocalAsync(fileName) {
        try {
            const filePath = path.resolve(this.workspacePath, fileName);
            await execFileAsync('node', ['--check', filePath]);
            console.log("VALIDATION SUCCESS (local): Code is stable.");
            return { success: true };
        } catch (error) {
            const errorDetails = error.stderr ? error.stderr.toString() : error.message;
            console.error("VALIDATION FAILED (local):", errorDetails);
            return { success: false, error: errorDetails };
        }
    }

    // 3. If validation fails, put the original back
    revert(fileName) {
        const filePath = path.join(this.workspacePath, fileName);
        if (fs.existsSync(`${filePath}.bak`)) {
            fs.copyFileSync(`${filePath}.bak`, filePath);
            console.log(`🛡️ ACEE: Reverted ${fileName} to stable backup.`);
        }
    }
}
import { execSync } from "child_process";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export class Ingestor {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
    }

    prepareWorkSpace() {
        if (fs.existsSync(this.workspacePath)) {
            console.log(`Cleaning old workspace at ${this.workspacePath}`);
            fs.rmSync(this.workspacePath, {
                recursive: true,
                force: true
            });
        }
        fs.mkdirSync(this.workspacePath, { recursive: true });
    }

    async cloneRepo(repoUrl) {
        try {
            console.log(`Cloning repo ${repoUrl}`);
            execSync(`git clone ${repoUrl} ${this.workspacePath}`, { stdio: "inherit" });
            console.log(`Repo ${repoUrl} cloned successfully`);
            return true;
        } catch (error) {
            console.error(`Error cloning repo ${repoUrl}: ${error}`);
            return false;
        }
    }

    /**
     * Async recursive directory scanner — non-blocking I/O.
     * Falls back to sync version if needed via getFilesByLanguageSync().
     */
    async getFilesByLanguageAsync(lang, dir = this.workspacePath) {
        const extensions = {
            javascript: '.js',
            python: '.py',
            typescript: '.ts'
        };
        const ext = extensions[lang.toLowerCase()] || '.js';
        const results = [];

        const entries = await fsp.readdir(dir, { withFileTypes: true });

        // Process entries concurrently for better I/O throughput
        const tasks = entries.map(async (entry) => {
            const filePath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                    const subResults = await this.getFilesByLanguageAsync(lang, filePath);
                    return subResults;
                }
                return [];
            } else if (entry.name.endsWith(ext)) {
                return [path.relative(this.workspacePath, filePath)];
            }
            return [];
        });

        const allResults = await Promise.all(tasks);
        for (const arr of allResults) {
            for (const item of arr) {
                results.push(item);
            }
        }

        return results;
    }

    // Synchronous version kept for backward compatibility
    getFilesByLanguage(lang, dir = this.workspacePath) {
        const extensions = {
            javascript: '.js',
            python: '.py',
            typescript: '.ts'
        };
        const ext = extensions[lang.toLowerCase()] || '.js';
        let results = [];

        const list = fs.readdirSync(dir);

        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    results = results.concat(this.getFilesByLanguage(lang, filePath));
                }
            } else if (file.endsWith(ext)) {
                results.push(path.relative(this.workspacePath, filePath));
            }
        }

        return results;
    }
}

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const linkPath = path.join(repoRoot, 'shared', 'date-fns');
const targetPath = path.join(repoRoot, 'node_modules', 'date-fns', 'src');

function ensureLink(): void {
    if (!fs.existsSync(targetPath)) {
        throw new Error(`Expected date-fns source directory at: ${targetPath}`);
    }

    try {
        const stat = fs.lstatSync(linkPath);
        if (stat.isSymbolicLink()) {
            const existingTarget = fs.readlinkSync(linkPath);
            const resolvedExisting = path.resolve(path.dirname(linkPath), existingTarget);
            const resolvedExpected = path.resolve(targetPath);
            if (resolvedExisting === resolvedExpected) {
                return;
            }

            fs.unlinkSync(linkPath);
        } else {
            // Something else is at the path; don't clobber silently.
            throw new Error(`Expected ${linkPath} to be a symlink, but it is not.`);
        }
    } catch (err) {
        const e = err as NodeJS.ErrnoException;
        if (e.code !== 'ENOENT') throw err;
    }

    // Create relative link (portable across machines).
    const relativeTarget = path.relative(path.dirname(linkPath), targetPath);
    fs.symlinkSync(relativeTarget, linkPath, 'dir');
}

ensureLink();

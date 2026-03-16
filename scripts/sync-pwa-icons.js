const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const publicPwaDir = path.join(rootDir, "public-pwa");
const adminManifestPath = path.join(publicPwaDir, "admin-manifest.json");

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Missing source icon: ${sourcePath}`);
    }

    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Synced ${path.relative(rootDir, targetPath)}`);
}

function collectVersionedTargets(manifest) {
    const targets = new Map();
    const iconEntries = [];

    if (Array.isArray(manifest.icons)) {
        iconEntries.push(...manifest.icons);
    }

    if (Array.isArray(manifest.shortcuts)) {
        for (const shortcut of manifest.shortcuts) {
            if (Array.isArray(shortcut.icons)) {
                iconEntries.push(...shortcut.icons);
            }
        }
    }

    for (const entry of iconEntries) {
        const src = entry?.src;
        if (typeof src !== "string") {
            continue;
        }

        const match = src.match(/admin-icon-(192|512)(?:-[^/]+)?\.png$/);
        if (!match) {
            continue;
        }

        const size = match[1];
        const sourceName = `admin-icon-${size}.png`;
        const targetName = path.basename(src);
        targets.set(targetName, sourceName);
    }

    return targets;
}

function main() {
    ensureDir(publicPwaDir);

    const manifest = JSON.parse(fs.readFileSync(adminManifestPath, "utf8"));
    const versionedTargets = collectVersionedTargets(manifest);

    const stableTargets = new Map([
        ["admin-icon-192.png", "admin-icon-192.png"],
        ["admin-icon-512.png", "admin-icon-512.png"],
    ]);

    for (const [targetName, sourceName] of stableTargets) {
        copyFile(path.join(publicDir, sourceName), path.join(publicPwaDir, targetName));
    }

    for (const [targetName, sourceName] of versionedTargets) {
        copyFile(path.join(publicDir, sourceName), path.join(publicPwaDir, targetName));
    }
}

main();

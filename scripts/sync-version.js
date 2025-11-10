/*
 Sync version from package.json to:
 - src-tauri/tauri.conf.json (app version)
 - src-tauri/Cargo.toml ([package] version)

 Usage: invoked by npm version lifecycle via package.json scripts.version
*/

const fs = require('fs');
const path = require('path');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function syncTauriConf(newVersion) {
  const p = path.join('src-tauri', 'tauri.conf.json');
  if (!fs.existsSync(p)) return;
  const conf = readJSON(p);
  conf.version = newVersion;
  writeJSON(p, conf);
  console.log(`[sync-version] Updated ${p} -> ${newVersion}`);
}

function syncCargoToml(newVersion) {
  const p = path.join('src-tauri', 'Cargo.toml');
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split(/\r?\n/);
  let inPackage = false;
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '[package]') {
      inPackage = true;
      continue;
    }
    if (inPackage && line.startsWith('[')) {
      // Next table, stop scanning
      break;
    }
    if (inPackage && /^version\s*=\s*"[^"]*"/.test(line)) {
      lines[i] = line.replace(/^version\s*=\s*"[^"]*"/, `version = "${newVersion}"`);
      changed = true;
      break;
    }
  }
  if (changed) {
    fs.writeFileSync(p, lines.join('\n'));
    console.log(`[sync-version] Updated ${p} -> ${newVersion}`);
  } else {
    console.warn(`[sync-version] Did not find version field in [package] of ${p}`);
  }
}

function main() {
  const pkg = readJSON('package.json');
  const v = pkg.version;
  if (!v) {
    console.error('No version found in package.json');
    process.exit(1);
  }
  syncTauriConf(v);
  syncCargoToml(v);
}

main();


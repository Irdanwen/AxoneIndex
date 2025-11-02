/*
  Docs ↔ Code coherence checker
  - Scans Solidity contracts in contracts/src (excluding mocks, interfaces utils except STRATEGY_1/VaultContract & CoreInteractionHandler)
  - Parses public/external function signatures, events, and custom errors
  - Parses docs in docs/contracts/*.md and extracts declared functions/events/errors
  - Reports discrepancies per contract into docs/COHERENCE_REPORT.md and stdout
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, 'contracts', 'src');
const DOCS_DIR = path.join(ROOT, 'docs', 'contracts');
const REPORT_PATH = path.join(ROOT, 'docs', 'COHERENCE_REPORT.md');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function normalizeSig(sig) {
  return sig
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*,\s*/g, ',') // spaces in arg lists
    .replace(/\s*\)\s*/g, ')')
    .replace(/\s*\(\s*/g, '(')
    .trim();
}

function canonicalizeSignature(sig) {
  // Expect format: Name(arg1,arg2)
  const m = sig.match(/^(\w+)\((.*)\)$/);
  if (!m) return normalizeSig(sig);
  const name = m[1];
  const argsRaw = m[2].trim();
  if (argsRaw === '') return `${name}()`;
  const args = argsRaw.split(',').map((a) => {
    // Remove indexed/storage/location and parameter names
    let t = a.trim();
    // remove keywords
    t = t.replace(/\bindexed\b/g, '');
    t = t.replace(/\bmemory\b|\bcalldata\b|\bstorage\b/g, '');
    t = t.replace(/\bpayable\b/g, '');
    // remove names: keep only the first token sequence that looks like a type (allow arrays and tuples roughly)
    // Split by spaces and keep first token (which may contain [] or tuple struct not handled)
    const parts = t.trim().split(/\s+/);
    const typeOnly = parts[0] || t.trim();
    return typeOnly;
  });
  return `${name}(${args.join(',')})`;
}

function extractFromSolidity(filePath, content) {
  // Determine contract name and slice to the specific contract body to avoid interfaces
  const contractMatch = content.match(/\bcontract\s+(\w+)\s*/);
  const contractName = contractMatch ? contractMatch[1] : path.basename(filePath, '.sol');
  let body = content;
  if (contractMatch) {
    const startIdx = content.indexOf(contractMatch[0]);
    const braceIdx = content.indexOf('{', startIdx);
    if (braceIdx !== -1) {
      // naive brace matching
      let depth = 0;
      let end = content.length;
      for (let i = braceIdx; i < content.length; i++) {
        const ch = content[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) { end = i + 1; break; }
        }
      }
      body = content.slice(startIdx, end);
    }
  }

  const functions = new Set();
  const events = new Set();
  const errors = new Set();

  // functions (public|external only)
  const fnRegex = /\bfunction\s+(\w+)\s*\(([^)]*)\)\s*(?:[^;{]*?\b(public|external)\b[^;{]*)[;{]/g;
  for (let m; (m = fnRegex.exec(body)); ) {
    const name = m[1];
    const params = m[2].trim();
    const sig = `${name}(${params})`;
    functions.add(canonicalizeSignature(normalizeSig(sig)));
  }

  // mapping getters (public mappings)
  const mapRegex = /\bmapping\s*\(\s*([^=)]+)=>\s*[^)]+\)\s*public\s+(\w+)\s*;/g;
  for (let m; (m = mapRegex.exec(body)); ) {
    const keyType = m[1].trim().replace(/\s+/g, ' ');
    const name = m[2];
    const sig = `${name}(${keyType})`;
    functions.add(canonicalizeSignature(normalizeSig(sig)));
  }

  // events
  const evRegex = /\bevent\s+(\w+)\s*\(([^)]*)\)\s*;/g;
  for (let m; (m = evRegex.exec(body)); ) {
    const name = m[1];
    const params = m[2].trim();
    const sig = `${name}(${params})`;
    events.add(canonicalizeSignature(normalizeSig(sig)));
  }

  // custom errors
  const errRegex = /\berror\s+(\w+)\s*\(([^)]*)\)\s*;/g;
  for (let m; (m = errRegex.exec(body)); ) {
    const name = m[1];
    const params = m[2].trim();
    const sig = `${name}(${params})`;
    errors.add(canonicalizeSignature(normalizeSig(sig)));
  }

  return { contractName, functions, events, errors };
}

function extractFromMarkdown(md) {
  // functions in "## Fonctions (vue d’ensemble)" table: grab backticked signatures
  const functions = new Set();
  const events = new Set();
  const errors = new Set();

  const fnSection = /##\s*Fonctions\s*\(vue d[’']ensemble\)[\s\S]*?(?=(\n##\s)|$)/i.exec(md);
  if (fnSection) {
    const codeTicks = Array.from(fnSection[0].matchAll(/`([^`]+)`/g));
    for (const m of codeTicks) {
      const t = (m[1] || '').trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*\(/.test(t)) {
        functions.add(canonicalizeSignature(normalizeSig(t)));
      }
    }
  }

  // events in "## Événements" block: backticked lines
  const evSection = /##\s*Événements[\s\S]*?(?=(\n##\s)|$)/i.exec(md);
  if (evSection) {
    const codeTicks = Array.from(evSection[0].matchAll(/`([^`]+)`/g));
    for (const m of codeTicks) {
      const t = (m[1] || '').trim();
      if (t.includes('(')) events.add(canonicalizeSignature(normalizeSig(t)));
    }
  }

  // errors in "## Erreurs" block: backticked lines
  const errSection = /##\s*Erreurs[\s\S]*?(?=(\n##\s)|$)/i.exec(md);
  if (errSection) {
    const codeTicks = Array.from(errSection[0].matchAll(/`([^`]+)`/g));
    for (const m of codeTicks) {
      const t = (m[1] || '').trim();
      if (t.includes('(')) errors.add(canonicalizeSignature(normalizeSig(t)));
    }
  }

  return { functions, events, errors };
}

function preferredDocPathFor(contractName, filePath) {
  // STRATEGY_1 VaultContract has a bespoke doc filename
  if (/STRATEGY_1\/VaultContract\.sol$/.test(filePath)) {
    return path.join(DOCS_DIR, 'STRATEGY_1_VaultContract.md');
  }
  return path.join(DOCS_DIR, `${contractName}.md`);
}

function setDiff(a, b) {
  const out = [];
  for (const x of a) if (!b.has(x)) out.push(x);
  return out.sort();
}

function main() {
  const allSol = walk(CONTRACTS_DIR)
    .filter(f => f.endsWith('.sol'))
    .filter(f => !/\/mocks\//.test(f))
    .filter(f => !/\/interfaces\//.test(f)) // skip interfaces
    .filter(f => !/\/utils\//.test(f));

  const perContract = [];
  for (const file of allSol) {
    const base = path.basename(file);
    if (!/(AxoneToken|AxoneSale|ReferralRegistry|RewardsHub|EmissionController|CoreInteractionHandler|VaultContract)\.sol$/.test(base)) {
      // Restrict to documented contracts
      continue;
    }
    const src = read(file);
    const fromSol = extractFromSolidity(file, src);
    const docPath = preferredDocPathFor(fromSol.contractName, file);
    let fromDoc = { functions: new Set(), events: new Set(), errors: new Set() };
    let docExists = false;
    if (fs.existsSync(docPath)) {
      fromDoc = extractFromMarkdown(read(docPath));
      docExists = true;
    }
    perContract.push({ file, docPath, docExists, fromSol, fromDoc });
  }

  let report = '';
  report += '# Rapport de cohérence Docs ↔ Code\n\n';
  report += `Généré: ${new Date().toISOString()}\n\n`;

  for (const it of perContract) {
    const { file, docPath, docExists, fromSol, fromDoc } = it;
    report += `## ${fromSol.contractName}\n`;
    report += `- Code: \
${path.relative(ROOT, file)}\n`;
    report += `- Doc: ${docExists ? path.relative(ROOT, docPath) : '(manquante)'}\n\n`;

    // Functions
    const fnMissingInDoc = setDiff(fromSol.functions, fromDoc.functions);
    const fnExtraInDoc = setDiff(fromDoc.functions, fromSol.functions);
    report += '### Fonctions\n';
    if (fnMissingInDoc.length === 0 && fnExtraInDoc.length === 0) {
      report += '- OK\n\n';
    } else {
      if (fnMissingInDoc.length) {
        report += '- Manquantes dans la doc:\n';
        for (const s of fnMissingInDoc) report += `  - \
${s}\n`;
      }
      if (fnExtraInDoc.length) {
        report += '- Supplémentaires dans la doc (absentes du code):\n';
        for (const s of fnExtraInDoc) report += `  - \
${s}\n`;
      }
      report += '\n';
    }

    // Events
    const evMissing = setDiff(fromSol.events, fromDoc.events);
    const evExtra = setDiff(fromDoc.events, fromSol.events);
    report += '### Événements\n';
    if (evMissing.length === 0 && evExtra.length === 0) {
      report += '- OK\n\n';
    } else {
      if (evMissing.length) {
        report += '- Manquants dans la doc:\n';
        for (const s of evMissing) report += `  - \
${s}\n`;
      }
      if (evExtra.length) {
        report += '- Supplémentaires dans la doc (absents du code):\n';
        for (const s of evExtra) report += `  - \
${s}\n`;
      }
      report += '\n';
    }

    // Errors
    const erMissing = setDiff(fromSol.errors, fromDoc.errors);
    const erExtra = setDiff(fromDoc.errors, fromSol.errors);
    report += '### Erreurs\n';
    if (erMissing.length === 0 && erExtra.length === 0) {
      report += '- OK\n\n';
    } else {
      if (erMissing.length) {
        report += '- Manquantes dans la doc:\n';
        for (const s of erMissing) report += `  - \
${s}\n`;
      }
      if (erExtra.length) {
        report += '- Supplémentaires dans la doc (absentes du code):\n';
        for (const s of erExtra) report += `  - \
${s}\n`;
      }
      report += '\n';
    }

    report += '\n';
  }

  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Rapport écrit dans ${path.relative(ROOT, REPORT_PATH)}`);
}

main();



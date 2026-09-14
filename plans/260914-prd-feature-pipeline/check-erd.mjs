#!/usr/bin/env node
/* Sanity-check mermaid erDiagram blocks in docs (no mmdc needed).
   Checks: erDiagram header, 2-token attributes, PK/FK markers, relationship
   syntax + label quoting, balanced entity braces, ghost entities. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.argv[2] || 'docs/features';
const files = execSync(`git ls-files --others --cached "${root}"`, { encoding: 'utf8' })
  .split('\n').filter(f => f.endsWith('-erd.md'));

const TYPE_RE = /^(string|int|decimal|date|datetime|boolean)\s+[A-Za-z_]\w*(\s+(PK|FK|UK|PK,\s*FK|FK,\s*PK))?(\s+"[^"]*")?\s*$/;
const REL_RE = /^[A-Z_][A-Z0-9_]*\s+[|}\]o[{<\[]+[-]{2}[|}\]o[{>\[]+\s+[A-Z_][A-Z0-9_]*\s*:\s*"[^"]*"\s*$/;

let totalBlocks = 0, totalErr = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  for (const [bi, b] of blocks.entries()) {
    totalBlocks++;
    const errs = [];
    const lines = b[1].split('\n').map(l => l.trim()).filter(Boolean);
    if (!/^erDiagram/.test(lines[0] || '')) { errs.push('missing erDiagram header'); }
    const entities = new Set(); const relRefs = new Set();
    let inEntity = null;
    for (const [i, line] of lines.entries()) {
      if (i === 0 && /^erDiagram/.test(line)) continue;
      const open = line.match(/^([A-Z_][A-Z0-9_]*)\s*\{\s*$/);
      if (open) { inEntity = open[1]; entities.add(inEntity); continue; }
      if (line === '}') {
        if (!inEntity) errs.push(`stray } at line ${i + 1}`);
        inEntity = null; continue;
      }
      if (inEntity) {
        if (!TYPE_RE.test(line)) errs.push(`attr ${inEntity} line ${i + 1}: bad 2-token form: "${line}"`);
        continue;
      }
      const rel = line.match(/^([A-Z_][A-Z0-9_]*)\s+[|}\]o[{<\[]+-{2}/);
      if (rel) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)\s+\S+\s+([A-Z_][A-Z0-9_]*)/);
        if (m) { relRefs.add(m[1]); relRefs.add(m[2]); }
        if (!REL_RE.test(line)) errs.push(`relationship line ${i + 1} bad syntax/label: "${line}"`);
        continue;
      }
      if (/^%%/.test(line)) continue;
      errs.push(`unparsed line ${i + 1}: "${line}"`);
    }
    if (inEntity) errs.push(`unclosed entity block: ${inEntity}`);
    for (const r of relRefs) if (!entities.has(r)) errs.push(`ghost entity in relationship: ${r} (no attribute block)`);
    if (errs.length) {
      totalErr += errs.length;
      console.log(`FAIL ${file} block ${bi}:`);
      errs.forEach(e => console.log(`   - ${e}`));
    } else {
      console.log(`PASS ${file} block ${bi} (${entities.size} entities, ${relRefs.size ? '' : ''}${lines.filter(l => REL_RE.test(l)).length} rels)`);
    }
  }
}
console.log(`\n${files.length} files, ${totalBlocks} mermaid blocks, ${totalErr} errors`);
process.exit(totalErr ? 1 : 0);

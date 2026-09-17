// Final-review checker for docs/features — artifacts, frontmatter, links,
// tables, ID prefixes, placeholders, OQ owner/impact.
// Usage: node plans/260914-prd-feature-pipeline/final-review-check.mjs docs/features
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const root = process.argv[2] || 'docs/features';
const issues = { P0: [], P1: [], P2: [] };
const add = (sev, file, msg) => issues[sev].push(`${file}: ${msg}`);

const features = readdirSync(root).filter(d => statSync(join(root, d)).isDirectory() && d !== '_templates');
const featureSet = new Set(features);
const allFiles = [];
const collect = dir => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p);
    else if (e.endsWith('.md')) allFiles.push(p);
  }
};
collect(root);

// ---------- 1. artifact completeness ----------
let complete = 0;
for (const f of features) {
  const dir = join(root, f);
  let missing = [];
  try { if (!readdirSync(join(dir, 'brainstorms')).some(x => x.endsWith('.md'))) missing.push('brainstorm'); }
  catch { missing.push('brainstorm'); }
  if (!existsSync(join(dir, `${f}-urd.md`))) missing.push('urd');
  if (!existsSync(join(dir, 'srs', `${f}-spec.md`))) missing.push('spec');
  if (!existsSync(join(dir, 'srs', `${f}-erd.md`))) missing.push('erd');
  if (missing.length) add('P0', f, `thiếu artifact: ${missing.join(', ')}`); else complete++;
}
console.log(`[artifacts] ${complete}/${features.length} features đủ 4 artifact`);

// ---------- helpers ----------
const fm = (file, text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { add('P0', file, 'thiếu frontmatter'); return null; }
  const obj = {};
  let curKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) { curKey = kv[1]; obj[curKey] = kv[2].trim(); continue; }
    const li = line.match(/^\s+-\s+(.+)$/);
    if (li && curKey) { (obj[curKey + '[]'] ||= []).push(li[1].trim()); }
  }
  return obj;
};

const expectedType = (file) => {
  const base = file.split(/[\\/]/).pop();
  if (base.endsWith('-erd.md')) return 'srs-erd';
  if (base.endsWith('-spec.md')) return 'srs';
  if (base.endsWith('-urd.md')) return 'urd';
  if (file.includes('brainstorms')) return 'brainstorm';
  return null;
};

const idRe = /\b(FR|NFR|BR|E|SC|REQ|UC)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-(\d+)\b/g;
const ownerRe = /(owner|duyệt|chốt|xác nhận|phê duyệt|approve|DPO|legal|Head of|sponsor|admin|HR|PM|CTO|BA|QA|Ops|Security|Product|Lead|quản lý|giám đốc|stakeholder)/i;
const impactRe = /(nếu không|chưa chốt|nếu sai|block|chặn|tranh chấp|mất|rủi ro|hỏng|thiếu|không tính|không dùng|lệch|vô chủ|ảo|treo|ảnh hưởng|hệ quả|vi phạm|lộ)/i;
let mdCount = 0, linkCount = 0, tableCount = 0;
const openOQ = { total: 0, noOwner: [], noImpact: [] };

for (const file of allFiles) {
  const rel = file.replace(/\\/g, '/');
  if (rel.endsWith('docs/features/README.md')) continue; // contract doc, not artifact
  mdCount++;
  const text = readFileSync(file, 'utf8');
  const feature = rel.split('/')[2];
  const fmo = fm(rel, text);

  // 2. frontmatter
  if (fmo) {
    for (const k of ['type', 'feature', 'updated'])
      if (!fmo[k]) add('P0', rel, `frontmatter thiếu '${k}'`);
    const et = expectedType(rel);
    if (et && fmo.type && fmo.type !== et)
      add('P1', rel, `type '${fmo.type}' lệch convention '${et}'`);
    if (fmo.feature && fmo.feature !== feature)
      add('P0', rel, `feature '${fmo.feature}' != thư mục '${feature}'`);
    if (['brainstorm', 'urd', 'srs'].includes(fmo.type)) {
      if (!fmo.status) add('P1', rel, `frontmatter thiếu 'status'`);
      if (!fmo.links && !fmo['links[]']) add('P1', rel, `frontmatter thiếu 'links'`);
    }
    const linksList = fmo['links[]'] ||
      (fmo.links ? fmo.links.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean) : []);
    for (const l of linksList) {
      linkCount++;
      const p = l.replace(/^\[|\]$/g, '').trim();
      if (!existsSync(p)) add('P0', rel, `frontmatter link hỏng: ${p}`);
    }
  }

  // split out fenced code blocks for checks that must skip them
  const lines = text.split(/\r?\n/);
  let fenced = false;
  const inFence = lines.map(line => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return true;
    }
    return fenced;
  });

  // 3. markdown links (skip code fences)
  for (const [i, l] of lines.entries()) {
    if (inFence[i]) continue;
    for (const m of l.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^(https?|mailto):/.test(target)) continue;
      linkCount++;
      const p = normalize(join(dirname(file), target));
      if (!existsSync(p)) add('P0', rel, `link hỏng: ${target}`);
    }
  }

  // 4. table column consistency — count cells ignoring escaped \|
  let tbl = [];
  const colCount = l => {
    const stripped = l.replace(/\\\|/g, ' ');
    let c = stripped.split('|').length;
    if (/^\s*\|/.test(stripped)) c--;
    if (/\|\s*$/.test(stripped)) c--;
    return c;
  };
  const flush = () => {
    if (tbl.length < 2) { tbl = []; return; }
    tableCount++;
    const counts = tbl.map(([ln, l]) => [ln, colCount(l)]);
    const ref = counts[0][1];
    for (const [ln, c] of counts)
      if (c !== ref) add('P1', rel, `bảng lệch cột tại dòng ${ln}: ${c} vs ${ref}`);
    tbl = [];
  };
  lines.forEach((l, i) => {
    if (inFence[i]) return;
    if (/^\s*\|.*\|\s*$/.test(l)) {
      tbl.push([i + 1, l]);
      // raw | inside {} or quotes inside a table row → likely needs escape
      const inner = l.slice(1, -1);
      if (/\{[^}]*\|[^}]*\}/.test(inner.replace(/\\\|/g, '')))
        add('P1', rel, `pipe chưa escape trong {…} dòng ${i + 1}`);
    } else flush();
  });
  flush();

  // 5. ID prefixes — REQ always wrong; prefix must be this feature or a known feature
  for (const [i, l] of lines.entries()) {
    if (inFence[i]) continue;
    for (const m of l.matchAll(idRe)) {
      const [full, kind, prefix] = m;
      if (kind === 'UC') continue; // vision-ocr documented exception
      if (kind === 'REQ') { add('P1', rel, `dùng REQ-* thay FR-*: ${full} (dòng ${i + 1})`); continue; }
      if (!featureSet.has(prefix)) add('P1', rel, `ID prefix không khớp feature nào: ${full} (dòng ${i + 1})`);
    }
  }

  // 6. placeholders & open-OQ owner/impact (OQ items only)
  for (const [i, l] of lines.entries()) {
    if (inFence[i]) continue;
    if (/\b(TODO|TBD|FIXME|XXX|PLACEHOLDER)\b/.test(l))
      add('P1', rel, `placeholder dòng ${i + 1}: ${l.trim().slice(0, 90)}`);
    if (/^\s*[-*]\s+\[ \]/.test(l)) {
      openOQ.total++;
      let item = l;
      let j = i + 1;
      while (j < lines.length && /^\s{2,}\S/.test(lines[j]) && !/^\s*[-*]\s+\[/.test(lines[j])) { item += ' ' + lines[j].trim(); j++; }
      if (!ownerRe.test(item)) openOQ.noOwner.push(`${rel}:${i + 1}`);
      if (!impactRe.test(item)) openOQ.noImpact.push(`${rel}:${i + 1}`);
    }
  }
}

console.log(`[scan] ${mdCount} artifact md, ${linkCount} link, ${tableCount} bảng`);
console.log(`[open OQ] ${openOQ.total} checkbox rỗng — thiếu owner: ${openOQ.noOwner.length}, thiếu impact: ${openOQ.noImpact.length}`);
for (const sev of ['P0', 'P1', 'P2']) {
  console.log(`\n=== ${sev} (${issues[sev].length}) ===`);
  issues[sev].forEach(i => console.log(' ' + i));
}
if (openOQ.noOwner.length) { console.log('\n--- OQ thiếu owner ---'); openOQ.noOwner.forEach(x => console.log(' ' + x)); }
if (openOQ.noImpact.length) { console.log('\n--- OQ thiếu impact ---'); openOQ.noImpact.slice(0, 60).forEach(x => console.log(' ' + x)); }
const bad = issues.P0.length;
console.log(`\n${bad === 0 ? 'PASS' : 'FAIL'} — ${bad} lỗi P0`);
process.exit(bad === 0 ? 0 : 1);

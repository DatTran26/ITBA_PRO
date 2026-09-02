import os

out_dir = r"D:\Projects\Git Private\ck-ITBAAI\plans\visuals"
os.makedirs(out_dir, exist_ok=True)
svg_out = os.path.join(out_dir, "skill-question-bank-ai-workflow.svg")

L = []

def r(s): L.append(s)

def arrowR(y, x1, x2, color, mid, label, lx=None):
    lx = lx or (x1 + x2) // 2
    lw = max(len(label) * 5 + 18, 60)
    r(f'  <line x1="{x1}" y1="{y}" x2="{x2-11}" y2="{y}" stroke="{color}" stroke-width="1.5" marker-end="url(#a-{mid})"/>')
    r(f'  <rect x="{lx-lw//2}" y="{y-21}" width="{lw}" height="13" rx="2" fill="#fff" fill-opacity="0.93"/>')
    r(f'  <text x="{lx}" y="{y-11}" font-size="10.5" text-anchor="middle" fill="{color}">{label}</text>')

def arrowL(y, x1, x2, color, mid, label, lx=None):
    lx = lx or (x1 + x2) // 2
    lw = max(len(label) * 5 + 18, 60)
    r(f'  <line x1="{x1}" y1="{y}" x2="{x2+11}" y2="{y}" stroke="{color}" stroke-width="1.5" marker-end="url(#a-{mid})"/>')
    r(f'  <rect x="{lx-lw//2}" y="{y-21}" width="{lw}" height="13" rx="2" fill="#fff" fill-opacity="0.93"/>')
    r(f'  <text x="{lx}" y="{y-11}" font-size="10.5" text-anchor="middle" fill="{color}">{label}</text>')

r('<?xml version="1.0" encoding="UTF-8"?>')
r('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 985" font-family="Inter,-apple-system,sans-serif">')
r('  <defs>')
for nm, col in [('blue','#2563eb'),('green','#059669'),('orange','#ea580c'),('purple','#7c3aed'),('gray','#94a3b8')]:
    r(f'    <marker id="a-{nm}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="{col}"/></marker>')
r('  </defs>')

r('  <rect width="1200" height="985" fill="#f8fafc"/>')
r('  <rect x="8" y="8" width="1184" height="969" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="1.5"/>')
r('  <text x="600" y="31" font-size="15" font-weight="700" text-anchor="middle" fill="#0f172a">AI Workflow: Skill &amp; Question Bank Pipeline</text>')
r('  <text x="600" y="49" font-size="11" text-anchor="middle" fill="#64748b">Supabase Edge Functions  &#183;  OpenAI gpt-4o / gpt-4o-mini  &#183;  Next.js API Routes</text>')

# Phase backgrounds
r('  <rect x="20" y="130" width="1160" height="310" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>')
r('  <rect x="20" y="450" width="1160" height="225" rx="8" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>')
r('  <rect x="20" y="685" width="1160" height="270" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>')
r('  <text x="35" y="148" font-size="10" font-weight="700" fill="#1d4ed8" letter-spacing="0.5">PHASE 1  &#183;  UPLOAD &amp; TEXT EXTRACTION</text>')
r('  <text x="35" y="467" font-size="10" font-weight="700" fill="#6d28d9" letter-spacing="0.5">PHASE 2  &#183;  AI TOPIC EXTRACTION</text>')
r('  <text x="35" y="703" font-size="10" font-weight="700" fill="#15803d" letter-spacing="0.5">PHASE 3  &#183;  QUESTION GENERATION</text>')

# Lifeline headers
lf = [
    (20,   90,  '#dbeafe','#93c5fd','#1e40af','Browser',       None),
    (200,  270, '#fef3c7','#fcd34d','#92400e','Next.js API',    None),
    (410,  480, '#e0e7ff','#a5b4fc','#3730a3','Edge Functions', '(Supabase)'),
    (630,  700, '#d1fae5','#6ee7b7','#065f46','OpenAI API',     'gpt-4o / mini'),
    (820,  890, '#fed7aa','#fdba74','#7c2d12','Supabase',       'Storage'),
    (1020,1090, '#f3e8ff','#d8b4fe','#581c87','Supabase',       'Database'),
]
for bx, cx, fill, stk, tc, l1, l2 in lf:
    r(f'  <rect x="{bx}" y="63" width="140" height="46" rx="8" fill="{fill}" stroke="{stk}" stroke-width="1.5"/>')
    if l2:
        r(f'  <text x="{cx}" y="82" font-size="12" font-weight="600" text-anchor="middle" fill="{tc}">{l1}</text>')
        r(f'  <text x="{cx}" y="99" font-size="10.5" text-anchor="middle" fill="{tc}">{l2}</text>')
    else:
        r(f'  <text x="{cx}" y="90" font-size="12" font-weight="600" text-anchor="middle" fill="{tc}">{l1}</text>')

# Lifelines
for cx, col in zip([90,270,480,700,890,1090],['#93c5fd','#fcd34d','#a5b4fc','#6ee7b7','#fdba74','#d8b4fe']):
    r(f'  <line x1="{cx}" y1="109" x2="{cx}" y2="960" stroke="{col}" stroke-width="1.5" stroke-dasharray="6,4"/>')

# PHASE 1
arrowR(165,  90, 890, '#2563eb','blue',   '(1) Upload file directly  (.pdf / .docx / .txt,  max 50MB)', lx=490)
arrowR(205,  90, 270, '#2563eb','blue',   '(2) POST /document-sources')
arrowR(245, 270,1090, '#2563eb','blue',   '(3) INSERT document_source  (status: pending)',               lx=680)
arrowL(285, 270,  90, '#059669','green',  '(4) { documentId }')
arrowR(325, 270, 480, '#ea580c','orange', '(5) invoke extract-document-topics  (fire-and-forget)')
arrowR(365, 480, 890, '#2563eb','blue',   '(6) createSignedUrl  ->  download file bytes',                lx=685)

# Step 7 self-loop
r('  <path d="M 490,400 L 548,400 L 548,420 L 495,420" stroke="#2563eb" stroke-width="1.5" fill="none" marker-end="url(#a-blue)"/>')
r('  <rect x="489" y="385" width="156" height="13" rx="2" fill="#fff" fill-opacity="0.93"/>')
r('  <text x="567" y="396" font-size="10.5" text-anchor="middle" fill="#2563eb">(7) parse text (format-based)</text>')
r('  <rect x="552" y="398" width="218" height="34" rx="5" fill="#fffbeb" stroke="#fbbf24" stroke-width="1"/>')
r('  <text x="661" y="411" font-size="9.5" font-weight="600" text-anchor="middle" fill="#92400e">PDF: unpdf (fast)  &#183;  DOCX: XML regex  &#183;  TXT: decode</text>')
r('  <text x="661" y="426" font-size="9" text-anchor="middle" fill="#78350f">gpt-4o fallback: scanned PDF only (no text layer)</text>')

# PHASE 2
arrowR(480, 480,1090, '#2563eb','blue',   '(8) UPDATE extracted_text',                                   lx=785)
arrowR(518, 480, 700, '#7c3aed','purple', '(9) gpt-4o: extract topics  (chunks, max 4 parallel)')
arrowL(556, 700, 480, '#059669','green',  '(10) topics JSON  { title, summary, key_points }')
arrowR(594, 480,1090, '#2563eb','blue',   '(11) INSERT document_topics  &#183;  UPDATE status=topics_ready', lx=785)
arrowR(643,  90, 270, '#94a3b8','gray',   '(12) poll GET /document-sources/{id}  every 3s  ->  topics_ready')

r('  <rect x="648" y="506" width="74" height="16" rx="8" fill="#059669"/>')
r('  <text x="685" y="518" font-size="9.5" font-weight="600" text-anchor="middle" fill="#fff">gpt-4o</text>')
r('  <rect x="490" y="506" width="105" height="16" rx="8" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.8"/>')
r('  <text x="542" y="518" font-size="9" text-anchor="middle" fill="#6d28d9">max 4 parallel</text>')

# PHASE 3
arrowR(712,  90, 270, '#2563eb','blue',   '(13) POST /generate-questions  { approvedTopicIds, perTopicCounts }')
arrowR(750, 270, 480, '#ea580c','orange', '(14) invoke generate-questions-from-doc  (fire-and-forget)')
arrowL(788,1090, 480, '#059669','green',  '(15) topics + extracted_text  (from DB)',                      lx=785)
arrowR(826, 480, 700, '#7c3aed','purple', '(16) gpt-4o-mini: gen questions per topic  (max 4 parallel)')
arrowL(864, 700, 480, '#059669','green',  '(17) questions JSON  { question_text, type, level, answer }')
arrowR(902, 480,1090, '#2563eb','blue',   '(18) INSERT questions  &#183;  UPDATE status=done',             lx=785)
arrowR(942,  90, 270, '#2563eb','blue',   '(19) poll  ->  done  ->  questions loaded into Skill')

r('  <rect x="636" y="814" width="108" height="16" rx="8" fill="#047857"/>')
r('  <text x="690" y="826" font-size="9.5" font-weight="600" text-anchor="middle" fill="#fff">gpt-4o-mini</text>')
r('  <rect x="490" y="814" width="105" height="16" rx="8" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.8"/>')
r('  <text x="542" y="826" font-size="9" text-anchor="middle" fill="#6d28d9">max 4 parallel</text>')

# LEGEND
r('  <text x="25" y="975" font-size="9.5" font-weight="600" fill="#374151">Legend:</text>')
items = [
    (80,  '#2563eb', 'Request / Write'),
    (222, '#059669', 'Response / Return'),
    (370, '#ea580c', 'Fire-and-forget'),
    (515, '#7c3aed', 'OpenAI API call'),
    (655, '#94a3b8', 'Poll'),
]
for ix, col, lbl in items:
    r(f'  <line x1="{ix}" y1="970" x2="{ix+28}" y2="970" stroke="{col}" stroke-width="2"/>')
    r(f'  <polygon points="{ix+28},967 {ix+36},970 {ix+28},973" fill="{col}"/>')
    r(f'  <text x="{ix+42}" y="975" font-size="9.5" fill="#374151">{lbl}</text>')

r('</svg>')

with open(svg_out, 'w', encoding='utf-8') as f:
    f.write('\n'.join(L))
print(f"Written: {svg_out}")

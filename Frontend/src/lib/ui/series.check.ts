// Self-check: `npx tsx src/lib/ui/series.check.ts` — fails loudly if bucketing breaks.
import assert from "node:assert/strict";
import { countByMonth, countByDay } from "./series";

const now = new Date(2026, 8, 22); // 22/09/2026
const m = countByMonth(["2026-09-01T00:00:00", "2026-09-30T10:00:00", "2026-04-15", "2025-09-10", null], 6, now);
assert.deepEqual(m.map((p) => p.label), ["T4", "T5", "T6", "T7", "T8", "T9"]);
assert.deepEqual(m.map((p) => p.value), [1, 0, 0, 0, 0, 2]); // năm trước không lọt vào T9

// Qua năm: tháng 1 nhìn lại 3 tháng → T11, T12, T1
assert.deepEqual(countByMonth([], 3, new Date(2026, 0, 5)).map((p) => p.label), ["T11", "T12", "T1"]);

const d = countByDay(["2026-09-22T08:00:00", "2026-09-22T23:00:00", "2026-09-21T01:00:00", "2026-09-08T12:00:00"], 14, now);
assert.equal(d.length, 14);
assert.equal(d[0].label, "09/09");
assert.equal(d[13].value, 2);
assert.equal(d[12].value, 1);
assert.equal(d.reduce((s, p) => s + p.value, 0), 3); // 08/09 nằm ngoài 14 ngày

console.log("series.check OK");

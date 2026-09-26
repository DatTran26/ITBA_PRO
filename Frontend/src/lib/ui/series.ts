import type { TrendPoint } from "@/components/charts";

/** Đếm bản ghi theo tháng cho `months` tháng gần nhất (kể cả tháng hiện tại).
 *  Tháng trống vẫn có điểm 0 để đường TrendArea liền mạch. Nhãn "T9", "T10"... */
export function countByMonth(dates: (string | null | undefined)[], months = 6, now = new Date()): TrendPoint[] {
    const buckets = Array.from({ length: months }, (_, k) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + k, 1);
        return { y: d.getFullYear(), m: d.getMonth(), point: { label: `T${d.getMonth() + 1}`, value: 0 } };
    });
    for (const s of dates) {
        if (!s) continue;
        const c = new Date(s);
        const b = buckets.find((x) => x.y === c.getFullYear() && x.m === c.getMonth());
        if (b) b.point.value++;
    }
    return buckets.map((b) => b.point);
}

/** Đếm bản ghi theo ngày cho `days` ngày gần nhất. Nhãn "dd/MM". */
export function countByDay(dates: (string | null | undefined)[], days = 14, now = new Date()): TrendPoint[] {
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const buckets = Array.from({ length: days }, (_, k) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1) + k);
        return { k: key(d), point: { label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, value: 0 } };
    });
    const idx = new Map(buckets.map((b, i) => [b.k, i]));
    for (const s of dates) {
        if (!s) continue;
        const i = idx.get(key(new Date(s)));
        if (i !== undefined) buckets[i].point.value++;
    }
    return buckets.map((b) => b.point);
}

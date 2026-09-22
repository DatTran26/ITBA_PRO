/** Bảng tông màu dùng chung, rút từ dashboard HR (TopGo sáng).
 *
 *  - `mark`: màu nét/khối trong biểu đồ. Thứ tự này đã chạy dataviz
 *    validate_palette.js (light, nền #ffffff): lightness, chroma, CVD ΔE ≥ 12,
 *    normal ΔE ≥ 23, tương phản ≥ 3:1. Đổi màu hoặc thứ tự → chạy lại validator.
 *  - `ink`: chữ trong pill/badge trên nền `bg` — tất cả ≥ 5.5:1 (WCAG AA).
 *  - `bg`: nền nhạt = mark 12% trên trắng.
 *  Xanh lá / đỏ không có ở đây: dành riêng cho trạng thái (success/danger). */
export const TONES = [
    { name: "blue", mark: "#0077cc", ink: "#005fa3", bg: "#e0eff9" },
    { name: "orange", mark: "#e0761a", ink: "#9a4a00", bg: "#fbefe4" },
    { name: "teal", mark: "#00a08d", ink: "#00665a", bg: "#e0f4f1" },
    { name: "violet", mark: "#6440d8", ink: "#5236b8", bg: "#ece8fa" },
    { name: "pink", mark: "#c73b83", ink: "#9c2465", bg: "#f8e7f0" },
    { name: "gold", mark: "#8a6d00", ink: "#6b5400", bg: "#f1ede0" },
] as const;

export type Tone = (typeof TONES)[number];
export type ToneName = Tone["name"];

/** Tông trang trí (icon KPI, pill) theo vị trí — được phép lặp vì không mã hoá dữ liệu. */
export function toneAt(i: number): Tone {
    return TONES[i % TONES.length];
}

export function toneByName(name: ToneName): Tone {
    return TONES.find((t) => t.name === name) ?? TONES[0];
}

/** Tông cố định theo tên thực thể: cùng nhãn luôn cùng màu, dù lọc/sắp xếp thế nào. */
export function toneFor(label: string): Tone {
    let h = 0;
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
    return TONES[Math.abs(h) % TONES.length];
}

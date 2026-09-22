/** Một lát dữ liệu dùng chung cho mọi biểu đồ trong thư mục này.
 *
 *  `color` phải là chuỗi màu CSS đọc được ở cả hai chủ đề, tức là
 *  `"var(--success)"` chứ không phải `"var(--success)"` (design-guidelines-topgo.md
 *  mục 2). Các primitive ở đây không tự chọn màu, nơi gọi quyết định. */
export interface Slice {
    label: string;
    value: number;
    color: string;
}

/** Bảng màu mặc định khi nơi gọi không chỉ định. Thứ tự đã kiểm tương phản
 *  ≥ 3:1 so với nền sáng TopGo (mục 6). */
export const CHART_COLORS = [
    "var(--primary)",
    "var(--success)",
    "var(--warning)",
    "var(--ai)",
    "var(--danger)",
    "var(--muted-foreground)",
] as const;

export function colorAt(i: number) {
    return CHART_COLORS[i % CHART_COLORS.length];
}

import { TONES } from "@/lib/ui/tones";

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

/** Bảng màu phân loại mặc định = `mark` của TONES (đã validate CVD, xem lib/ui/tones.ts).
 *  Không chứa màu trạng thái: xanh lá/đỏ dành cho Đạt/Không đạt, nơi gọi tự truyền. */
export const CHART_COLORS = TONES.map((t) => t.mark);

/** Không quay vòng: series thứ 7 trở đi là xám "Khác" (dataviz: không sinh màu mới). */
export function colorAt(i: number) {
    return CHART_COLORS[i] ?? "var(--muted-foreground)";
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Pha loãng một màu CSS bất kỳ theo tỉ lệ phần trăm.
 *
 * Trước đây độ trong suốt được nối thẳng vào mã hex (`${color}30`). Cách đó
 * chỉ chạy với hex và vỡ ngay khi `color` là `var(--token)` — mà theo mục 2 của
 * design-guidelines-topgo.md thì màu truyền qua props buộc phải là `var(...)`.
 * `color-mix()` nhận cả hai dạng nên dùng được ở mọi chỗ gọi.
 */
export function alpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

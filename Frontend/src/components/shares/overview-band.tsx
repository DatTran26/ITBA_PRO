import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Dải tổng quan: hàng biểu đồ nằm ngay dưới hàng thẻ KPI, trước bảng dữ liệu.
 *  Ba cột ở màn hình rộng để cả dải lọt trong màn hình đầu, một cột ở điện thoại. */
export default function OverviewBand({
    children, className,
}: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6", className)}>
            {children}
        </div>
    );
}

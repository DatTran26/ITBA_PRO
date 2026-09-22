import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Khung chung của mọi khối biểu đồ trong dải tổng quan: tiêu đề, phần phụ
 *  bên phải, và vùng vẽ. Gom vào đây để 4 primitive không ai tự dựng card
 *  riêng, đúng Shape Consistency Lock (card `rounded-2xl`). */
export default function ChartFrame({
    title, aside, children, className, empty, emptyLabel = "Chưa có dữ liệu",
}: {
    title: string;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
    empty?: boolean;
    emptyLabel?: string;
}) {
    return (
        <Card className={cn("bg-card border-border rounded-2xl shadow-sm h-full", className)}>
            <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    {aside}
                </div>
                {empty ? (
                    <p className="flex-1 grid place-items-center text-xs text-muted-foreground py-8">
                        {emptyLabel}
                    </p>
                ) : (
                    <div className="flex-1 min-h-0">{children}</div>
                )}
            </CardContent>
        </Card>
    );
}

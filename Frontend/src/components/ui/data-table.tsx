"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"

// Generic data table built on ui/table (design-guidelines §7.8). Column-driven.
// Replaces crm/data-table, question-bank-table, and inline <table> markup.
export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  align?: "left" | "right" | "center"
  className?: string
  headClassName?: string
}

function alignClass(align?: "left" | "right" | "center") {
  return align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
  empty?: React.ReactNode
  className?: string
}) {
  if (rows.length === 0) {
    return <>{empty ?? <EmptyState title="Không có dữ liệu" />}</>
  }
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c.key} className={cn(alignClass(c.align), c.headClassName)}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow
            key={rowKey(row, i)}
            className={onRowClick ? "cursor-pointer" : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((c) => (
              <TableCell key={c.key} className={cn(alignClass(c.align), c.className)}>
                {c.cell(row, i)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { DataTable }

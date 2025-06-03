"use client";

import { Task } from "@/types/task";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useMemo, useState } from "react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  DollarSign,
  MoreHorizontal,
  Text,
  XCircle,
  Loader,
  AlertTriangle,
} from "lucide-react";
import ImagePreview from "@/components/image-preview";
import { useRouter } from "next/navigation";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { DataTableToolbar } from "../data-table/data-table-toolbar";
import { TextDatetime } from "../text-datetime";

type Props = {
  initialTasks: Task[];
};

export const TaskList = ({ initialTasks }: Props) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const router = useRouter();
  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const filteredData = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = status.length === 0 || status.includes(task.status);

      return matchesStatus;
    });
  }, [status]);

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "file",
        accessorKey: "urlFile",
        header: ({ column }: { column: Column<Task, unknown> }) => (
          <DataTableColumnHeader column={column} title="File" />
        ),
        cell: ({ cell }) => {
          const urlFile = cell.getValue<Task["urlFile"]>();
          return (
            <img
              src={urlFile}
              alt="Task File"
              width={512}
              height={512}
              className="w-16 h-16 object-cover rounded border border-primary/10"
            />
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }: { column: Column<Task, unknown> }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ cell }) => {
          const status = cell.getValue<Task["status"]>();
          let Icon = CheckCircle;
          switch (status) {
            case "analyzing":
              Icon = Loader;
              break;
            case "pending":
              Icon = AlertTriangle;
              break;
            default:
              Icon = XCircle;
              break;
          }

          return (
            <Badge variant="outline" className="capitalize">
              <Icon className="pr-1" />
              {status}
            </Badge>
          );
        },
        meta: {
          label: "Status",
          variant: "multiSelect",
          options: [
            { label: "Analyzing", value: "analyzing", icon: CheckCircle },
            { label: "Pending", value: "pending", icon: XCircle },
            { label: "Submitted", value: "submitted", icon: XCircle },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "totalLabeled",
        accessorKey: "totalLabeled",
        header: ({ column }: { column: Column<Task, unknown> }) => (
          <DataTableColumnHeader column={column} title="Total Labeled" />
        ),
      },
      {
        id: "totalAnnotations",
        accessorKey: "totalAnnotations",
        header: ({ column }: { column: Column<Task, unknown> }) => (
          <DataTableColumnHeader column={column} title="Total Annotations" />
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }: { column: Column<Task, unknown> }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ cell }) => {
          const createdAt = cell.getValue<Task["createdAt"]>();
          return (
            <div>
              <TextDatetime date={createdAt} />
            </div>
          );
        },
      },
    ],
    []
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: {
        createdAt: true,
      },
    },
    getRowId: (row) => String(row.id),
  });

  const handleRowClick = (taskId: number) => {
    router.push("/project/invoice/annotation?task=" + taskId);
  };

  return (
    <DataTable
      table={table}
      onRowClick={(row) => {
        handleRowClick(row.id);
      }}
    >
      <DataTableToolbar table={table}>
        <DataTableFilterList table={table} />
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
};

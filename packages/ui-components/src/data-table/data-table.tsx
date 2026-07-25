"use client";

import type { ComponentType, DragEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Rich, generic data table with three headline behaviours:
//   1. Click-to-sort per column
//   2. Drag-to-group (collapsible sections with counts + aggregates)
//   3. Column reorder + show/hide
//
// This component is framework-agnostic: instead of importing shadcn, i18n, or
// icon libraries directly, it accepts *slots* (render delegates) for every
// piece of UI that varies between apps.  The consuming app passes its own
// Button, Table, icons, and translated strings.  The package owns the logic
// (sorting, grouping, persistence, drag-and-drop) and the DOM structure;
// the consumer owns the look and feel.
// ---------------------------------------------------------------------------

// --- public types -----------------------------------------------------------

export type SortOrder = "asc" | "desc";
export type SortState = { by: string; order: SortOrder };

/** A value the table can order and group by. */
type CellValue = string | number | null | undefined;

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** Value used for client-side sorting (and the grouping fallback). Omit to sort by nothing. */
  sortValue?: (row: T) => CellValue;
  /** Group key/label for this column; falls back to `String(sortValue(row))`. */
  groupValue?: (row: T) => string;
  /** Aggregate shown under this column inside a group header (e.g. a column total). */
  groupAgg?: (rows: T[]) => ReactNode;
  align?: "left" | "right" | "center";
  /** Extra class(es) for both the header and body cells (e.g. `num`, `nowrap`). */
  className?: string;
  width?: number | string;
  /** Click-to-sort on the header. Default true. */
  sortable?: boolean;
  /** Allow dropping this column onto the grouping bar. Default true. */
  groupable?: boolean;
  /** Whether the column is visible by default. Default true. */
  defaultVisible?: boolean;
};

/** Slot components the consumer must provide. Each maps to a shadcn/ui or equivalent primitive.
 *  The prop types describe the minimum the DataTable passes — the consumer's component
 *  may accept additional props (e.g. variant unions), which are compatible via structural typing. */
export type DataTableSlots = {
  /** Wrapper <table> component. */
  Table: ComponentType<{ children?: ReactNode; className?: string }>;
  /** <thead> component. */
  TableHeader: ComponentType<{ children?: ReactNode; className?: string }>;
  /** <tbody> component. */
  TableBody: ComponentType<{ children?: ReactNode; className?: string }>;
  /** <tr> component. */
  TableRow: ComponentType<{
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
  }>;
  /** <th> component. */
  TableHead: ComponentType<{
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }>;
  /** <td> component. */
  TableCell: ComponentType<{
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    colSpan?: number;
  }>;
  /** Button component. Accepts variant/size as strings (shadcn unions are assignable to string). */
  Button: ComponentType<{
    children?: ReactNode;
    variant?: string;
    size?: string;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
    asChild?: boolean;
  }>;
  /** Dropdown menu root. */
  DropdownMenu: ComponentType<{ children?: ReactNode }>;
  /** Dropdown menu trigger. Must support `asChild`. */
  DropdownMenuTrigger: ComponentType<{ children?: ReactNode; asChild?: boolean }>;
  /** Dropdown menu content. */
  DropdownMenuContent: ComponentType<{ children?: ReactNode; align?: string; className?: string }>;
  /** Dropdown menu label. */
  DropdownMenuLabel: ComponentType<{ children?: ReactNode }>;
  /** Dropdown menu separator. */
  DropdownMenuSeparator: ComponentType<Record<string, never>>;
  /** Dropdown menu checkbox item. */
  DropdownMenuCheckboxItem: ComponentType<{
    children?: ReactNode;
    checked: boolean;
    onCheckedChange: () => void;
    onSelect: (e: Event) => void;
  }>;
};

/** Localised strings the consumer must provide. */
export type DataTableTexts = {
  /** e.g. "Drag a column header here to group by that column" */
  dragToGroup: string;
  /** e.g. "Grouped by" */
  groupedBy: string;
  /** e.g. "Stop grouping {{label}}" — use `{{label}}` placeholder */
  stopGrouping: (label: string) => string;
  /** e.g. "Clear" */
  clear: string;
  /** e.g. "Columns ({{visible}}/{{total}})" */
  columnsCount: (visible: number, total: number) => string;
  /** e.g. "Toggle columns" */
  toggleColumns: string;
  /** e.g. "No records" */
  noRecords: string;
  /** e.g. "Drag to reorder or group" */
  dragReorderOrGroup: string;
  /** e.g. "Drag to reorder" */
  dragReorder: string;
  /** e.g. "Column grouping" */
  columnGrouping: string;
};

/** Icon components the consumer must provide. */
export type DataTableIcons = {
  /** Sort ascending chevron. */
  IconSortAscending: ComponentType<{ className?: string }>;
  /** Sort descending chevron. */
  IconSortDescending: ComponentType<{ className?: string }>;
  /** Unsorted / neutral sort icon. */
  IconArrowsSort: ComponentType<{ className?: string }>;
  /** Chevron pointing right (collapsed group). */
  IconChevronRight: ComponentType<{ size?: number }>;
  /** Chevron pointing down (expanded group). */
  IconChevronDown: ComponentType<{ size?: number }>;
  /** Columns / column selector icon. */
  IconColumns: ComponentType<{ className?: string }>;
  /** Close / remove icon. */
  IconX: ComponentType<{ className?: string }>;
};

export type DataTableProps<T> = {
  /** Stable id used to namespace persisted order/visibility/grouping in localStorage. */
  tableId: string;
  rows: T[];
  rowKey: (row: T) => string;
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  emptyMessage?: ReactNode;
  defaultSort?: SortState;
  defaultGroupBy?: string[];
  /** Show the drag-to-group bar. Default true. */
  enableGrouping?: boolean;

  /** Slot components (Button, Table primitives, DropdownMenu). */
  slots: DataTableSlots;
  /** Localised strings. */
  texts: DataTableTexts;
  /** Icon components. */
  icons: DataTableIcons;
};

// --- persisted-state helper (localStorage-backed useState) -------------------

function usePersistedState<S>(key: string, initial: S) {
  const [state, setState] = useState<S>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as S) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state]);
  return [state, setState] as const;
}

// --- pure column-order helpers (ported from Atlas datatable-columns.ts) ------

function applyColumnOrder<C extends { key: string }>(columns: C[], order: string[]): C[] {
  if (order.length === 0) return columns;
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const ordered = order.map((k) => byKey.get(k)).filter((c): c is C => c != null);
  const known = new Set(order);
  const rest = columns.filter((c) => !known.has(c.key));
  return [...ordered, ...rest];
}

function moveKey(keys: string[], dragged: string, target: string): string[] {
  if (dragged === target) return keys;
  const from = keys.indexOf(dragged);
  const to = keys.indexOf(target);
  if (from < 0 || to < 0) return keys;
  const next = keys.filter((k) => k !== dragged);
  const ti = next.indexOf(target);
  next.splice(from < to ? ti + 1 : ti, 0, dragged);
  return next;
}

// Nullish/empty values always sort last; numbers compare numerically; everything
// else compares as a locale-aware, number-aware string ("Item 2" before "Item 10").
function compareValues(a: CellValue, b: CellValue): number {
  const an = a == null || a === "";
  const bn = b == null || b === "";
  if (an && bn) return 0;
  if (an) return 1;
  if (bn) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

// --- main component ---------------------------------------------------------

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    tableId,
    rows,
    rowKey,
    columns,
    onRowClick,
    rowClassName,
    emptyMessage,
    defaultSort,
    defaultGroupBy,
    enableGrouping = true,
    slots,
    texts,
    icons,
  } = props;

  const {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
  } = slots;
  const {
    IconSortAscending,
    IconSortDescending,
    IconArrowsSort,
    IconChevronRight,
    IconChevronDown,
    IconColumns,
    IconX,
  } = icons;

  const colByKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  // Persisted UI state (per table): column order, visibility, grouping keys.
  const [order, setOrder] = usePersistedState<string[]>(`dt:${tableId}:order`, []);
  const [visibleKeys, setVisibleKeys] = usePersistedState<string[]>(
    `dt:${tableId}:cols`,
    columns.filter((c) => c.defaultVisible !== false).map((c) => c.key),
  );
  const [groupBy, setGroupBy] = usePersistedState<string[]>(
    `dt:${tableId}:group`,
    defaultGroupBy ?? [],
  );

  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [groupDropActive, setGroupDropActive] = useState(false);

  const visible = useMemo(() => new Set(visibleKeys), [visibleKeys]);
  const orderedColumns = useMemo(() => applyColumnOrder(columns, order), [columns, order]);
  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => visible.has(c.key)),
    [orderedColumns, visible],
  );
  // Only keep grouping keys that still exist and are groupable.
  const activeGroupBy = useMemo(
    () =>
      groupBy.filter((k) => {
        const c = colByKey.get(k);
        return c != null && c.groupable !== false;
      }),
    [groupBy, colByKey],
  );
  const grouped = activeGroupBy.length > 0;

  const groupLabelOf = (key: string) => colByKey.get(key)?.label ?? key;
  const groupValueOf = useCallback((col: DataTableColumn<T> | undefined, row: T): string => {
    if (!col) return "";
    if (col.groupValue) return col.groupValue(row);
    const v = col.sortValue ? col.sortValue(row) : undefined;
    return v == null ? "" : String(v);
  }, []);

  // --- sorting (client-side) ---------------------------------------------------
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = colByKey.get(sort.by);
    if (!col?.sortValue) return rows;
    const accessor = col.sortValue;
    const dir = sort.order === "asc" ? 1 : -1;
    // Array.prototype.sort is stable, so equal rows keep the incoming order.
    return [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)) * dir);
  }, [rows, sort, colByKey]);

  const onHeaderSortClick = (col: DataTableColumn<T>) => {
    if (col.sortable === false || !col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.by !== col.key) return { by: col.key, order: "asc" };
      if (prev.order === "asc") return { by: col.key, order: "desc" };
      return null; // asc -> desc -> off
    });
  };

  // --- grouping (client-side, over the already-sorted rows) --------------------
  const toggleGroup = (path: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(path)) n.delete(path);
      else n.add(path);
      return n;
    });
  const addGroup = (key: string) => {
    const col = colByKey.get(key);
    if (col && col.groupable !== false && !groupBy.includes(key)) setGroupBy([...groupBy, key]);
  };
  const removeGroup = (key: string) => setGroupBy(groupBy.filter((k) => k !== key));
  const reorderGroupChip = (from: string, before: string) => {
    if (from === before) return;
    const rest = activeGroupBy.filter((k) => k !== from);
    const idx = rest.indexOf(before);
    rest.splice(idx < 0 ? rest.length : idx, 0, from);
    setGroupBy(rest);
  };

  type RenderItem =
    | { kind: "group"; level: number; path: string; gkey: string; value: string; gRows: T[] }
    | { kind: "leaf"; row: T };

  const items = useMemo<RenderItem[]>(() => {
    if (!grouped) return sortedRows.map((row) => ({ kind: "leaf", row }));
    const out: RenderItem[] = [];
    const rec = (rs: T[], level: number, parent: string) => {
      if (level >= activeGroupBy.length) {
        for (const row of rs) out.push({ kind: "leaf", row });
        return;
      }
      const gkey = activeGroupBy[level];
      if (gkey == null) return;
      const col = colByKey.get(gkey);
      const map = new Map<string, T[]>();
      for (const r of rs) {
        const v = groupValueOf(col, r);
        const arr = map.get(v);
        if (arr) arr.push(r);
        else map.set(v, [r]);
      }
      // Order the group headers by their key. When the current sort targets this
      // very column, follow its direction; otherwise ascending.
      const dir = sort != null && sort.by === gkey && sort.order === "desc" ? -1 : 1;
      const entries = [...map.entries()].sort(
        (a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }) * dir,
      );
      for (const [value, gRows] of entries) {
        const path = `${parent}\u00A6${gkey}=${value}`;
        out.push({ kind: "group", level, path, gkey, value, gRows });
        if (!collapsed.has(path)) rec(gRows, level + 1, path);
      }
    };
    rec(sortedRows, 0, "");
    return out;
  }, [sortedRows, grouped, activeGroupBy, collapsed, colByKey, sort, groupValueOf]);

  // --- column drag-to-reorder + drop-onto-grouping-bar -------------------------
  const thDragProps = (c: DataTableColumn<T>) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData("text/plain", c.key);
      setDragKey(c.key);
    },
    onDragEnd: () => {
      setDragKey(null);
      setDragOverKey(null);
      setGroupDropActive(false);
    },
    title: enableGrouping && c.groupable !== false ? texts.dragReorderOrGroup : texts.dragReorder,
  });
  const thDropProps = (c: DataTableColumn<T>) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragKey || dragKey === c.key) return;
      e.preventDefault();
      if (dragOverKey !== c.key) setDragOverKey(c.key);
    },
    onDragLeave: () => {
      if (dragOverKey === c.key) setDragOverKey(null);
    },
    onDrop: (e: DragEvent) => {
      if (!dragKey || dragKey === c.key) return;
      e.preventDefault();
      setOrder(
        moveKey(
          orderedColumns.map((x) => x.key),
          dragKey,
          c.key,
        ),
      );
      setDragKey(null);
      setDragOverKey(null);
    },
  });

  const fullColSpan = Math.max(1, visibleColumns.length);

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Toolbar: drag-to-group bar on the left, Columns menu on the right. */}
      <div className="flex items-center gap-2">
        {enableGrouping && (
          <div
            role="toolbar"
            aria-label={texts.columnGrouping}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs min-h-8 flex-wrap",
              groupDropActive || dragKey ? "border-primary/50 bg-primary/5" : "border-border",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              if (!groupDropActive) setGroupDropActive(true);
            }}
            onDragLeave={() => setGroupDropActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              const k = e.dataTransfer.getData("text/plain");
              if (k) addGroup(k);
              setGroupDropActive(false);
              setDragKey(null);
            }}
          >
            <span className="text-muted-foreground text-xs">
              {activeGroupBy.length === 0 ? texts.dragToGroup : texts.groupedBy}
            </span>
            {activeGroupBy.map((k, i) => (
              <button
                key={k}
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium cursor-default border-0"
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("text/plain", k);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  reorderGroupChip(e.dataTransfer.getData("text/plain"), k);
                }}
              >
                {i > 0 && (
                  <span className="text-muted-foreground" aria-hidden>
                    ›
                  </span>
                )}
                {groupLabelOf(k)}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeGroup(k)}
                  aria-label={texts.stopGrouping(groupLabelOf(k))}
                >
                  <IconX className="size-3" />
                </Button>
              </button>
            ))}
            {activeGroupBy.length > 0 && (
              <Button variant="ghost" size="xs" onClick={() => setGroupBy([])}>
                {texts.clear}
              </Button>
            )}
          </div>
        )}
        <span className="flex-1" />
        <ColumnSelector
          columns={orderedColumns}
          visibleKeys={visibleKeys}
          onChange={setVisibleKeys}
          slots={slots}
          texts={texts}
          icons={icons}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {visibleColumns.map((c) => {
              const sortable = c.sortable !== false && !!c.sortValue;
              const active = sort?.by === c.key;
              return (
                <TableHead
                  key={c.key}
                  className={cn(
                    c.className,
                    sortable && "cursor-pointer select-none",
                    dragOverKey === c.key && "bg-primary/10 ring-1 ring-primary",
                    active && "text-foreground",
                  )}
                  style={{ textAlign: c.align, width: c.width, cursor: "grab" }}
                  {...thDragProps(c)}
                  {...thDropProps(c)}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 bg-transparent border-0 p-0 font-medium text-inherit hover:text-foreground",
                      )}
                      style={{ textAlign: c.align ?? "left" }}
                      onClick={() => onHeaderSortClick(c)}
                    >
                      {c.label}
                      {active ? (
                        sort.order === "asc" ? (
                          <IconSortAscending className="size-3.5" />
                        ) : (
                          <IconSortDescending className="size-3.5" />
                        )
                      ) : (
                        <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-50" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => {
            if (it.kind === "group") {
              return (
                <TableRow
                  key={`g:${it.path}`}
                  className="bg-muted/50 hover:bg-muted/70 cursor-pointer font-semibold"
                  onClick={() => toggleGroup(it.path)}
                >
                  {visibleColumns.map((c, idx) => {
                    if (idx === 0) {
                      return (
                        <TableCell
                          key={c.key}
                          className={cn("font-semibold", c.className)}
                          style={{ paddingLeft: 12 + it.level * 18 }}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-xs">
                              {collapsed.has(it.path) ? (
                                <IconChevronRight size={14} />
                              ) : (
                                <IconChevronDown size={14} />
                              )}
                            </span>
                            <span>
                              {groupLabelOf(it.gkey)}: {it.value || "\u2014"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ({it.gRows.length})
                            </span>
                          </span>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell
                        key={c.key}
                        className={cn("font-semibold", c.className)}
                        style={{ textAlign: c.align }}
                      >
                        {c.groupAgg ? c.groupAgg(it.gRows) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            }
            const r = it.row;
            const id = rowKey(r);
            return (
              <TableRow
                key={id}
                className={cn(onRowClick && "cursor-pointer", rowClassName?.(r))}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {visibleColumns.map((c, idx) => (
                  <TableCell
                    key={c.key}
                    className={c.className}
                    style={{
                      textAlign: c.align,
                      paddingLeft:
                        idx === 0 && grouped ? 12 + activeGroupBy.length * 18 : undefined,
                    }}
                  >
                    {c.render(r)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={fullColSpan}>
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {emptyMessage ?? texts.noRecords}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Column show/hide menu - uses the same slots/icons/texts as the parent.
function ColumnSelector<T>({
  columns,
  visibleKeys,
  onChange,
  slots,
  texts,
  icons,
}: {
  columns: { key: string; label: string }[];
  visibleKeys: string[];
  onChange: (next: string[]) => void;
  slots: DataTableSlots;
  texts: DataTableTexts;
  icons: DataTableIcons;
}) {
  const {
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
  } = slots;
  const { IconColumns } = icons;

  const visible = useMemo(() => new Set(visibleKeys), [visibleKeys]);

  const toggle = (k: string) => {
    const next = new Set(visible);
    if (next.has(k)) {
      if (next.size > 1) next.delete(k);
    } // keep at least one column visible
    else next.add(k);
    // Preserve the incoming column order in the persisted list.
    onChange(columns.filter((c) => next.has(c.key)).map((c) => c.key));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconColumns className="size-4" />
          {texts.columnsCount(visible.size, columns.length)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{texts.toggleColumns}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.key}
            checked={visible.has(c.key)}
            onCheckedChange={() => toggle(c.key)}
            onSelect={(e: Event) => e.preventDefault()}
          >
            {c.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

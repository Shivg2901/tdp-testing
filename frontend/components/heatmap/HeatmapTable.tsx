import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeatmapTableProps<T extends object> {
  columns: ColumnDef<T, string | number | undefined>[];
  data: T[];
  pageSizeOptions?: number[];
  onSortChange?: (sorting: SortingState) => void;
  sorting?: SortingState;
  colorScale?: (value: number | undefined, columnId: string) => string;
}

export function HeatmapTable<T extends object>({
  columns,
  data,
  pageSizeOptions = [10, 25, 100],
  onSortChange,
  sorting: controlledSorting,
  colorScale,
  //
}: HeatmapTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(pageSizeOptions[0]);
  const [pageIndex, setPageIndex] = React.useState(0);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: controlledSorting ?? sorting,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: updater => {
      if (onSortChange) {
        onSortChange(typeof updater === 'function' ? updater(sorting) : updater);
      } else {
        setSorting(typeof updater === 'function' ? updater(sorting) : updater);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    pageCount: Math.ceil(data.length / pageSize),
  });

  // Responsive column width
  // Squeeze columns a bit more, but allow some flexibility
  const minColWidth = 36;
  const maxColWidth = 60;
  const colWidth = Math.max(minColWidth, Math.min(maxColWidth, Math.floor((window.innerWidth - 200) / columns.length)));
  const labelColWidth = 110;

  return (
    <TooltipProvider>
      <div className='w-full overflow-x-auto'>
        <table className='min-w-full border-collapse text-sm' style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: labelColWidth }} />
            {table
              .getAllLeafColumns()
              .slice(1)
              .map(col => (
                <col key={col.id} style={{ width: colWidth }} />
              ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, j) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-1 py-2 border-b font-semibold text-left align-bottom cursor-pointer select-none text-xs md:text-sm',
                      header.column.getCanSort() && 'hover:bg-accent',
                    )}
                    style={
                      j === 0
                        ? { width: labelColWidth, minWidth: labelColWidth, maxWidth: labelColWidth }
                        : { width: colWidth, minWidth: minColWidth, maxWidth: maxColWidth }
                    }
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                    onKeyDown={
                      header.column.getCanSort()
                        ? e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }
                        : undefined
                    }
                  >
                    <div
                      style={
                        j === 0
                          ? {}
                          : {
                              transform: 'rotate(-35deg)',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              width: colWidth,
                              textAlign: 'left',
                              lineHeight: 1.1,
                            }
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        <span className='ml-1'>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronLeft size={14} />
                          )}
                        </span>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className='border-b hover:bg-muted'>
                {row.getVisibleCells().map((cell, j) => {
                  if (j === 0) {
                    return (
                      <td
                        key={cell.id}
                        className='px-2 py-2'
                        style={{
                          width: labelColWidth,
                          minWidth: labelColWidth,
                          maxWidth: labelColWidth,
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  }
                  const value = cell.getValue() as number | undefined;
                  // Association Score column: square, blue scale
                  if (cell.column.id === 'overall_score') {
                    return (
                      <td
                        key={cell.id}
                        className='px-2 py-2'
                        style={{ width: colWidth, minWidth: minColWidth, maxWidth: maxColWidth, textAlign: 'center' }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 32 }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  background: colorScale ? colorScale(value, cell.column.id) : '#e3f0fa',
                                  border: '1px solid #bbb',
                                  verticalAlign: 'middle',
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{typeof value === 'number' ? value.toFixed(2) : '-'}</TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  }
                  // All other columns: use colorScale prop if provided
                  return (
                    <td
                      key={cell.id}
                      className='px-2 py-2'
                      style={{ width: colWidth, minWidth: minColWidth, maxWidth: maxColWidth, textAlign: 'center' }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 32 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: colorScale ? colorScale(value, cell.column.id) : '#e3f0fa',
                                border: '1px solid #bbb',
                                verticalAlign: 'middle',
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{typeof value === 'number' ? value.toFixed(2) : '-'}</TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className='flex flex-col items-center w-full mt-2 gap-2'>
          <div className='flex items-center justify-center gap-2 w-full'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={18} />
            </Button>
            <span className='text-sm'>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight size={18} />
            </Button>
            <select
              className='border rounded px-2 py-1 ml-2'
              value={table.getState().pagination.pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                table.setPageSize(Number(e.target.value));
              }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

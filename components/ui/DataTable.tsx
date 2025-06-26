'use client';

import { TableColumn } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  emptyMessage?: string;
}

export default function DataTable<T>({ 
  data, 
  columns, 
  className = '',
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <table className="table table-striped table-hover">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`text-uppercase small fw-medium text-muted ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`${column.className || ''}`}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key] || '-')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
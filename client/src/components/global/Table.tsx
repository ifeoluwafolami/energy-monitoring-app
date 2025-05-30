export type Column<T> = {
  header: string;
  accessor: keyof T;
  cell?: (row: T, rowIndex: number) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

export function Table<T extends object>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="text-left px-4 py-2 border-b font-semibold text-sm text-gray-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={String(col.accessor)}
                  className="px-4 py-2 border-b text-sm text-gray-800"
                >
                  {col.cell ? col.cell(row, rowIndex) : String(row[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

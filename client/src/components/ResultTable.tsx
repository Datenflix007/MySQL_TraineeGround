import { useMemo, useState } from 'react';

interface ResultTableProps {
  fields: string[];
  rows: Array<Record<string, unknown>>;
  pageSize?: number;
}

export default function ResultTable({ fields, rows, pageSize = 20 }: ResultTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="result-table">
      <table>
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field}>{field}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row, index) => (
            <tr key={`${index}-${JSON.stringify(row)}`}>
              {fields.map((field) => (
                <td key={`${index}-${field}`}>{String(row[field] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button type="button" onClick={handlePrev} disabled={page <= 1}>
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button type="button" onClick={handleNext} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

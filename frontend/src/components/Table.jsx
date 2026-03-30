import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Table({ headers, children, loading, emptyMessage = 'No data found' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50">
            {headers.map((h, i) => (
              <th key={i} className="table-header px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="text-center py-12 text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </td></tr>
          ) : children}
        </tbody>
      </table>
      {!loading && !children?.props?.children?.length && (
        <div className="text-center py-12 text-slate-500 text-sm">{emptyMessage}</div>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
      <span>Showing {(page-1)*limit+1}–{Math.min(page*limit, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page-1)} disabled={page === 1}
          className="btn-secondary py-1.5 px-3 disabled:opacity-30"><ChevronLeft size={16} /></button>
        <span className="px-3 py-1.5 bg-slate-800 rounded-lg font-semibold text-slate-200">{page}</span>
        <button onClick={() => onPage(page+1)} disabled={page === pages}
          className="btn-secondary py-1.5 px-3 disabled:opacity-30"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

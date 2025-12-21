"use client";

interface ImprovedPaginationProps {
  currentPage: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function ImprovedPagination({
  currentPage,
  totalCount,
  limit,
  onPageChange,
  className = "",
}: ImprovedPaginationProps) {
  const totalPages = Math.ceil(totalCount / limit);
  const maxVisiblePages = 5; // Show at least 5 pages as requested

  // Calculate which pages to show
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      // If total pages is less than or equal to maxVisiblePages, show all
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page or no pages
  }

  const buttonBase =
    "px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed min-w-[32px]";
  const iconButtonBase =
    "px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed min-w-[32px]";

  const renderPageButton = (page: number) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      className={`${buttonBase} ${
        currentPage === page
          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
          : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50"
      }`}
    >
      {page}
    </button>
  );

  return (
    <div className={`flex flex-wrap justify-center items-center gap-2 px-2 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 bg-white/95 border border-slate-200 shadow-sm px-2 py-1.5 rounded-lg backdrop-blur-sm flex-wrap">
        {/* First page button */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`${buttonBase} bg-white text-slate-700 border border-slate-200 hover:bg-blue-50`}
              disabled={currentPage === 1}
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <div className="px-1 text-slate-400 text-xs font-semibold select-none">…</div>
            )}
          </>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`${iconButtonBase} ${
            currentPage === 1
              ? "bg-slate-100 text-slate-400 border border-slate-200"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50"
          }`}
          disabled={currentPage === 1}
        >
          «
        </button>

        {/* Visible page numbers */}
        {visiblePages.map(renderPageButton)}

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`${iconButtonBase} ${
            currentPage === totalPages
              ? "bg-slate-100 text-slate-400 border border-slate-200"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50"
          }`}
          disabled={currentPage === totalPages}
        >
          »
        </button>

        {/* Last page button */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <div className="px-1 text-slate-400 text-xs font-semibold select-none">…</div>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`${buttonBase} bg-white text-slate-700 border border-slate-200 hover:bg-blue-50`}
              disabled={currentPage === totalPages}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

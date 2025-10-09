"use client";

import { useState } from "react";

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

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      <div className="join">
        {/* First page button */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="join-item btn btn-sm"
              disabled={currentPage === 1}
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <button className="join-item btn btn-sm btn-disabled">
                ...
              </button>
            )}
          </>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`join-item btn btn-sm ${currentPage === 1 ? "btn-disabled" : ""}`}
          disabled={currentPage === 1}
        >
          «
        </button>

        {/* Visible page numbers */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`join-item btn btn-sm ${
              currentPage === page ? "btn-active" : ""
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`join-item btn btn-sm ${
            currentPage === totalPages ? "btn-disabled" : ""
          }`}
          disabled={currentPage === totalPages}
        >
          »
        </button>

        {/* Last page button */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <button className="join-item btn btn-sm btn-disabled">
                ...
              </button>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="join-item btn btn-sm"
              disabled={currentPage === totalPages}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-600 ml-4">
        Page {currentPage} of {totalPages} ({totalCount} total items)
      </div>
    </div>
  );
}

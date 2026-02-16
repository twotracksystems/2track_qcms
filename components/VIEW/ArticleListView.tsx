"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import ImprovedPagination from "../UI/ImprovedPagination";
import SuggestiveSearchInput from "../UI/SuggestiveSearchInput";
import ViewArticleList from "./ViewArticleList";

export default function UserListView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, refetch, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_article_prod", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_article_prod?page=${page}&search=${encodeURIComponent(search)}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
        return result;
      } else {
        throw new Error(result.error || "Something went wrong while fetching.");
      }
    },
    retry: 1,
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `/api/v1/remove_article_prod?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete article.");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Article deleted successfully.");
      refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete article.";
      toast.error(message);
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });
  
  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  console.log("article data", data);
  return (
    <div className="overflow-x-auto w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        <div className="relative z-20 w-full flex flex-nowrap gap-3 items-end bg-gradient-to-br from-blue-50/30 to-blue-100/20 p-4 rounded-xl shadow-lg border border-blue-200/30 overflow-x-auto overflow-y-visible backdrop-blur-sm">
          {/* Search Bar - Pill Shape Design */}
          <div className="flex-1 min-w-[180px]">
            <SuggestiveSearchInput
              value={searchInputValue}
              onChange={setSearchInputValue}
              placeholder="Search ID Number or Designation"
              onSearch={() => {
                const nextValue = searchInputValue.trim();
                setSearch(nextValue);
                setPage(1);
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-400/20"
            onClick={() => {
              setSearchInputValue("");
              setSearch("");
              setPage(1);
              refetch();
            }}
          >
            Refresh
          </button>

          {/* Add Article Button */}
          <Link
            href="/dashboard/addarticle"
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-500/20"
          >
            Add Article
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">ID Number</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Client</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Designation</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Created Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-24">OPTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12">
                      <div className="flex justify-center items-center">
                        <span className="loading loading-dots loading-md text-blue-900"></span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="px-4 py-8 text-red-600 font-bold" colSpan={5}>
                      Something went wrong while fetching site list.
                    </td>
                  </tr>
                ) : data?.data?.length > 0 ? (
                  data.data.map((get_users: any, index: any) => (
                    <tr 
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td
                        className="px-2 py-2.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:cursor-pointer transition-colors duration-200 whitespace-nowrap"
                        onClick={() => {
                          setSelectedArticleId(String(get_users.id));
                          setIsModalOpen(true);
                        }}
                      >
                        {get_users.article || "N/A"}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.article_name || "N/A"}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.designation_article || "N/A"}</td>
                      
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{formatDate(get_users.created_at)}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-center items-center gap-2">
                          <Link
                            href={`/dashboard/edit_article/${get_users.id}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                          <button
                            type="button"
                            className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 ${
                              deleteArticleMutation.isPending &&
                              deletingId === String(get_users.id)
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                            }`}
                            disabled={
                              deleteArticleMutation.isPending &&
                              deletingId === String(get_users.id)
                            }
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Delete this article? This action cannot be undone."
                              );
                              if (!confirmed) return;
                              const id = String(get_users.id);
                              setDeletingId(id);
                              deleteArticleMutation.mutate(id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deleteArticleMutation.isPending &&
                            deletingId === String(get_users.id)
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 font-bold text-gray-500" colSpan={5}>
                      NO DATA FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-t-2 border-blue-200/50">
                  <td colSpan={5} className="px-4 py-2.5">
                    <span className="text-xs font-medium text-blue-900">
                      {data?.total_count
                        ? `${(page - 1) * limit + 1}-${Math.min(
                            page * limit,
                            data.total_count
                          )} of ${data.total_count} Articles Found`
                        : "No Results"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        {/* Improved Pagination */}
        <div className="mt-2 pb-2 overflow-x-auto">
          <ImprovedPagination
            currentPage={page}
            totalCount={data?.total_count || 0}
            limit={limit}
            onPageChange={setPage}
            className=""
          />
        </div>
        {isModalOpen && selectedArticleId && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-full">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedArticleId(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[85vh] overflow-auto">
                <ViewArticleList
                  id={selectedArticleId}
                  onClose={() => {
                    setIsModalOpen(false);
                    setSelectedArticleId(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

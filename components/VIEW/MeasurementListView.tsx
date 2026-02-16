"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ImprovedPagination from "../UI/ImprovedPagination";
import SuggestiveSearchInput from "../UI/SuggestiveSearchInput";

export default function UserListView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  const { data, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_article", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_measurement?page=${page}&search=${search}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
          },
          redirect: "follow",
        }
      );
      const result = await response.json();

      if (response.ok) {
        return result;
      } else {
        throw new Error("Something went wrong while fetching site list.");
      }
    },
    retry: 1,
  });

  return (
    <div className="overflow-x-auto w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        <div className="w-full flex flex-nowrap gap-3 items-end bg-gradient-to-br from-blue-50/30 to-blue-100/20 p-4 rounded-xl shadow-lg border border-blue-200/30 overflow-x-auto overflow-y-visible backdrop-blur-sm">
          {/* Search Bar - Pill Shape Design */}
          <div className="flex-1 min-w-[180px]">
            <SuggestiveSearchInput
              value={searchInputValue}
              onChange={setSearchInputValue}
              placeholder="Search"
              onSearch={() => {
                const nextValue = searchInputValue.trim();
                setSearch(nextValue);
                setPage(1);
              }}
            />
          </div>

          {/* Add Measurement Button */}
          <Link
            href="/dashboard/addmeasurement"
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-500/20"
          >
            Add Measurement
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">#</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Length</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Inside Diameter</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Outside Diameter</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Flat Crush</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">H₂O</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Radial</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Number Control</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Remarks</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-24">OPTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12">
                      <div className="flex justify-center items-center">
                        <span className="loading loading-dots loading-md text-blue-900"></span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="px-4 py-8 text-red-600 font-bold" colSpan={10}>
                      Something went wrong while fetching site list.
                    </td>
                  </tr>
                ) : data?.length > 0 ? (
                  data.map((get_users: any, index: any) => (
                    <tr 
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-2 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">{index + 1}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.length} mm</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{`${get_users.inside_diameter} mm`}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.outside_diameter} mm</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.flat_crush} kN</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.h20}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.radial}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.number_control}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{get_users.remarks}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-center items-center gap-2">
                          <Link
                            href={`/dashboard/edit_measurement/${get_users.id}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 font-bold text-gray-500" colSpan={10}>
                      NO DATA FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Improved Pagination */}
        <div className="mt-2 pb-2 overflow-x-auto">
          <ImprovedPagination
            currentPage={page}
            totalCount={data?.length || 0}
            limit={limit}
            onPageChange={setPage}
            className=""
          />
        </div>
      </div>
    </div>
  );
}

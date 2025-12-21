"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import ImprovedPagination from "../UI/ImprovedPagination";

export default function ProofingListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  // Fetch orders
  const { data: ordersData, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_order", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_proofing?page=${page}&search=${search}&limit=${limit}`,
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
        throw new Error("Something went wrong while fetching orders.");
      }
    },
    retry: 1,
  });

  // // Fetch customers
  // const { data: customersData } = useQuery({
  //   queryKey: ["get_proofing"],
  //   queryFn: async () => {
  //     const response = await fetch(`/api/v1/get_proofing`, {
  //       method: "GET",
  //       headers: {
  //         Accept: "*/*",
  //       },
  //     });
  //     const result = await response.json();
  //     if (response.ok) {
  //       return result;
  //     } else {
  //       throw new Error("Something went wrong while fetching customers.");
  //     }
  //   },
  //   retry: 1,
  //   enabled: !!ordersData, // Only fetch customers if orders data is available
  // });

  // // Map customer names to orders
  // const ordersWithCustomerNames =
  //   ordersData?.map((order: any) => {
  //     const customerName = customersData?.find(
  //       (customer: any) => customer.id === order.customer_id
  //     )?.name;
  //     return { ...order, customer_name: customerName || "Unknown" };
  //   }) || [];

  return (
    <div className="overflow-x-auto w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        <div className="w-full flex flex-nowrap gap-3 items-end bg-gradient-to-br from-blue-50/30 to-blue-100/20 p-4 rounded-xl shadow-lg border border-blue-200/30 overflow-x-auto backdrop-blur-sm">
          {/* Search Bar - Pill Shape Design */}
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <input
                type="text"
                ref={searchInput}
                className="w-full px-4 py-2.5 pr-10 rounded-full bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-md hover:shadow-lg"
                placeholder="Search"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput.current?.value || "");
                    setPage(1);
                  }
                }}
              />
              <button
                onClick={() => {
                  setSearch(searchInput.current?.value || "");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-900 transition-colors duration-200"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add Proofing Button */}
          <Link
            href="/dashboard/addproofing"
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-500/20"
          >
            Add Proofing
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">#</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Order ID</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Entry Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Exit Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Number Of Pallete</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Program Name</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-24">OPTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="flex justify-center items-center">
                        <span className="loading loading-dots loading-md text-blue-900"></span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="px-4 py-8 text-red-600 font-bold" colSpan={7}>
                      Something went wrong while fetching orders list.
                    </td>
                  </tr>
                ) : ordersData?.length > 0 ? (
                  ordersData.map((order: any, index: number) => (
                    <tr 
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-2 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">{index + 1}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{order.order_form_id}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{order.entry_date_time}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{order.exit_date_time}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{order.num_pallets}</td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">{order.program_name}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-center items-center gap-2">
                          <Link
                            href={`/dashboard/editproofing/${order.id}`}
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
                    <td className="px-4 py-8 font-bold text-gray-500" colSpan={7}>
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
            totalCount={ordersData?.length || 0}
            limit={limit}
            onPageChange={setPage}
            className=""
          />
        </div>
      </div>
    </div>
  );
}

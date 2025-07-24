"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export default function UserListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_customer", page, search, limit],
    queryFn: async () => {
      console.log("Fetching Data with:", { page, search, limit }); // Debug
      const response = await fetch(
        `/api/v1/get_customer?page=${page}&search=${encodeURIComponent(
          search
        )}&limit=${limit}`,
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

      console.log("API Response:", result); // Debug Response
      if (response.ok) {
        return result;
      } else {
        throw new Error("Something went wrong while fetching customer list.");
      }
    },
    retry: 1,
  });

  return (
    <div className="overflow-x-auto mt-4 w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            {/* <Link href="#">Home</Link> */}
          </li>
          <li>
            <span>Customer Management</span>
          </li>
        </ul>
      </div>

      <div className="w-11/12 flex flex-col mx-auto gap-y-12 h-full">
        <div className="w-full flex justify-between items-center">
          {/* Search Input */}
          <label className="input pr-0 input-bordered flex items-center">
            <input
              type="text"
              ref={searchInput}
              className="grow w-full"
              placeholder="Search Company Name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const searchValue = searchInput.current?.value || "";
                  console.log("Search Triggered:", searchValue); // Debug
                  setSearch(searchValue);
                  setPage(1); // Reset to page 1
                }
              }
              }
            />
            <button
              onClick={() => {
                const searchValue = searchInput.current?.value || "";
                console.log("Search Triggered:", searchValue); // Debug
                setSearch(searchValue);
                setPage(1); // Reset to page 1
              }}
              className="btn btn-sm h-full flex items-center gap-2"
            >
              <Search color="#000000" /> Search
            </button>
          </label>

          <Link
            href="/dashboard/addcustomer"
            className="btn btn-primary text-black"
          >
            Add Customer
          </Link>
        </div>

        {/* Table */}
        <table className="table text-center">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Company Name</th>
              <th>OPTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={3}>
                  <span className="loading loading-dots loading-md"></span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="text-error font-bold" colSpan={3}>
                  Error while fetching data.
                </td>
              </tr>
            ) : data?.data?.length > 0 ? (
              data.data.map((customer: any) => (
                <tr key={customer.id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.company_name}</td>
                  <td className="flex gap-4 justify-center">
                    <Link
                      href={`/dashboard/edit_customer/${customer.id}`}
                      className="link flex items-center"
                    >
                      <Pencil className="text-warning" /> Edit
                    </Link>
                    <Link
                      href={`/dashboard/view_customer/${customer.id}`}
                      className="link flex items-center"
                    >
                      <Eye className="text-info" /> View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="font-bold" colSpan={3}>
                  NO DATA FOUND.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
              <span className="text-sm">
            {data?.total_count
              ? `${(page - 1) * limit + 1}-${
                  Math.min(page * limit, data.total_count)
                } of ${data.total_count} Customers Found`
              : "No Results"}
          </span>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Pagination */}
        <div className="flex justify-between gap-4 items-center mx-auto">
        

          <div className="join">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`join-item btn ${page === 1 ? "disabled" : ""}`}
              disabled={page === 1}
            >
              «
            </button>
            <button className="join-item btn">Page {page}</button>
            <button
              onClick={() =>
                setPage((prev) =>
                  prev * limit < (data?.total_count || 0) ? prev + 1 : prev
                )
              }
              className={`join-item btn ${
                page * limit >= (data?.total_count || 0) ? "disabled" : ""
              }`}
              disabled={page * limit >= (data?.total_count || 0)}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
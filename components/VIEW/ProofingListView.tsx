"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

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
    <div className="overflow-x-auto mt-4 w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/"> </Link>
          </li>
          <li>
            <span>Proofing Management</span>
          </li>
        </ul>
      </div>
      <div className="w-11/12 flex flex-col mx-auto gap-y-12 h-full">
        <div className="w-full flex flex-row justify-between items-center">
          <label className="input pr-0 input-bordered flex flex-row justify-center items-center">
            <input
              type="text"
              ref={searchInput}
              className="grow w-full"
              placeholder="Search"
            />
            <button
              onClick={() => {
                setSearch(searchInput.current?.value || "");
                setPage(1);
              }}
              className="btn btn-sm h-full drop-shadow-2xl flex items-center gap-2"
            >
              <Search color="#000000" /> Search
            </button>
          </label>

          <Link
            href="/dashboard/addproofing"
            className="btn btn-primary btn-outline"
          >
            Add Proofing
          </Link>
        </div>

        <table className="table text-center">
          <thead>
            <tr>
              <th></th>
              <th>Order ID</th>
              <th>Entry Date</th>
              <th>Exit Date</th>
              <th>Number Of Pallete</th>
              <th>Program Name</th>
              <th>OPTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={7}>
                  <span className="loading loading-dots loading-md"></span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="text-error font-bold" colSpan={7}>
                  Something went wrong while fetching orders list.
                </td>
              </tr>
            ) : ordersData.length > 0 ? (
              ordersData.map((order: any, index: number) => (
                <tr key={index}>
                  <th>{index + 1}</th>
                  <td className="text-xs">{order.order_form_id}</td>
                  <td>{order.entry_date_time}</td>
                  <td>{order.exit_date_time}</td>
                  <td>{order.num_pallets}</td>
                  <td>{order.program_name}</td>
                  <td>{order.user_id}</td>
                  <td className="justify-center items-center flex gap-4">
                    <Link
                      href={`/dashboard/editproofing/${order.id}`}
                      className="flex flex-row gap-x-2 link"
                    >
                      <Pencil className="text-warning" /> Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="font-bold" colSpan={7}>
                  NO DATA FOUND.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="join mx-auto">
          <button
            onClick={() => {
              if (page !== 1) {
                setPage(page - 1);
              }
            }}
            className="join-item btn"
          >
            «
          </button>
          <button className="join-item btn">Page {page}</button>
          <button
            onClick={() => {
              if (!isLoading && !isFetching && ordersData?.length === limit) {
                setPage(page + 1);
              }
            }}
            className={`join-item btn ${
              ordersData?.length !== limit ? "disabled" : ""
            }`}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

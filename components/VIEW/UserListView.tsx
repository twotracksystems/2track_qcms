"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export default function UserListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_users", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_users?page=${page}&search=${encodeURIComponent(
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

      if (response.ok) {
        return result;
      } else {
        throw new Error("Something went wrong while fetching site list.");
      }
    },
    retry: 1,
  });

  return (
    <div className="overflow-x-auto mt-4 w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/"> </Link>
          </li>
          <li>
            <span>User Management</span>
          </li>
        </ul>
      </div>
      <div className="w-11/12 flex flex-col mx-auto gap-y-12 h-full">
        <div className="w-full flex flex-row  justify-between items-center">
          <label className="input pr-0 input-bordered flex flex-row justify-center items-center">
            <input
              type="text"
              ref={searchInput}
              className="grow w-full"
              placeholder="Search Email or Name"
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
              className="btn btn-sm h-full drop-shadow-2xl flex items-center gap-2"
            >
              <Search color="#000000" /> Search
            </button>
          </label>

          <Link
            href="/dashboard/adduser"
            className="btn btn-primary text-black"
          >
            Add User
          </Link>
        </div>

        <table className="table text-center">
          <thead>
            <tr className="">
              {/* <th></th> */}
              {/* <th>UUID</th> */}
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
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
                  Something went wrong while fetching site list.
                </td>
              </tr>
            ) : data?.data?.length > 0 ? (
              data.data.map((get_users: any, index: any) => (
                <tr key={index}>
                  {/* <th>{index + 1}</th> */}
                  {/* <td className="text-xs">{get_users.uuid}</td> */}
                  <td>{get_users.email}</td>
                  <td>{`${get_users.last_name} ${get_users.first_name}`}</td>
                  <td>{get_users.role}</td>
                  <td className="justify-center items-center flex gap-4">
                    <Link
                      href={`/dashboard/edituser/${get_users.uuid}`}
                      className="link flex"
                    >
                      <Pencil className="text-warning" /> Edit
                    </Link>

                    <Link
                      href={`/dashboard/viewuser/${get_users.uuid}`}
                      className="link flex"
                    >
                      <Eye className="text-info" /> view
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
          <tfoot>
            <tr>
              <td colSpan={4}>
                <span className="text-sm">
                  {data?.total_count
                    ? `${(page - 1) * limit + 1}-${Math.min(
                        page * limit,
                        data.total_count
                      )} of ${data.total_count} Users Found`
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export default function UserListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isFetching, isLoading, isError } = useQuery({
    queryKey: ["get_article", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_article_nominal?page=${page}&search=${search}&limit=${limit}`,
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
            <span>Article Nominal Management</span>
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
            href="/dashboard/addarticlenominal"
            className="btn btn-primary text-black"
          >
            Add Article Nominal
          </Link>
        </div>

        <table className="table text-center">
          <thead>
            <tr className="">
              <th></th>
              <th>Lenght</th>
              <th>Inside Diameter</th>
              <th>Outside Diameter</th>
              <th>Flat Crush</th>
              <th>H20</th>
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
            ) : data.length > 0 ? (
              data?.map((get_users: any, index: any) => (
                <tr key={index}>
                  <th>{index + 1}</th>
                  {/* <td className="text-xs">{get_users.id}</td> */}
                  <td>{get_users.length} mm</td>
                  <td>{`${get_users.inside_diameter} mm`}</td>
                  <td>{get_users.outside_diameter} mm</td>
                  <td>{get_users.flat_crush} kN</td>
                  <td>{get_users.h20} %</td>
                  <td className="justify-center items-center flex gap-4">
                    <Link
                      href={`/dashboard/edit_article_nominal?id=${get_users.id}`}
                      className="link"
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
              if (!isLoading && !isFetching && data?.length == limit) {
                setPage(page + 1);
              }
            }}
            className={`join-item btn ${
              data?.length != limit ? "disabled" : ""
            }`}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, FieldArray, Field, ErrorMessage } from "formik";
import { Eye, Pencil, Slice, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { DateTime } from "luxon";
import { start } from "repl";
import ImprovedPagination from "../UI/ImprovedPagination";
import SuggestiveSearchInput from "../UI/SuggestiveSearchInput";

export default function OrderListView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [order, setOrder] = useState("Order");
  // const [sort_by, setSort_by] = useState("Sort By");
  const {
    data: ordersData,
    refetch: refetchOrdersData,
    isFetching,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "get_order",
      page,
      search,
      limit,
      startDate,
      endDate,
      // sort_by,
      // order,
    ],
    queryFn: async () => {
      if (startDate && endDate) {
        const response = await fetch(
          `/api/v1/get_order?page=${page}&search=${encodeURIComponent(
            search
          )}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );
        const result = await response.json();

        if (response.ok) {
          return result;
        } else {
          throw new Error("Something went wrong while fetching site list.");
        }
      } else {
        const response = await fetch(
          `/api/v1/get_order?page=${page}&search=${encodeURIComponent(
            search
          )}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );
        const result = await response.json();

        if (response.ok) {
          return result;
        } else {
          throw new Error("Something went wrong while fetching site list.");
        }
      }
    },
    retry: 1,
  });

  const navigator = useRouter();
  const supabase = createClient();
  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [orderid, setOrderid] = useState<string | null>(null);
  const [orderformdisplay, setOrderformdisplay] = useState<string | null>(null);
  
  const [editableRowProd, setEditableRowProd] = useState<number | null>(null);
  
  const [numberControl, setNumberControl] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState("tab1");
  const [filterPalleteCount, setFilterPalleteCount] = useState(1);
  const [enablepallete, setEnablePallete] = useState(false);
  const [enableplus, setenableplus] = useState(true);
  const [lastpalleteCount, setLastpalleteCount] = useState<number | 1>(1);
  const [tractnumbercontrollenght, setTractnumbercontrollenght] = useState<number|null>(null);
  const [isbuttonhide, setisbuttonhide] = useState<boolean>(false);
  const [isfieldhide, setisfieldhide] = useState<boolean>(false);
  const [isfieldhideproof, setisfieldhideproof] = useState<boolean>(false);
 
  const [retrievedentryDateTime, setRetrievedentryDateTime] = useState<string | null>(null);
  const [retrievedexitDateTime, setRetrievedexitDateTime] = useState<string | null>(null);
  const [isMaxRow,setisMaxRow] = useState<boolean>(false);


  console.log("current enablepallete: ", enablepallete);
  console.log("rows lenght",tractnumbercontrollenght);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setUseremail(data.user?.user_metadata.email || null);
      setUserRole(data.user?.user_metadata.role || null);
      setUserID(data.user?.id || null);
    };

    fetchUserEmail();
  }, [supabase.auth]);

  const { data: customersData } = useQuery({
    queryKey: ["get_customer", page, search, limit],
    queryFn: async () => {
      console.log("Fetching Data with:", { page, search, limit }); // Debug
      const response = await fetch(`/api/v1/get_customer`, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        },
        redirect: "follow",
      });
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
  const ordersWithCustomerNames =
    ordersData?.data?.map((order: any) => {
      const customer = customersData?.data?.find(
        (cust: any) => cust.id === order.customer_id
      );

      return {
        ...order,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
      };
    }) || [];
  console.log("Orders With Customer Names:", ordersWithCustomerNames);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModal] = useState(false);
  const [initialValues, setInitialValues] = useState({
    rows: [
      {
        production_order_form_id: "",
        production_entry_date_time: "",
        production_exit_date_time: "",
      },
    ],
    rows2: [
      {
        production_id: "",
        production_order_form_id: "",
        production_entry_date_time: "",
        production_exit_date_time: "",
      },
    ],
  });


  const validationSchema = Yup.object({
    rows: Yup.array().of(
      Yup.object().shape({
        production_entry_date_time: Yup.date()
          .required("Entry Date & Time is required")
          .typeError("Invalid date format"),
        production_exit_date_time: Yup.date()
          .required("Exit Date & Time is required")
          .typeError("Invalid date format"),
      })
    ),
  });


  const { data: fetchedProductionData, refetch: refetchProductionData } =
    useQuery({
      queryKey: ["production", orderid],
      queryFn: async () => {
        const response = await fetch(`/api/v1/getoneorder/?id=${orderid}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch production data: ${response.status}`
          );
        }
        return response.json();
      },
      enabled: !!orderid,
    });

  useEffect(() => {
    if (fetchedProductionData?.length > 0) {
      const productionData = fetchedProductionData[0];
      setisbuttonhide(false);
      // setisfieldhide(true);
      setRetrievedentryDateTime(productionData.entry_date_time);
      setRetrievedexitDateTime(productionData.exit_date_time);
      if(productionData.entry_date_time ===null && productionData.exit_date_time ===null){
        setisfieldhide(false);
      }else{
        setisfieldhide(true);
      }
      //setEditproductionID(productionData.id);
      setInitialValues((prev) => ({
        ...prev,
        rows2: fetchedProductionData.map((data: any) => ({
          production_id: data.id,
          production_order_form_id: data.order_form_id,
          production_entry_date_time: data.entry_date_time,
          production_exit_date_time: data.exit_date_time,
        })),
        
      }));
      
    } else {
      setisbuttonhide(true);
      // setisfieldhide(false);
      setInitialValues((prev) => ({
        ...prev,
        rows2: [
          {
            production_id: "",
            production_order_form_id: "",
            production_entry_date_time: "",
            production_exit_date_time: "",
            ishidefield: false,
          },
        ],
      }));
    }
  }, [fetchedProductionData, refetchProductionData]);
  console.log("fetchedProductionData", fetchedProductionData?.length);
  
        console.log("updated entry",retrievedentryDateTime);

  const updateProductionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(
        `/api/v1/edit_production?id=${orderid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entry_date_time: updatedData.production_entry_date_time,
            exit_date_time: updatedData.production_exit_date_time,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update production data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update production data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Production data updated successfully");
      refetchProductionData();
    },
  });


  const {
    data: customerData,
    isFetching: isFetchingCustomers,
    isError: isErrorCustomers,
    refetch: refetchAssignData,
  } = useQuery({
    queryKey: ["get_users", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_users?page=${page}&search=${search}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      return response.json();
    },
    staleTime: 5000,
    retry: 2,
    // Handle error inside the query function
  });

  const customerOptions =
    customerData?.data.map((customer: any) => ({
      value: customer.uuid,
      label: `${customer.first_name} ${customer.last_name}`,
    })) || [];

  const AssignOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();

      // Return status and response data
      return {
        status: response.status,
        data: responseData,
      };
    },
    onError: (error) => {
      toast.error("Failed to add assignee");
    },
    onSuccess: ({ status, data }) => {
      if (status === 200) {
        // Handle success for user creation
        toast.success("Assign added successfully");
        refetchAssignData();
        // Delay navigation by 2 seconds (2000 milliseconds)
        setTimeout(() => {
          navigator.push("/dashboard/order_management");
        }, 2000);
      } else if (status === 409) {
        // Handle conflict (e.g., user already exists)
        toast.error(
          "The email is already registered. Please use a different email and try again."
        );
      } else {
        // Handle other non-success statuses
        toast.error("An unexpected error occur  red. Please try again.");
      }
    },
    onMutate: (data) => {
      return data;
    },
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
              placeholder="Search OF ID"
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
              setStartDate("");
              setEndDate("");
              setSearch("");
              setPage(1);
              setSearchInputValue("");
            }}
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">OF ID</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Production Entry Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Production Exit Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-24">OPTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12">
                      <div className="flex justify-center items-center">
                        <span className="loading loading-dots loading-md text-blue-900"></span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="px-4 py-8 text-red-600 font-bold" colSpan={4}>
                      Something went wrong while fetching orders list.
                    </td>
                  </tr>
                ) : ordersData?.data?.length > 0 ? (
                  ordersData.data.map((order: any, index: number) => (
                    <tr 
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-2 py-2.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:cursor-pointer transition-colors duration-200 whitespace-nowrap">
                        {order.order_fabrication_control}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {order.entry_date_time
                          ? DateTime.fromISO(order.entry_date_time, { zone: "utc" }).toFormat("dd/MM/yy hh:mm a")
                          : " "}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {order.exit_date_time
                          ? DateTime.fromISO(order.exit_date_time, { zone: "utc" }).toFormat("dd/MM/yy hh:mm a")
                          : " "}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                            onClick={() => {
                              setIsModalOpen(true);
                              setOrderid(order.id);
                              setOrderformdisplay(order.order_fabrication_control);
                              setNumberControl(3);
                              setFilterPalleteCount(order.pallete_count);
                            }}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 font-bold text-gray-500" colSpan={4}>
                      NO DATA FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-t-2 border-blue-200/50">
                  <td colSpan={4} className="px-4 py-2.5">
                    <span className="text-xs font-medium text-blue-900">
                      {ordersData?.total_count
                        ? `${(page - 1) * limit + 1}-${Math.min(
                            page * limit,
                            ordersData.total_count
                          )} of ${ordersData.total_count} Order Fabrication Found`
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
            totalCount={ordersData?.total_count || 0}
            limit={limit}
            onPageChange={setPage}
            className=""
          />
        </div>

        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-full">
              <div className="flex place-content-end"></div>
              <div role="tablist" className="tabs tabs-lifted">
                <input
                  type="radio"
                  name="my_tabs_2"
                  role="tab"
                  className="tab"
                  aria-label="Production"
                  id="tab1"
                  checked={selectedTab === "tab1"}
                  onChange={() => setSelectedTab("tab1")}
                />
                <div
                  role="tabpanel"
                  className="tab-content bg-base-100 border-base-300 rounded-box p-6"
                >
                  <Formik
                    initialValues={initialValues}
                    enableReinitialize={true}
                    validationSchema={validationSchema}
                    onSubmit={async (values) => {
                      try {
                        for (const row of values.rows) {
                          if (orderid) {
                            await updateProductionMutation.mutateAsync({
                              production_entry_date_time: row.production_entry_date_time,
                              production_exit_date_time: row.production_exit_date_time,
                            });
                          }
                        }
                      } catch (error) {
                        toast.error("Failed to complete operation");
                        console.error("Error in mutation:", error);
                      }
                    }}
                  >
                    {({ values, setFieldValue, errors, touched }) => (
                      console.log(values),
                      (
                        <Form>
                          <div className="">
                            <FieldArray
                              name="rows"
                              render={(arrayHelpers) => (
                                <div>
                                  <div className="flex place-content-end gap-3">
                                    {retrievedentryDateTime === null && retrievedexitDateTime=== null ? (
                      
                                      <button
                                        className="btn btn-primary"
                                        type="submit"
                                      >
                                        Save Production
                                      </button>
                                    ) : null}
                                    <button
                                      className="btn btn-accent"
                                      onClick={() => {
                                        refetchOrdersData();
                                        setEditableRowProd(null);
                                        setIsModalOpen(false);
                                        setOrderid(null);
                                   
                                        refetchProductionData();
                                    
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="text-black overflow-auto">
                                    <table className="table relative text-center overflow-auto">
                                      <thead className="text-black text-sm">
                                        <tr>
                                          {/* <th>Article Name</th> */}
                                          {/* <td></td> */}
                                          <th>OF_ID</th>
                                          <th>Entry Date & Time</th>
                                          <th>Exit Date & Time</th>
                                          <th>Action</th>
                                        </tr>
                                      </thead>
                                      {/* tbody for length */}
                                      {values.rows.map((row, index) => (
                                        <React.Fragment key={index}>
                                          <tbody>
                                            <tr>
                                              <td>
                                                <Field
                                                  readOnly
                                                  value={orderformdisplay}
                                                  name={`rows.${index}.production_order_form_id`}
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md 
                                                    ${
                                                    isfieldhide
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }
                                                  `}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rows.${index}.production_entry_date_time`}
                                                  type="datetime-local"
                                                  className={`input input-bordered 
    ${
      typeof errors.rows?.[index] === "object" &&
      errors.rows?.[index]?.production_entry_date_time &&
      touched.rows?.[index]?.production_entry_date_time
        ? "border-red-500"
        : ""
    } 
    ${isfieldhide ? "hidden" : "bg-white"}
  `}
                                                />

                                                <ErrorMessage
                                                  name={`rows.${index}.production_entry_date_time`}
                                                  component="div"
                                                  className="text-red-500 text-sm"
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rows.${index}.production_exit_date_time`}
                                                  type="datetime-local"
                                                  className={`input input-bordered ${
                                                    typeof errors.rows?.[
                                                      index
                                                    ] === "object" &&
                                                    errors.rows?.[index]
                                                      ?.production_exit_date_time &&
                                                    touched.rows?.[index]
                                                      ?.production_exit_date_time
                                                      ? "border-red-500"
                                                      : ""
                                                  }${
                                                    isfieldhide
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }
                                                  `}
                                                />
                                                <ErrorMessage
                                                  name={`rows.${index}.production_exit_date_time`}
                                                  component="div"
                                                  className="text-red-500 text-sm"
                                                />
                                              </td>
                                              <td>
                                                {/* <button
                                                  className= {`btn btn-error bg-red ${isfieldhide ? "hidden" : "bg-white"}`}
                                                  type="button"
                                                  onClick={() =>
                                                    arrayHelpers.remove(index)
                                                  }
                                                >
                                                  Remove
                                                </button> */}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </React.Fragment>
                                      ))}

                                      {/* second FieldArray */}
                                      {isLoading || isFetching ? (
                                        <tr>
                                          <td colSpan={7}>
                                            <span className="loading loading-dots loading-md"></span>
                                          </td>
                                        </tr>
                                      ) : isError ? (
                                        <tr>
                                          <td
                                            className="text-error font-bold"
                                            colSpan={7}
                                          >
                                            Something went wrong while fetching
                                            orders list.
                                          </td>
                                        </tr>
                                      ) : retrievedentryDateTime === null && retrievedexitDateTime === null ? (
                                        <p className="text-center text-sm text-slate-600">
                                          No Production Data Found
                                        </p>
                                      ) : (
                                        <FieldArray
                                          name="rows2"
                                          render={(arrayHelpers) => (
                                            <tbody>
                                              <tr>
                                                <td></td>
                                              </tr>
                                              {values.rows2.map(
                                                (row, index) => (
                                                  <tr key={index}>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_order_form_id`}
                                                        type="text"
                                                        value={orderformdisplay}
                                                        className="input input-bordered"
                                                        readOnly
                                                      />
                                                    </td>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_entry_date_time`}
                                                        type="datetime-local"
                                                        className="input input-bordered"
                                                        value={
                                                          values.rows2[index]
                                                            .production_entry_date_time
                                                            ? values.rows2[
                                                                index
                                                              ].production_entry_date_time.slice(
                                                                0,
                                                                16
                                                              )
                                                            : ""
                                                        }
                                                        onChange={(e: any) => {
                                                          const newValue =
                                                            e.target.value;
                                                          setFieldValue(
                                                            `rows2.${index}.production_entry_date_time`,
                                                            newValue
                                                          );
                                                        }}
                                                        readOnly={
                                                          editableRowProd !==
                                                          index
                                                        }
                                                      />
                                                    </td>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_exit_date_time`}
                                                        type="datetime-local"
                                                        className="input input-bordered"
                                                        value={
                                                          values.rows2[index]
                                                            .production_exit_date_time
                                                            ? values.rows2[
                                                                index
                                                              ].production_exit_date_time.slice(
                                                                0,
                                                                16
                                                              )
                                                            : ""
                                                        }
                                                        onChange={(e: any) => {
                                                          const newValue =
                                                            e.target.value;
                                                          setFieldValue(
                                                            `rows2.${index}.production_exit_date_time`,
                                                            newValue
                                                          );
                                                        }}
                                                        readOnly={
                                                          editableRowProd !==
                                                          index
                                                        }
                                                      />
                                                    </td>

                                                    <td className="border-y border-slate-500">
                                                      <div className="flex gap-2">
                                                        {editableRowProd ===
                                                        index ? (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className="btn btn-success"
                                                              onClick={async () => {
                                                                try {
                                                                  await updateProductionMutation.mutateAsync(
                                                                    {
                                                                      production_id:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_id,
                                                                      production_entry_date_time:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_entry_date_time,
                                                                      production_exit_date_time:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_exit_date_time,
                                                                    }
                                                                  );
                                                                  setEditableRowProd(
                                                                    null
                                                                  ); // Reset editable row after saving
                                                                } catch (error) {
                                                                  console.error(
                                                                    "Error in mutation:",
                                                                    error
                                                                  );
                                                                }
                                                              }}
                                                            >
                                                              Save
                                                            </button>
                                                            <button
                                                              className="btn btn-primary"
                                                              type="button"
                                                              onClick={() => {
                                                                // Alert first, then reset the editable row and refetch data
                                                                if (
                                                                  window.confirm(
                                                                    "Are you sure you want to cancel?"
                                                                  )
                                                                ) {
                                                                  setTractnumbercontrollenght(
                                                                    0
                                                                  );
                                                                  setEditableRowProd(
                                                                    null
                                                                  ); // Reset the editable state
                                                                  refetchProductionData(); // Trigger the refetch
                                                                  // Close the modal first
                                                                  setIsModalOpen(
                                                                    false
                                                                  );

                                                                  // Reopen it after a small delay
                                                                  setTimeout(
                                                                    () => {
                                                                      setIsModalOpen(
                                                                        true
                                                                      );
                                                                      setSelectedTab(
                                                                        "tab1"
                                                                      );
                                                                    },
                                                                    100
                                                                  ); // Delay of 100ms to ensure the close transition happens
                                                                }
                                                              }}
                                                            >
                                                              Cancel
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className={`btn btn-primary ${
                                                                editableRowProd !==
                                                                null
                                                                  ? "hidden"
                                                                  : ""
                                                              }`}
                                                              onClick={() =>
                                                                setEditableRowProd(
                                                                  index
                                                                )
                                                              }
                                                            >
                                                              Edit
                                                            </button>
                                                            {/* <button
                                                              type="button"
                                                              className={`btn btn-error ${
                                                                editableRowProd !==
                                                                null
                                                                  ? "hidden"
                                                                  : ""
                                                              } ${
                                                                removeProductionMutation.isPending
                                                                  ? "loading"
                                                                  : ""
                                                              }`}
                                                              onClick={() => {
                                                                const isConfirmed =
                                                                  window.confirm(
                                                                    "Are you sure you want to remove this production?"
                                                                  );
                                                                if (
                                                                  isConfirmed
                                                                ) {
                                                                  removeProductionMutation.mutate(
                                                                    {
                                                                      production_id:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_id,
                                                                      is_exist:
                                                                        false,
                                                                    }
                                                                  );
                                                                }
                                                              }}
                                                            >
                                                              Remove
                                                            </button> */}
                                                          </>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          )}
                                        />
                                      )}
                                    </table>
                                  </div>
                                </div>
                              )}
                            />
                          </div>
                        </Form>
                      )
                    )}
                  </Formik>
                </div>

                
             
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

"use client";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, FieldArray, Field, ErrorMessage } from "formik";
import { Eye, Pencil, Search, Slice, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, use } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { DateTime } from "luxon";
import { start } from "repl";

export default function OrderListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

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
    <div className="overflow-x-auto mt-4 w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/"> </Link>
          </li>
          <li>
            <span>Production Management</span>
          </li>
        </ul>
      </div>
      <div className="w-11/12 flex flex-col mx-auto gap-y-12 h-full">
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex gap-4">
            <label className="input mt-auto pr-0 input-bordered flex flex-row justify-center items-center">
              <input
                type="text"
                ref={searchInput}
                className="grow w-full"
                placeholder="Search OF ID"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const searchValue = searchInput.current?.value || "";
                    console.log("Search Triggered:", searchValue); // Debug
                    setSearch(searchValue);
                    setPage(1); // Reset to page 1
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
           
          
            {/* <div className="flex flex-col">
              <label className="text-black invisible">End Date: </label>
              <Link
                href="/dashboard/addorder"
                className="btn my-auto btn-primary"
              >
                Add Order
              </Link>
            </div> */}
            <div className="flex flex-col">
              <label className="text-black invisible">End Date: </label>
              <button
                className="btn my-auto btn-info"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  // setOrder("Order");
                  // setSort_by("Sort By");
                  setSearch("");
                  setPage(1);
                  if (searchInput.current) {
                    searchInput.current.value = "";
                  }
                }}
              >
                Refresh
              </button>
            </div>

            {/* <button
    onClick={() => {
      setSearch(searchInput.current?.value || "");
      setPage(1);
    }}
    className="btn btn-sm btn-primary"
  >
    Search
  </button> */}
          </div>
        </div>

        <table className="table text-center">
          <thead>
            <tr>
              <th>OF ID</th>
            
              <th>Production Entry Date</th>
              <th>Production Exit Date</th>
              {/* <th>OPTIONS</th> */}
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
            ) : ordersData?.data?.length > 0 ? (
              ordersData.data.map((order: any, index: number) => (
                <tr key={index}>
                  <td
                    className="text-xs "
                    onClick={() => {
                      // setIsModalOpen(true);
                      // setOrderid(order.id);
                      // setOrderformdisplay(order.order_fabrication_control);
                      // setNumberControl(3);
                      // setFilterPalleteCount(order.pallete_count);
                    }}
                  >
                    {order.order_fabrication_control}
                  </td>
                  {/* <td>{order.product_name ? order.product_name: " "}</td> */}
                  {/* <td>{order.tbl_customer?.company_name ? order.tbl_customer?.company_name: " "}</td>
                  <td>{order.tbl_article?.article_name ? order.tbl_article?.article_name: " "}</td>
                  <td>{order.pallete_count ? order.pallete_count : " "}</td> */}
                  <td>
                    {order.entry_date_time
                      ? DateTime.fromISO(order.entry_date_time, { zone: "utc" }).toFormat("dd/MM/yy hh:mm a")
                      : " "}
                  </td>
                  <td>
                    {order.exit_date_time
                      ? DateTime.fromISO(order.exit_date_time,{zone:"utc"}).toFormat(
                          "dd/MM/yy hh:mm a"
                        )
                      : " "}
                  </td>

                  <td className="justify-center items-center flex gap-4">
                 
                      <button
                        className="btn text-black btn-link"
                        onClick={() => {
                          setIsModalOpen(true);
                      setOrderid(order.id);
                      setOrderformdisplay(order.order_fabrication_control);
                      setNumberControl(3);
                      setFilterPalleteCount(order.pallete_count);
                        }}
                      >
                        <Pencil className="text-warning" /> Edit
                      </button>
                    
                    
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
              <td colSpan={7}>
                <span className="text-xs">
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
                  prev * limit < (ordersData?.total_count || 0)
                    ? prev + 1
                    : prev
                )
              }
              className={`join-item btn ${
                page * limit >= (ordersData?.total_count || 0) ? "disabled" : ""
              }`}
              disabled={page * limit >= (ordersData?.total_count || 0)}
            >
              »
            </button>
          </div>
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

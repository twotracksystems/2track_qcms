"use client";

import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";

export default function EditProductionList(params: any) {
  const navigator = useRouter();
  const [assignId, setAssignId] = useState("");
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const id = params.params;
  const [userID, setUserID] = useState<string | null>(null);
  const supabase = createClient();
    useEffect(() => {
      const fetchUserEmail = async () => {
        const { data } = await supabase.auth.getUser();
        setUserID(data.user?.id || null);
      };
  
      fetchUserEmail();
    }, [supabase.auth]);
  const {
    data: ordersData,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["get_order", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_order?page=${page}&search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Something went wrong while fetching order list.");
      }
      return response.json();
    },
  });

  const Validation = Yup.object().shape({
    order_form_id: Yup.string().required("Order Form ID is required"),
    entry_date_time: Yup.string().required("Entry Date Time is required"),
    exit_date_time: Yup.string().required("Exit Date Time is required"),
  });
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Converts to 'YYYY-MM-DD'
  };
  
  const [initialValues, setInitialValues] = useState({
    order_form_id: "",
    entry_date_time: "",
    exit_date_time: "",
  });
  const {
    data: productionData,
    isLoading: isproductionLoading,
    isSuccess: isproductionSuccess,
    isError: isproductionError,
    error: productionError,
  } = useQuery({
    queryKey: ["get_prodution", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getoneproductionform/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch production data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", productionData);
  useEffect(() => {
    if (isproductionSuccess && productionData && productionData.length > 0) {
      const user = productionData[0]; // Get the first user object
      setInitialValues((prev) => ({
        ...prev,
        order_form_id: user.order_form_id || "",
        entry_date_time: user.entry_date_time ? formatDate(user.entry_date_time) : "",
        exit_date_time: user.exit_date_time ? formatDate(user.exit_date_time) : "",
      }));
    }
  }, [isproductionSuccess, productionData]);
  
  const updateProductionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_production?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_form_id: data.order_form_id,
          entry_date_time: data.entry_date_time,
          exit_date_time: data.exit_date_time,
          // updated_by: userID,
        }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.json())?.error || "Failed to update production"
        );
      }
      return response.json();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update production");
    },
    onSuccess: (data) => {
      toast.success("Production updated successfully");
      navigator.push("/dashboard/production_management");
    },
  });

const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const removeProductionMutation = useMutation({
    mutationFn: async (data:any) => {
      const response = await fetch(`/api/v1/remove_production?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_exist: data.is_exist,
        }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.json())?.error || "Failed to remove production"
        );
      }
      return response.json();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove production");
    },
    onSuccess: (data) => {
      toast.success("Production removed successfully");
      navigator.push("/dashboard/production_management");
    },
  });
  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/production_management">
              Production Management
            </Link>
          </li>
          <li>
            <span>Edit Production</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-row justify-end items-center m-4">
        {/* Remove User Button */}
        <button
          className="btn btn-error btn-md"
          onClick={() => setIsRemoveModalOpen(true)}
        >
          <Trash2 /> Remove Customer
        </button>
      </div>
      <Formik
      enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={Validation}
        onSubmit={(values) => {
         updateProductionMutation.mutate(values);
        }}
      >
        {({ errors, touched ,values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Production Details</h1>
                <div className="grid grid-cols-3 gap-6 w-full">
                  <div className="flex flex-col gap-y-4">
                  <label className="label">Select OF ID</label>
  {isFetching ? (
    <span>Loading orders...</span>
  ) : isError ? (
    <span className="text-red-500">Failed to load orders.</span>
  ) : (
    <Field
      as="select"
      name="order_form_id"
      className="select select-bordered"
    >
      <option value="" disabled>
        Select an OF ID
      </option>
      {ordersData?.data.map((order: any) => (
        <option key={order.id} value={order.id}>
          Order Name:{" "}
          {order.tbl_customer?.company_name || "Unknown"} (ID: {order.id})
        </option>
      ))}
    </Field>
  )}
                    <label className="label">Entry Date Time</label>
                    <Field
                      type="date"
                      name="entry_date_time"
                      placeholder="Entry Date Time"
                      className="input input-bordered"
                    />
                    {errors.entry_date_time && touched.entry_date_time ? (
                      <div className="text-red-500">{errors.entry_date_time}</div>
                    ) : null}

                    <label className="label">Exit Date Time</label>
                    <Field
                      type="date"
                      name="exit_date_time"
                      placeholder="Exit Date Time"
                      className="input input-bordered"
                    />
                    {errors.exit_date_time && touched.exit_date_time ? (
                      <div className="text-red-500">{errors.exit_date_time}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-action p-6">
              <button
                type="submit"
                className="btn btn-primary btn-md flex items-center"
               
              >
                <Pencil className="mr-2" /> Edit Production
              </button>
              <Link
                className="btn btn-accent"
                href="/dashboard/production_management"
              >
                BACK
              </Link>
            </div>
          </Form>
        )}
      </Formik>
      {/* Remove User Modal */}
      {isRemoveModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confirm Removal</h3>
            <p>
              Are you sure you want to remove this production? This action cannot
              be undone.
            </p>
            <div className="modal-action">
              <button
                onClick={() => {
                  removeProductionMutation.mutate({ is_exist: false });
                }}
                className={`btn btn-error ${
                  removeProductionMutation.isPending ? "loading" : ""
                }`}
              >
                {removeProductionMutation.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Removing Production...
                  </>
                ) : (
                  "Remove Production"
                )}
              </button>
              <button
                onClick={() => setIsRemoveModalOpen(false)}
                className="btn btn-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

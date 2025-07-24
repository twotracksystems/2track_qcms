"use client";

import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";

export default function AddProductionList() {
  const navigator = useRouter();
  const [assignId, setAssignId] = useState("");
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

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

  const AddOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to add production");
      }
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to add production");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Production Added Successfully");
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
            <span>Add Production</span>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={{
          order_form_id: "",
          entry_date_time: "",
          exit_date_time: "",
        }}
        validationSchema={Validation}
        onSubmit={(values) => {
          // alert(JSON.stringify(values, null, 2));
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
                  onClick={() => AddOrderMutation.mutate({
                    user_id: userID,
                    order_form_id: values.order_form_id,
                    entry_date_time: values.entry_date_time,
                    exit_date_time: values.exit_date_time,
                  }
                )}
              >
                <Plus className="mr-2" /> Add Production
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
    </div>
  );
}

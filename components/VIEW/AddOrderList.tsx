"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleHelp, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormInput, FormSearchableSelect } from "../UI/FormInput";
import { useState, useRef, useCallback } from "react";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
import AsyncSelect from "react-select/async";
export default function AddOrderList() {
  const navigator = useRouter();
  useEscapeNavigation("/dashboard/order_management");

  const Add_Order_Validator = Yup.object().shape({
    OFId: Yup.string().required("Id is required"),
    // product_name: Yup.string().required("Product Name is required"),
    CustomerName: Yup.string().required("Customer Name is required"),
    ArticleName: Yup.string().required("Article Name is required"),
    PalleteCount: Yup.string().required("Pallete Count is required"),
    // AssigneeName: Yup.string().required("Assignee is required"),
  });

  const AddOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? "Failed to add order");
      }
      return result;
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to add order");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Order Added Successfully");
      navigator.push("/dashboard/order_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1); // Pagination support
  const [search, setSearch] = useState(""); // Search input
  const limit = 10; // Items per page

  const {
    data: customerData,
    isFetching: isFetchingCustomers,
    isError: isErrorCustomers,
  } = useQuery({
    queryKey: ["get_customer", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_customers?page=${page}&search=${search}&limit=${limit}`,
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
    staleTime: 5000, // Avoid flickering on refetch
    retry: 2,
  });

  const customerOptions =
    customerData?.data.map((customer: any) => ({
      value: customer.id,
      label: `${customer.company_name} `,
    })) || [];

  const {
    data: assigneeData,
    isFetching: isFetchingAssignees,
    isError: isErrorAssignees,
  } = useQuery({
    queryKey: ["get_users", page, search],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_users?page=${page}&search=${search}`,
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
    staleTime: 5000, // Avoid flickering on refetch
    retry: 2,
  });

  const assignOptions =
    assigneeData?.data.map((assignee: any) => ({
      value: assignee.uuid,
      label: `${assignee.first_name} ${assignee.last_name}`,
    })) || [];

  const articleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadArticleOptions = useCallback(
    (inputValue: string): Promise<{ value: string; label: string }[]> =>
      new Promise((resolve) => {
        if (articleDebounceRef.current) {
          clearTimeout(articleDebounceRef.current);
        }
        articleDebounceRef.current = setTimeout(async () => {
          const search = (inputValue || "").trim();
          const url = `/api/v1/get_article_prod_options?search=${encodeURIComponent(search)}&limit=50`;
          try {
            const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
            if (!res.ok) {
              resolve([]);
              return;
            }
            const json = await res.json();
            const options = (json?.data || []).map((row: { id: number; article: string | number }) => ({
              value: String(row.id),
              label: String(row.article ?? ""),
            }));
            resolve(options);
          } catch {
            resolve([]);
          }
        }, 300);
      }),
    []
  );

  return (
    <div className="overflow-x-auto w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        {/* Page Title */}
        <div className="mb-2">
          <h1 className="text-xl font-bold text-blue-900">Add Order</h1>
        </div>

        <Formik
          initialValues={{
            OFId: "",
            // product_name: "",
            CustomerName: "",
            ArticleName: "",
            ArticleNameLabel: "", // display label (article number) so we show "7440518" not "1"
            // AssigneeName: "",
            PalleteCount: "",
          }}
          validationSchema={Add_Order_Validator}
          onSubmit={async (e, actions) => {
            AddOrderMutation.mutate({
              order_fabrication_control: e.OFId,
              // product_name: e.product_name,
              customer_id: e.CustomerName,
              article_id: e.ArticleName,
              // assignee: e.AssigneeName,
              pallete_count: e.PalleteCount,
            });
          }}
        >
          {({ errors, touched, values, setFieldValue, setValues }) => (
            <Form>
              <div className="flex flex-col gap-y-3">
                {/* Form Container with matching styling */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden p-6">
                  <h1 className="text-lg font-bold text-blue-900 mb-6 pb-3 border-b border-blue-200/50">Order Details</h1>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <div>
                      <FormInput
                        tooltip="Enter the order ID"
                        name="OFId"
                        type="number" 
                        placeholder="Order ID"
                        label="Order ID"
                        errors={errors.OFId ? errors.OFId : ""}
                        touched={touched.OFId ? "true":"" }// Adjust as needed
                      />
                    </div>
                    <div>
                      <label className="form-control w-full max-w-lg">
                        <FormSearchableSelect
                          name="CustomerName"
                          label="Customer Name"
                          placeholder="Choose a customer"
                          tooltip="Select the customer's name from dropdown"
                          errors={errors.CustomerName}
                          touched={touched.CustomerName ? "true" :"" }// Adjust as needed
                          options={customerOptions}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="form-control w-full max-w-lg">
                        <div className="label">
                          <span className="label-text font-bold gap-x-2 flex flex-row">
                            ID Article
                            <span className="tooltip tooltip-right" data-tip="Select the ID Article from dropdown (search by article number or designation)">
                              <CircleHelp className="my-auto" size={20} strokeWidth={0.75} />
                            </span>
                          </span>
                        </div>
                        <AsyncSelect
                          instanceId="add-order-article-select"
                          loadOptions={loadArticleOptions}
                          defaultOptions
                          cacheOptions
                          value={
                            values.ArticleName
                              ? {
                                  value: values.ArticleName,
                                  label: values.ArticleNameLabel || values.ArticleName,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            setValues((prev) => ({
                              ...prev,
                              ArticleName: selected ? selected.value : "",
                              ArticleNameLabel: selected ? selected.label : "",
                            }));
                          }}
                          placeholder="Choose a ID Article (type to search)"
                          className="text-lg bg-white select-bordered mx-auto w-full max-w-md"
                          classNamePrefix="react-select"
                        />
                        {errors.ArticleName && touched.ArticleName ? (
                          <span className="text-error flex flex-row">{errors.ArticleName}</span>
                        ) : (
                          <span className="text-error invisible flex flex-row">Error</span>
                        )}
                      </label>
                    </div>
                    <div>
                      <label className="form-control w-full max-w-lg">
                        <div className="label">
                          <span className="label-text font-bold gap-x-2 flex flex-row">
                            Pallete Count
                            <span
                              className="tooltip tooltip-right"
                              data-tip="Pallet count is the number of pallets that will be used for this order."
                            >
                              <CircleHelp
                                className=" my-auto"
                                size={20}
                                strokeWidth={0.75}
                              />
                            </span>
                          </span>
                        </div>
                        <Field
                          type="number"
                          placeholder="Pallete Count"
                          name="PalleteCount"
                          className={`input input-bordered w-full max-w-md ${
                            errors.PalleteCount && touched.PalleteCount
                              ? "input-error"
                              : ""
                          }`}
                        />
                      </label>

                      {errors.PalleteCount && touched.PalleteCount ? (
                        <span className="text-error  flex flex-row">
                          {errors.PalleteCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Action Buttons with matching styling */}
                <div className="flex justify-end gap-3 mt-4">
                  <Link
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-gray-400/20"
                    href="/dashboard/order_management"
                  >
                    BACK
                  </Link>
                  <button
                    type="submit"
                    className={`px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-500/20 flex items-center gap-2 ${
                      AddOrderMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={AddOrderMutation.isPending}
                  >
                    {AddOrderMutation.isPending ? (
                      <>
                        <span className="loading loading-dots loading-sm"></span>
                        Adding order...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Add Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

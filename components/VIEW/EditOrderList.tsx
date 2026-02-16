"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormInput, FormSearchableSelect, FormSelect } from "../UI/FormInput";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
export default function AddOrderList(params:any) {
  
  const router = useRouter();
  useEscapeNavigation("/dashboard/order_management");
  const id=params.params;
const supabase = createClient(); 
   const [UserRole,setUserRole] = useState<string | null>(null);
    useEffect(() => {
       const fetchUserEmail = async () => {
         const { data } = await supabase.auth.getUser();
         setUserRole(data.user?.user_metadata.role || null);
         console.log("User Data:", data);
       };
       
       fetchUserEmail();
     }, [supabase.auth]);
       console.log("UserRole:", UserRole);
  const [initialValues, setInitialValues] = useState({
    Id: "",
    // product_name: "",
    CustomerName: "",
    ArticleName: "",
    ArticleNameLabel: "",
    PalleteCount: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    data: userData,
    isLoading: isUserLoading,
    isSuccess,
    isError,
    error: userError,
  } = useQuery({
    queryKey: ["order_by_id", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/get_order_by_id?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order data: ${response.status}`);
      }
      return response.json(); // Expecting an array (tbl_prod order)
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", userData);
  useEffect(() => {
    if (isSuccess && userData && userData.length > 0) {
      const user = userData[0]; // Get the first order object (from tbl_prod)
      const articleId = user.article_id;
      setInitialValues((prev) => ({
        ...prev,
        Id: user.order_fabrication_control != null ? String(user.order_fabrication_control) : "",
        CustomerName: user.customer_id ?? "",
        ArticleName: articleId ?? "",
        ArticleNameLabel: "",
        PalleteCount: user.pallete_count != null ? String(user.pallete_count) : "0",
      }));
      if (articleId) {
        fetch(`/api/v1/getonearticleprod?id=${articleId}`)
          .then((r) => r.json())
          .then((data: any[]) => {
            if (data?.length && data[0]?.article != null) {
              setInitialValues((prev) => ({ ...prev, ArticleNameLabel: String(data[0].article) }));
            }
          })
          .catch(() => {});
      }
    }
  }, [isSuccess, userData]);


  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_order?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_fabrication_control: data.Id,
          // product_name: data.product_name,
          customer_id: data.CustomerName,
          article_id: data.ArticleName,
          pallete_count: data.PalleteCount,
        
      }),
    });
      return response.json();
    },
    onError: (error) => { 
      toast.error("Failed to Edit order");
    },
    onSuccess: (data) => {
      toast.success("Order Edit Successfully");
      router.push("/dashboard/order_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const Add_Order_Validator = Yup.object().shape({
    Id: Yup.string().required("Id is required"),
    // product_name: Yup.string().required("Product Id is required"),
    CustomerName: Yup.string().required("Customer Name is required"),
    ArticleName: Yup.string().required("Article Name is required"),
    PalleteCount: Yup.string().required("Pallete Count is required"),
  });

 
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

  const customerOptions = customerData?.data?.map((customer: any) => ({
    value: customer.id,
    label: `${customer.company_name}`,
  })) || [];
console.log("Customer Data:",customerOptions);
  const articleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadArticleOptions = useCallback(
    (inputValue: string): Promise<{ value: string; label: string }[]> =>
      new Promise((resolve) => {
        if (articleDebounceRef.current) {
          clearTimeout(articleDebounceRef.current);
        }
        articleDebounceRef.current = setTimeout(async () => {
          const searchTerm = (inputValue || "").trim();
          const url = `/api/v1/get_article_prod_options?search=${encodeURIComponent(searchTerm)}&limit=50`;
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

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

const removeCustomerMutation = useMutation({
  mutationFn: async (data: any) => {
    const response = await fetch(`/api/v1/remove_order?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_exist: data.is_exist,
      }),
    });

    if (!response.ok) {
      throw new Error((await response.json())?.error || "Failed to remove customer");
    }

    return response.json();
  },
  onError: (error: any) => {
    toast.error(error.message || "Failed to remove order");
  },
  onSuccess: (data) => {
    toast.success("Order removed successfully");
    router.push("/dashboard/order_management");
  },
});

  return (
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <div className="flex flex-row justify-end items-center mb-4">
          {UserRole === "Super Admin" && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              onClick={() => setIsRemoveModalOpen(true)}
            >
              <Trash2 className="inline mr-2" size={18} /> Remove Order
            </button>
          )}
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={Add_Order_Validator}
          enableReinitialize={true}
          onSubmit={async (e, actions) => {
            updateUserMutation.mutate(e);
          }}
        >
          {({ errors, touched, values, setValues }) => (
            <Form>
              <div className="flex flex-col gap-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 p-8">
                  <h1 className="text-2xl font-bold py-4 text-gray-800 border-b border-gray-200 pb-4 mb-6">Order Details</h1>
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <div>
                      <FormInput
                        tooltip="Enter the order ID"
                        name="Id"
                        type="text"
                        placeholder="Order ID"
                        label="Order ID"
                        errors={errors.Id}
                        touched={touched.Id ? "true" : ""}
                      />
                    </div>
                    <div>
                      <label className="form-control w-full">
                        <FormSearchableSelect
                          name="CustomerName"
                          label="Customer Name"
                          placeholder="Choose a customer"
                          tooltip="Select the customer's name from dropdown"
                          errors={errors.CustomerName}
                          touched={touched.CustomerName ? "true" : ""}
                          options={customerOptions}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="form-control w-full">
                        <div className="label">
                          <span className="label-text font-bold gap-x-2 flex flex-row">
                            ID Article
                            <span className="tooltip tooltip-right" data-tip="Select the ID Article from dropdown (search by article number or designation)">
                              <CircleHelp className="my-auto" size={20} strokeWidth={0.75} />
                            </span>
                          </span>
                        </div>
                        <AsyncSelect
                          instanceId="edit-order-article-select"
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
                          onChange={(selected: { value: string; label: string } | null) => {
                            setValues((prev: any) => ({
                              ...prev,
                              ArticleName: selected ? selected.value : "",
                              ArticleNameLabel: selected ? selected.label : "",
                            }));
                          }}
                          placeholder="Choose a product (type to search)"
                          className="text-lg bg-white select-bordered mx-auto w-full"
                          classNamePrefix="react-select"
                        />
                        {errors.ArticleName && touched.ArticleName ? (
                          <span className="text-error flex flex-row text-sm mt-1">{errors.ArticleName}</span>
                        ) : null}
                      </label>
                    </div>

                    <div>
                      <label className="form-control w-full">
                        <div className="label">
                          <span className="label-text font-bold gap-x-2 flex flex-row">
                            Pallete Count
                            <span
                              className="tooltip tooltip-right"
                              data-tip="Enter a pallete count. This is required."
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
                          type="text"
                          placeholder="Enter Pallete Count"
                          name="PalleteCount"
                          className={`input input-bordered w-full ${
                            errors.PalleteCount && touched.PalleteCount
                              ? "input-error"
                              : ""
                          }`}
                        />
                      </label>

                      {errors.PalleteCount && touched.PalleteCount ? (
                        <span className="text-error flex flex-row text-sm mt-1">
                          {errors.PalleteCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                    updateUserMutation.isPending 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  }`}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <span className="loading loading-dots loading-sm"></span>{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      Save
                    </>
                  )}
                </button>
                <Link
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                  href="/dashboard/order_management"
                >
                  BACK
                </Link>
              </div>
            </Form>
          )}
        </Formik>
        {isRemoveModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="text-lg font-bold">Confirm Removal</h3>
              <p>Are you sure you want to remove this order? This action cannot be undone.</p>
              <div className="modal-action">
                <button
                  onClick={() => {
                    removeCustomerMutation.mutate(
                      {is_exist: false},
                    );
                  }}
                  className={`btn btn-error ${
                    removeCustomerMutation.isPending ? "loading" : ""
                  }`}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setIsRemoveModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormInput, FormSelect } from "../UI/FormInput";
import { useState, useEffect } from "react";
export default function AddOrderList() {
  const navigator = useRouter();

  const Add_Order_Validator = Yup.object().shape({
    Id: Yup.string().required("Id is required"),
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
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to add order");
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
        `/api/v1/get_customer?page=${page}&search=${search}&limit=${limit}`,
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
    data: articleData,
    isFetching: isFetchingArticles,
    isError: isErrorArticles,
  } = useQuery({
    queryKey: ["get_article", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_article?page=${page}&search=${search}&limit=${limit}`,
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

  const articleOptions =
    articleData?.data.map((article: any) => ({
      value: article.id,
      label: `${article.article_name}`,
    })) || [];

  const {
    data: assigneeData,
    isFetching: isFetchingAssignees,
    isError: isErrorAssignees,
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
    staleTime: 5000, // Avoid flickering on refetch
    retry: 2,
  });

  const assignOptions =
    assigneeData?.data.map((assignee: any) => ({
      value: assignee.uuid,
      label: `${assignee.first_name} ${assignee.last_name}`,
    })) || [];

  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/order_management">Order Management</Link>
          </li>
          <li>
            <span>Add Order</span>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={{
          Id: "",
          product_name: "",
          CustomerName: "",
          ArticleName: "",
          AssigneeName: "",
          PalleteCount: "",
        }}
        validationSchema={Add_Order_Validator}
        onSubmit={async (e, actions) => {
          AddOrderMutation.mutate({
            id: e.Id,
            product_name: e.product_name,
            customer_id: e.CustomerName,
            article_id: e.ArticleName,
            assignee: e.AssigneeName,
            pallete_count: e.PalleteCount,
          });
        }}
      >
        {({ errors, touched, values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Order Details</h1>
                <div className="grid grid-cols-2 gap-6 w-full">
                  <div>
                    <FormInput
                      tooltip="Enter the order ID"
                      name="Id"
                      placeholder="Order ID"
                      label="Order ID"
                      errors={errors.Id ? errors.Id : ""}
                      touched={touched.Id ? "true":"" }// Adjust as needed
                    />
                  </div>
                  {/* <div>
                    <FormInput
                      tooltip="Enter the product name"
                      name="product_name"
                      placeholder="Product Name"
                      label="Product Name"
                      errors={errors.product_name ? errors.product_name : ""}
                      touched={touched.product_name ? "true" :""} // Adjust as needed
                    />
                  </div> */}
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <FormSelect
                        tooltip="Select the customer's name from the dropdown"
                        name="CustomerName"
                        placeholder="Choose a customer"
                        label="Customer Name"
                        options={customerOptions
                        }
                        errors={errors.CustomerName ? errors.CustomerName : ""}
                        touched={touched.CustomerName ? "true" :"" }// Adjust as needed
                      />
                      {isLoading && <p>Loading customers...</p>}
                      {error && <p className="text-red-500">{error}</p>}
                    </label>
                  </div>
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <FormSelect
                        tooltip="Select the product's name from the dropdown"
                        name="ArticleName"
                        placeholder="Choose a Product"
                        label="Product Name"
                        options={articleOptions}
                        errors={errors.ArticleName ? errors.ArticleName : ""}
                        touched={touched.ArticleName? "true":""} // Adjust as needed
                      />
                      {isLoading && <p>Loading article...</p>}
                      {error && <p className="text-red-500">{error}</p>}
                    </label>
                  </div>
                  {/* <div>
                    <FormSelect
                      tooltip="Select the article's name from the dropdown"
                      name="AssigneeName"
                      placeholder="Choose a Assignee"
                      label="Assignee Name"
                      options={assignOptions}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                    />
                    {isLoading && <p>Loading article...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                  </div> */}
                  <div>
                    <label className="form-control w-96 max-w-lg">
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
            </div>
            <div className="modal-action p-6">
              <button
                type="submit"
                className={`btn btn-primary ${
                  AddOrderMutation.isPending ? "btn-disabled" : "btn-primary"
                } btn-md`}
              >
                {AddOrderMutation.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Adding order...
                  </>
                ) : (
                  <>
                    <Plus /> Add Order
                  </>
                )}
              </button>
              <Link
                className="btn btn-accent btn-md "
                href="/dashboard/order_management"
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

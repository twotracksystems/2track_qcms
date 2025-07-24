"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Plus, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { useState, useEffect } from "react";
export default function AddOrderList(params:any) {
  
  const router = useRouter();
  const id=params.params;

  const [initialValues, setInitialValues] = useState({
    CustomerName: "",
    ArticleName: "",
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
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getoneorder/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:",userData);
  useEffect(() => {
    if (isSuccess && userData && userData.length > 0) {
      const user = userData[0]; // Get the first user object
      setInitialValues((prev) => ({
        ...prev,
        CustomerName: user.customer_id || "",
        ArticleName: user.article_id || "",
        PalleteCount: user.pallete_count ||"",
      }));
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
          customer_id: data.CustomerName,
          article_id: data.ArticleName,
          pallete_count: data.PalleteCount,
        
      }),
    });
      return response.json();
    },
    onError: (error) => { 
      toast.error("Failed to add order");
    },
    onSuccess: (data) => {
      toast.success("Order Added Successfully");
      router.push("/dashboard/order_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const Add_Order_Validator = Yup.object().shape({
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

  const customerOptions = customerData?.map((customer: any) => ({
    value: customer.id,
    label: `${customer.first_name} ${customer.last_name}`,
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

  const articleOptions = articleData?.map((article: any) => ({
    value: article.id,
    label: `${article.article_name}`,
  })) || [];

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
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/order_management">Order Management</Link>
          </li>
          <li>
            <span>Edit Order</span>
          </li>
        </ul>
      </div>
      
      <Formik
        initialValues={initialValues}
        validationSchema={Add_Order_Validator}
        enableReinitialize={true}
        onSubmit={async (e, actions) => {
          updateUserMutation.mutate(e);
         
        }}
      >
        {({ errors, touched, values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Order Details</h1>
                <div className="grid grid-cols-2 gap-6 w-full">
                  <div>
                    <FormSelect
                      tooltip="Select the customer's name from the dropdown"
                      name="CustomerName"
                      placeholder="Choose a customer"
                      label="Customer Name"
                      options={customerOptions}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                      readonly={true}
                    />
                  </div>
                  <div>
                    <FormSelect
                      tooltip="Select the article's name from the dropdown"
                      name="ArticleName"
                      placeholder="Choose a Article"
                      label="Article Name"
                      options={articleOptions}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                      readonly={true}
                    />
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Pallete Count
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Name of the site. This is required."
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
                      readOnly
                        type="text"
                        placeholder="Site Name: Example: EzMiner"
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

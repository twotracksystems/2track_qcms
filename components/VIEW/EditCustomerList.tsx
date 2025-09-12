"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import {
  CircleCheckBig,
  CircleHelp,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormInput, FormSelect } from "../UI/FormInput";
import { useEffect, useState } from "react";
import { create } from "domain";
export default function EditCustomerList(params: any) {
  const navigator = useRouter();
  const id = params.params;
  const [initialValues, setInitialValues] = useState({
    // firstname: "",
    // middlename: "",
    // lastname: "",
    // email: "",
    company_name: "",
    customer_id:"",
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
      const response = await fetch(`/api/v1/getonecustomer/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch customer data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", userData);
  useEffect(() => {
    if (isSuccess && userData && userData.length > 0) {
      const user = userData[0]; // Get the first user object
      setInitialValues((prev) => ({
        ...prev,
        // firstname: user.first_name || "",
        // middlename: user.middle_name || "",
        // lastname: user.last_name || "",
        // email: user.email || "",
        company_name: user.company_name || "",
        customer_id:user.customer_id ||"",
      }));
    }
  }, [isSuccess, userData]);

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_customer?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // email: data.email,
          // first_name: data.firstname,
          // middle_name: data.middlename,
          // last_name: data.lastname,
          company_name: data.company_name,
          customer_id:data.customer_id,
        }),
      });
     const result = await response.json();
    },
    onError: (error) => {
      toast.error("Failed to edit customer");
    },
    onSuccess: (data) => {
        toast.success("Customer editted successfully");
        // Delay navigation by 2 seconds (2000 milliseconds)
        setTimeout(() => {
          navigator.push("/dashboard/customer_management");
        }, 2000);
     
      }
   
  });
  const Add_Customer_Validator = Yup.object().shape({
    // firstname: Yup.string().required("First Name is required"),
    // lastname: Yup.string().required("Last Name is required"),
    // email: Yup.string().email("Invalid email").required("Email is required"),
    company_name: Yup.string().required("Company Name is required"),
    customer_id: Yup.string().required("Customer ID is required"),
    
  });

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const removeCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/remove_customer?id=${id}`, {
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
          (await response.json())?.error || "Failed to remove customer"
        );
      }

      return response.json();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove customer");
    },
    onSuccess: (data) => {
      toast.success("Customer removed successfully");
      navigator.push("/dashboard/customer_management");
    },
  });

  return (
    <div className="flex flex-col w-11/12 mx-auto bg-base-200 text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/customer_management">Customer Management</Link>
          </li>
          <li>
            <span>Edit Customer</span>
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
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={Add_Customer_Validator}
        onSubmit={(values) => {
          updateCustomerMutation.mutate(values);
        }}
      >
        {({ errors, touched, values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Customer Details</h1>
                <div className="grid lg:grid-cols-2 gap-6 w-full place-content-center grid-cols-1">
                <div>
                    <label className="form-control w-96 max-w-lg">
                      <FormInput
                        tooltip="Input of Customer ID. This is required."
                        name="customer_id"
                        placeholder="Enter Customer ID"
                        label="Customer ID"
                        errors={errors.customer_id ? errors.customer_id : ""}
                        touched={touched.customer_id ? "true" : ""}
                        type="text"
                        // readonly={true}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <FormInput
                        tooltip="Input of the Company Name. This is required."
                        name="company_name"
                        placeholder="Enter Company Name"
                        label="Company Name"
                        errors={errors.company_name ? errors.company_name : ""}
                        touched={touched.company_name ? "true" : ""}
                      />
                    </label>
                  </div>
                </div>
              </div>  <div className="modal-action p-6">
              <button
                type="submit"
                className={`btn ${
                  updateCustomerMutation.isPending
                    ? "btn-disabled"
                    : "btn-primary"
                } btn-md`}
              >
                {updateCustomerMutation.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Editing Site...
                  </>
                ) : (
                  <>
                  Save Customer
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigator.push("/dashboard/customer_management")}
                className="btn btn-accent btn-md"
              >
                BACK
              </button>
            </div>
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
              Are you sure you want to remove this customer? This action cannot
              be undone.
            </p>
            <div className="modal-action">
              <button
                onClick={() => {
                  removeCustomerMutation.mutate({ is_exist: false });
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
  );
}

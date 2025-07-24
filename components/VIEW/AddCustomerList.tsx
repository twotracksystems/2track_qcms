"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { FormInput } from "../UI/FormInput";
export default function AddCustomerList() {
  const navigator = useRouter();

  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: ["get_customer"],
    queryFn: async () => {
      const headersList = {
        Accept: "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
      };

      const response = await fetch(
        "http://localhost:3000/api/v1/get_customer_next_id",
        {
          method: "GET",
          headers: headersList,
        }
      );

      const data = await response.json();
      console.log(data);
      return data;
    },
  });

  const AddCustomerMutaion = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_customer", {
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
      toast.error("Failed to add customer");
    },
    onSuccess: ({ status, data }) => {
      if (status === 200) {
        // Handle success for user creation
        toast.success("Customer added successfully");

        // Delay navigation by 2 seconds (2000 milliseconds)
        setTimeout(() => {
          navigator.push("/dashboard/customer_management");
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

  const [userid, setuserid] = useState<string | null>(null);
  useEffect(() => {
    const userid = localStorage.getItem("userid");
    setuserid(userid);
  }, []);

  const Add_Customer_Validator = Yup.object().shape({
    // firstname: Yup.string().required("First Name is required").matches(/^[A-Za-z]+$/, "Only alphabets are allowed"),
    // middlename: Yup.string().required("Middle Name is required").matches(/^[A-Za-z]+$/, "Only alphabets are allowed"),
    // lastname: Yup.string().required("Last Name is required").matches(/^[A-Za-z]+$/, "Only alphabets are allowed"),
    // email: Yup.string().email("Invalid email").required("Email is required"),

    company_name: Yup.string().required("Company Name is required."),
    customer_id:Yup.number().required("Customer ID is required.")
  });

  return (
    <div className="flex flex-col w-11/12 mx-auto bg-base-200 text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/customer_management">
              Customer Management
            </Link>
          </li>
          <li>
            <span>Add Customer</span>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={{
          // firstname: "",
          // middlename: "",
          // lastname: "",
          // email: "",
          // customer_id: isLoading?"Retrieving latest Customer ID...":parseInt(data?.data[0].id||0) + 1,
          customer_id:"",
          company_name: "",
        }}
        enableReinitialize={true}
        validationSchema={Add_Customer_Validator}
        onSubmit={async (e, actions) => {
          AddCustomerMutaion.mutate({
            // first_name: e.firstname,
            // middle_name: e.middlename,
            // last_name: e.lastname,
            // email: e.email,
            company_name: e.company_name,
            customer_id: e.customer_id,
          });
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
                        type="number"
                        // readonly={true}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <FormInput
                        tooltip="Input of the Company Name. This is required."
                        name="company_name"
                        placeholder="Enter a Company Name"
                        label="Company Name"
                        errors={errors.company_name ? errors.company_name : ""}
                        touched={touched.company_name ? "true" : ""}
                      />
                    </label>
                  </div>
                 
                </div>
              </div>
            </div>
            <div className="modal-action p-6">
              <button
                type="submit"
                className={`btn  ${
                  AddCustomerMutaion.isPending ? "btn-disabled" : "btn-primary"
                } btn-md`}
              >
                {AddCustomerMutaion.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Adding Customer...
                  </>
                ) : (
                  <>
                    ADD CUSTOMER
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
          </Form>
        )}
      </Formik>
    </div>
  );
}

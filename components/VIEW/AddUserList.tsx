"use client";

import { useMutation } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Eye, EyeClosed, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormInput, FormSelect } from "../UI/FormInput";
import { useState } from "react";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";

export default function AddUserList() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  const navigator = useRouter();
  useEscapeNavigation("/dashboard/user_management");

  const Add_User_Validator = Yup.object().shape({
    firstname: Yup.string()
      .required("First Name is required").matches(/^[A-Za-z ]+$/, "Only alphabets are allowed"),
    
    lastname: Yup.string()
      .required("Last Name is required").matches(/^[A-Za-z ]+$/, "Only alphabets are allowed"),
    
    role: Yup.string().required("Role is required"),

    email: Yup.string().email("Invalid email").required("Email is required"),

    password: Yup.string()
      .min(8, "Password must be 8 characters long")
      .matches(/[0-9]/, "Password requires a number")
      .matches(/[a-z]/, "Password requires a lowercase letter")
      .matches(/[A-Z]/, "Password requires an uppercase letter"),

    confirmpassword: Yup.string()
      .oneOf([Yup.ref("password"), undefined], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const mutateNewSite = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        status: response.status,
        data: responseData,
      };
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add user");
    },
    onSuccess: ({ status, data }) => {
      if (status === 200) {
        toast.success("User added successfully");
        setTimeout(() => {
          navigator.push("/dashboard/user_management");
        }, 2000);
      } else if (status === 409) {
        toast.error("The email is already registered. Please use a different email and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  });

  return (
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <Formik
          initialValues={{
            firstname: "",
            lastname: "",
            role: "",
            email: "",
            password: "",
            confirmpassword: "",
          }}
          validationSchema={Add_User_Validator}
          onSubmit={async (e, actions) => {
            mutateNewSite.mutate({
              first_name: e.firstname,
              last_name: e.lastname,
              role: e.role,
              email: e.email,
              password: e.password,
              confirmpassword: e.confirmpassword,
            });
          }}
        >
          {({ errors, touched }) => (
            <Form>
              <div className="flex flex-col gap-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 p-8">
                  <h1 className="text-2xl font-bold py-4 text-gray-800 border-b border-gray-200 pb-4 mb-6">User Details</h1>
                  <div className="grid lg:grid-cols-3 gap-6 w-full">
                    <div>
                      <label className="form-control w-full">
                        <FormInput
                          tooltip="Input of the First Name. This is required."
                          name="firstname"
                          placeholder="First Name"
                          label="First Name"
                          errors={errors.firstname ? errors.firstname : ""}
                          touched={touched.firstname ? "true" : ""}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="form-control w-full">
                        <FormInput
                          tooltip="Input of the Last Name. This is required."
                          name="lastname"
                          placeholder="Last Name"
                          label="Last Name"
                          errors={errors.lastname ? errors.lastname : ""}
                          touched={touched.lastname ? "true" : ""}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="form-control w-full">
                        <FormSelect
                          tooltip="Select the Role name from the dropdown"
                          name="role"
                          placeholder="Choose a Role"
                          label="Role Name"
                          options={[{ value: "Admin", label: "Admin" }]}
                          errors={errors.role ? errors.role : ""}
                          touched={touched.role ? "true" : ""}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-6 w-full mt-6">
                    <div>
                      <label className="form-control w-full">
                        <FormInput
                          tooltip="Input of the Email. This is required."
                          name="email"
                          placeholder="Email"
                          label="Email"
                          errors={errors.email ? errors.email : ""}
                          touched={touched.email ? "true" : ""}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="relative form-control w-full">
                        <FormInput
                          tooltip="Input of the Password. This is required."
                          name="password"
                          placeholder="Enter Password"
                          label="Password"
                          type={showPassword ? "text" : "password"}
                          errors={errors.password ? errors.password : ""}
                          touched={touched.password ? "true" : ""}
                        />
                        <span
                          onClick={togglePasswordVisibility}
                          className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="relative form-control w-full">
                        <FormInput
                          tooltip="Input of the Confirm Password. This is required."
                          name="confirmpassword"
                          placeholder="Confirm Password"
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          errors={errors.confirmpassword ? errors.confirmpassword : ""}
                          touched={touched.confirmpassword ? "true" : ""}
                        />
                        <span
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                    mutateNewSite.isPending 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  }`}
                  disabled={mutateNewSite.isPending}
                >
                  {mutateNewSite.isPending ? (
                    <>
                      <span className="loading loading-dots loading-sm"></span> Adding User...
                    </>
                  ) : (
                    <>
                      <Plus className="inline mr-2" size={18} /> ADD USER
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.push("/dashboard/user_management")}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  BACK
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

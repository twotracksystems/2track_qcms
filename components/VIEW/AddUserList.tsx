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

export default function AddUserList() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  const navigator = useRouter();

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
    <div className="flex flex-col w-11/12 mx-auto bg-base-200 text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/user_management">User Management</Link>
          </li>
          <li>
            <span>Add User</span>
          </li>
        </ul>
      </div>
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
            <div className="place-content-center flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">User Details</h1>
                <div className="grid lg:grid-cols-3 gap-6 w-full place-content-center grid-col-1">
                  <div>
                    <label className="form-control w-96 max-w-lg">
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
                    <label className="form-control w-96 max-w-lg">
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
                    <label className="form-control w-96 max-w-lg">
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
                <div className="grid lg:grid-cols-3 gap-6 w-full grid-col-1">
                  <div>
                    <label className="form-control w-96 max-w-lg">
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
                    <label className="relative form-control w-96 max-w-lg">
                      <FormInput
                        tooltip="Input of the Password. This is required."
                        name="password"
                        placeholder="Enter Password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        errors={errors.password ? errors.password : ""}
                        touched={touched.password ? "true" : ""}
                      />
                      {/* Show/Hide Password Icon */}
                      <span
                        onClick={togglePasswordVisibility}
                        className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer"
                      >
                        {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="relative form-control w-96 max-w-lg">
                      <FormInput
                        tooltip="Input of the Confirm Password. This is required."
                        name="confirmpassword"
                        placeholder="Confirm Password"
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        errors={errors.confirmpassword ? errors.confirmpassword : ""}
                        touched={touched.confirmpassword ? "true" : ""}
                      />
                      {/* Show/Hide Confirm Password Icon */}
                      <span
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-action p-6">
              <button
                type="submit"
                className={`btn ${mutateNewSite.isPending ? "btn-disabled" : "btn-primary"} btn-md`}
              >
                {mutateNewSite.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span> Adding User...
                  </>
                ) : (
                  <>
                    <Plus /> ADD USER
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigator.push("/dashboard/user_management")}
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

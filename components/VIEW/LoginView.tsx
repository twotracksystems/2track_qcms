"use client";

import { Form, Formik } from "formik";
import { FormInput } from "../UI/FormInputLogin";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

export default function LoginView() {
  const route = useRouter();
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid email address.")
      .required("Email Address is required."),
    password: Yup.string().required("Password is required."),
  });

  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false); // New state to control password visibility

  const mutateManangementLogin = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const response = await fetch("/api/authentication/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        // You can handle specific error status codes here
        const errorData = await response.json();
        throw new Error(errorData?.message || "An error occurred while logging in");
      }

      return response.json();
    },
    onError: (error) => {
      console.log("Login error:", error);  // Inspect the error structure
      toast.error("Invalid email or password");
    },
    onSuccess: (data) => {
      if (data.db_record.is_verified === false) {
        toast.error("Email is not verified");
        route.push("/verify_email");
        return;
      }

      toast.success("Login Successful");
      route.push("/dashboard");
    }
  });

  return (
    <div className="w-full h-screen flex min-h-screen text-black bg-coverbg-center bg-no-repeat bg-gradient-to-br from-blue-900 from-100% via-blue-700 via-100% to-blue-900 to-100%"
      // style={{
      //   backgroundImage: "url('/Img/4.png')",
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      // }}
      // bg-gradient-to-br from-blue-800 from-0% via-indigo-900 via-50% to-blue-900 to-100%  
      // bg-gradient-to-br from-blue-900 from-100% via-blue-700 via-100% to-blue-900 to-100%
      >
      <div className="place-content-center bg-transparent card lg:card-side bg-base-100 inline my-auto mx-auto shadow-xl">
        <div className="w-full place-content-center inline bg-transparent">
          <Image
            src="/Img/corex1.png"
            className=""
            alt="logo"
            width={400}
            height={0}
          />
          <Formik
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={loginSchema}
            validateOnBlur={true}
            validateOnChange={true}
            onSubmit={(values, actions) => {
              mutateManangementLogin.mutate(values, {
                onSuccess: () => {
                  actions.resetForm();
                },
              });
            }}
          >
            {({ errors, touched }) => (
              <Form className="w-full justify-evenly gap-y-2 flex flex-col p-4 mx-auto my-auto bg-transparent">
                <FormInput
                  errors={errors.email}
                  touched={touched.email?.toString()}
                  tooltip="Enter your email address"
                  name="email"
                  placeholder="youremail@mail.domain"
                  label="Email Address"
                />

                <div className="relative">
                  <FormInput
                    errors={errors.password}
                    touched={touched.password?.toString()}
                    tooltip="Enter your password."
                    name="password"
                    placeholder="Enter your password."
                    label="Password"
                    type={passwordVisible ? "text" : "password"} // Toggle password visibility
                  />
                  {/* Show/Hide Password Icon */}
                  <span
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer"
                  >
                    {passwordVisible ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <div className="mx-auto w-3/4 flex ">
                  <button
                    type="submit"
                    className={`btn w-full bg-white text-white  bg-gradient-to-r ${
                      mutateManangementLogin.isPending
                        ? "btn-disabled"
                        : "btn-primary"
                    }`}
                  >
                    {mutateManangementLogin.isPending ? (
                      <div className="flex justify-center items-center text-white">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white text-white"></div>
                        Authenticating...
                      </div>
                    ) : (
                      "Log In"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Form, Formik } from "formik";
import { FormInput } from "../UI/FormInputLogin";
import * as Yup from "yup";
import { QueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
export default function LoginView() {
  const route = useRouter();
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid email address.")
      .required("Email Address is required."),
    
  });
  const [useremail, setUseremail] = useState<string | null>(null);
  const mutateManangementLogin = useMutation({
    mutationFn: async (values: { email: string }) => {
      const response = await fetch("/api/send", {
        method: "POST",  // Change GET to POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
  
      if (!response.ok) {
        // Handle specific error status codes here
        const errorData = await response.json();
        throw new Error(errorData?.message || "An error occurred while logging in");
      }
  
      return response.json();
    },
    onError: (error) => {
      console.log("Login error:", error);
      toast.error("Invalid email or the email is existing");
      //toast.error(error?.message || "An unknown error occurred");
    },
    onSuccess: (data) => {
      // console.log("Setting email in localStorage:", data.data);

localStorage.setItem("email", data.data);

      toast.success("Sent code successfully");
      route.push("/email_confirmation");

    },
  });

  return (
    <div className="w-full h-screen flex min-h-screen text-black bg-cover bg-center bg-gradient-to-br from-blue-900 from-100% via-blue-700 via-100% to-blue-900 to-100% bg-no-repeat"
    
    // style={{
    //   backgroundImage: "url('/Img/4.png')",
      
    //   backgroundSize: "cover",
    //   backgroundPosition: "center",
    // }}
    >
      <div className="place-content-center bg-transparent card lg:card-side bg-base-100 inline  my-auto mx-auto shadow-xl ">
        

      
        <div className="w-full place-content-center inline bg-transparent">
          
          <Image
            src="/Img/corex1.png"
            className=""
            alt="logo"
            width={400}
            height={429}
          />
          <Formik
            initialValues={{
              email: "",
              // password: "",
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
              
                <h1 className="text-2xl text-center font-bold text-black">
                  Email Verification
                </h1>
                <p className="text-center text-white">
                We will send a verification code via this email address.</p>
                <FormInput
                  
                  errors={errors.email}
                  touched={touched.email?.toString()}
                  tooltip="Enter your email address"
                  name="email"
                  placeholder="Enter Your Email"
                  label="Email Address"
                />
               

                <div className="mx-auto w-3/4 flex">
                  <button
                    type="submit"
                    className={`btn w-full bg-white text-white bg-gradient-to-r ${
                      mutateManangementLogin.isPending
                        ? "btn-disabled"
                        : "btn-primary"
                    }`}
                  >
                    {mutateManangementLogin.isPending ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin text-white rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                        Authenticating...
                      </div>
                    ) : (
                      "Send code via email"
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

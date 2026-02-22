"use client";

import { Form, Formik } from "formik";
import { FormInput } from "../UI/FormInputLogin";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginView() {
const [userName, setUserName] = useState({ first: "", last: "" });

  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName");
    const storedLastName = localStorage.getItem("lastName");
    if (storedFirstName && storedLastName) {
      setUserName({ first: storedFirstName, last: storedLastName });
    }
  }, []);
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
      console.log("Login datas:", data); // Log the joined data for debugging
     
  // Save to localStorage
  localStorage.setItem("firstName", data.db_record.first_name);
  localStorage.setItem("lastName", data.db_record.last_name);

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
                <div className="flex justify-between items-center">
                  
                  <a href="/forgot_password" className="text-white hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="mx-auto w-3/4 flex flex-col gap-3">
                  <button
                    type="submit"
                    className={`btn w-full bg-white text-white bg-gradient-to-r ${
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

                  <div className="divider text-white text-xs my-0">OR</div>

                  <button
                    type="button"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      });
                    }}
                    className="btn w-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
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

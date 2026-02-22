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

export default function SignupView() {
  const route = useRouter();
  const supabase = createClient();

  const [userMeta, setUserMeta] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserMeta({
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          role: user.user_metadata?.role || "Viewer",
          email: user.email || "",
        });
      } else {
        toast.error("Invalid or expired invite link.");
        route.push("/login");
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const signupSchema = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[0-9]/, "Password requires a number")
      .matches(/[a-z]/, "Password requires a lowercase letter")
      .matches(/[A-Z]/, "Password requires an uppercase letter")
      .required("Password is required."),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), undefined], "Passwords must match")
      .required("Confirm Password is required."),
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) throw error;

      const response = await fetch("/api/emailconfirmation", {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to update verification status");
      }
    },
    onError: (error) => {
      console.log("Set password error:", error);
      toast.error("Failed to set password. Please try again.");
    },
    onSuccess: () => {
      toast.success("Password set successfully! You can now log in.");
      route.push("/login");
    },
  });

  if (loading) {
    return (
      <div className="w-full h-screen flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userMeta) return null;

  return (
    <div className="w-full h-screen flex min-h-screen text-black bg-cover bg-center bg-no-repeat bg-gradient-to-br from-blue-900 from-100% via-blue-700 via-100% to-blue-900 to-100%">
      <div className="place-content-center bg-transparent card lg:card-side bg-base-100 inline my-auto mx-auto shadow-xl">
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
              password: "",
              confirmPassword: "",
            }}
            validationSchema={signupSchema}
            validateOnBlur={true}
            validateOnChange={true}
            onSubmit={(values) => {
              setPasswordMutation.mutate({ password: values.password });
            }}
          >
            {({ errors, touched }) => (
              <Form className="w-full justify-evenly gap-y-2 flex flex-col p-4 mx-auto my-auto bg-transparent">
                <h1 className="text-2xl text-center font-bold text-black">
                  Set Your Password
                </h1>
                <p className="text-center text-white text-sm">
                  Welcome, {userMeta.firstName} {userMeta.lastName}!
                  <br />
                  Role: <span className="font-semibold">{userMeta.role}</span>
                </p>
                <p className="text-center text-white/70 text-xs">
                  {userMeta.email}
                </p>

                <div className="relative">
                  <FormInput
                    errors={errors.password}
                    touched={touched.password?.toString()}
                    tooltip="Create a strong password."
                    name="password"
                    placeholder="Enter your password"
                    label="Password"
                    type={passwordVisible ? "text" : "password"}
                  />
                  <span
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer text-white"
                  >
                    {passwordVisible ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <div className="relative">
                  <FormInput
                    errors={errors.confirmPassword}
                    touched={touched.confirmPassword?.toString()}
                    tooltip="Re-enter your password to confirm."
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    label="Confirm Password"
                    type={confirmPasswordVisible ? "text" : "password"}
                  />
                  <span
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute right-5 top-16 transform -translate-y-1/2 cursor-pointer text-white"
                  >
                    {confirmPasswordVisible ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </span>
                </div>

                <div className="mx-auto w-3/4 flex">
                  <button
                    type="submit"
                    className={`btn w-full bg-white text-white bg-gradient-to-r ${
                      setPasswordMutation.isPending
                        ? "btn-disabled"
                        : "btn-primary"
                    }`}
                  >
                    {setPasswordMutation.isPending ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin text-white rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                        Setting password...
                      </div>
                    ) : (
                      "Set Password & Continue"
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

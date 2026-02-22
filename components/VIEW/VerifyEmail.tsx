"use client";

import { Form, Formik } from "formik";
import { FormInput } from "../UI/FormInputLogin";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function VerifyEmailView() {
  const route = useRouter();
  const supabase = createClient();

  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Enter a valid email address.")
      .required("Email Address is required."),
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (values: { email: string }) => {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      return { email: values.email };
    },
    onError: (error) => {
      console.log("OTP send error:", error);
      toast.error("Failed to send verification code. Check your email address.");
    },
    onSuccess: (data) => {
      localStorage.setItem("email", data.email);
      toast.success("Verification code sent to your email");
      route.push("/email_confirmation");
    },
  });

  return (
    <div className="w-full h-screen flex min-h-screen text-black bg-cover bg-center bg-gradient-to-br from-blue-900 from-100% via-blue-700 via-100% to-blue-900 to-100% bg-no-repeat">
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
            initialValues={{ email: "" }}
            validationSchema={loginSchema}
            validateOnBlur={true}
            validateOnChange={true}
            onSubmit={(values, actions) => {
              sendOtpMutation.mutate(values, {
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
                  We will send a verification code via this email address.
                </p>
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
                      sendOtpMutation.isPending
                        ? "btn-disabled"
                        : "btn-primary"
                    }`}
                  >
                    {sendOtpMutation.isPending ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin text-white rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                        Sending...
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

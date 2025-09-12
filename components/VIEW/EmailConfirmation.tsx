"use client";

import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function LoginView() {
  const supabase = createClient();
  const route = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    setEmail(storedEmail);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Allow only numeric input
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`digit-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLFormElement>) => {
    const paste = event.clipboardData.getData("text").slice(0, 6);
    const newCode = paste.split("").map((char, index) => (index < 6 ? char : ""));
    setCode(newCode);
  };

  const verifycodeMutation = useMutation({
    mutationFn: async (values: { email: string; code: string }) => {
      const response = await fetch("/api/emailconfirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || "An error occurred while verifying code");
      }

      return response.json();
    },
    onError: (error) => {
      console.log("Verify code error:", error);
      toast.error("Invalid code or code expired");
    },
    onSuccess: (data) => {
      toast.success("Code verified successfully");
      route.push("/dashboard");
    },
  });

  return (
    <div
      className="w-full h-screen flex min-h-screen text-black bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/Img/4.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="place-content-center bg-transparent card lg:card-side bg-base-100 inline my-auto mx-auto shadow-xl">
        <div className="w-full place-content-center inline bg-transparent">
          <Image src="/Img/corex1.png" className="" alt="logo" width={400} height={429} />
          <div className="w-96 bg-transparent">
            <h1 className="text-2xl text-center font-bold text-black">Enter Your Verification Code</h1>
            <p className="text-center p-4 text-white">
              We have sent a verification code to your email address {email}.
            </p>
          </div>
          <Formik
            enableReinitialize={true}
            initialValues={{
              email: email || "",
              code: code.join(""),
            }}
            validationSchema={Yup.object({
              code: Yup.string()
                .length(6, "Code must be 6 digits.")
                .required("Code is required."),
            })}
            onSubmit={(values) => {
              verifycodeMutation.mutate({ email: email || "", code: code.join("") });
              // alert(JSON.stringify(values, null, 2));
            }}
          >
            {({ errors, touched }) => (
              <Form
                className="justify-evenly gap-y-2 flex flex-col p-4 mx-auto my-auto bg-transparent"
                onPaste={handlePaste}
              >
                <Field type="hidden" name="email" value={email} />
                <div className="flex gap-2 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`digit-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-10 h-10 text-center border rounded-md text-lg"
                    />
                  ))}
                </div>
                {errors.code && touched.code && (
                  <div className="text-red-500 text-center">{errors.code}</div>
                )}
                <div className="mx-auto w-3/4 flex">
                  <button
                    type="submit"
                    className="btn w-full bg-white bg-gradient-to-r btn-primary"
                  >
                    {verifycodeMutation.status === "pending" ? (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin text-slate-700 rounded-full h-5 w-5 border-b-2 border-white"></div>{" "}
                        Authenticating...
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </div>
                <Link href="/login">Resend Code</Link>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

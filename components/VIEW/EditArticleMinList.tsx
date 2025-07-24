"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import {
  CircleCheckBig,
  CircleHelp,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { useState, useEffect, use } from "react";
import Order from "@/app/dashboard/laboratory_management/page";
export default function AddOrderList(params: any) {
  const navigator = useRouter();
  const [userid, setuserid] = useState<string | null>(null);
  useEffect(() => {
    const userid = localStorage.getItem("userid");
    setuserid(userid);
  }, []);

  console.log("the current user:", userid);

  const router = useRouter();
  const id = params.params;

  const [initialValues, setInitialValues] = useState({
    length: "",
    inside_diameter: "",
    outside_diameter: "",
    flat_crush: "",
    h20: "",
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
      const response = await fetch(`/api/v1/getonearticlemin/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
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
        length: user.length,
        inside_diameter: user.inside_diameter,
        outside_diameter: user.outside_diameter,
        flat_crush: user.flat_crush,
        h20: user.h20,
      }));
    }
  }, [isSuccess, userData]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_min?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          length: data.length,
          inside_diameter: data.inside_diameter,
          outside_diameter: data.outside_diameter,
          flat_crush: data.flat_crush,
          h20: data.h20,
        }),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to add site");
    },
    onSuccess: (data) => {
      toast.success("Site Added Successfully");
      router.push("/dashboard/article_min_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const Add_Order_Validator = Yup.object().shape({
    length: Yup.string().required("Length is required"),
    inside_diameter: Yup.string().required("Inside Diameter is required"),
    outside_diameter: Yup.string().required("Outside Diameter is required"),
    flat_crush: Yup.string().required("Flat Crush is required"),
    h20: Yup.string().required("H20 is required"),
  });

  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/article_min_management">
              Article Min Management
            </Link>
          </li>
          <li>
            <span>Edit Article Min</span>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={Add_Order_Validator}
        enableReinitialize={true}
        onSubmit={async (e, actions) => {
          updateUserMutation.mutate(e);
        }}
      >
        {({ errors, touched, values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Order Details</h1>
                <div className="grid grid-cols-3 gap-6 w-full">
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Length
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Length Field. This is required."
                          >
                            <CircleHelp
                              className=" my-auto"
                              size={20}
                              strokeWidth={0.75}
                            />
                          </span>
                        </span>
                      </div>
                      <Field
                        type="text"
                        placeholder="Length"
                        name="length"
                        className={`input input-bordered w-full max-w-md ${
                          errors.length && touched.length ? "input-error" : ""
                        }`}
                      />
                    </label>

                    {errors.length && touched.length ? (
                      <span className="text-error  flex flex-row">
                        {errors.length}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Inside Diameter
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Inside Diameter Field. This is required."
                          >
                            <CircleHelp
                              className=" my-auto"
                              size={20}
                              strokeWidth={0.75}
                            />
                          </span>
                        </span>
                      </div>
                      <Field
                        type="text"
                        placeholder="Inside Diameter"
                        name="inside_diameter"
                        className={`input input-bordered w-full max-w-md ${
                          errors.inside_diameter && touched.inside_diameter
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.inside_diameter && touched.inside_diameter ? (
                      <span className="text-error  flex flex-row">
                        {errors.inside_diameter}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Outside Diameter
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Outside Diameter Field. This is required."
                          >
                            <CircleHelp
                              className=" my-auto"
                              size={20}
                              strokeWidth={0.75}
                            />
                          </span>
                        </span>
                      </div>
                      <Field
                        type="text"
                        placeholder="Outside Diameter"
                        name="outside_diameter"
                        className={`input input-bordered w-full max-w-md ${
                          errors.outside_diameter && touched.outside_diameter
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.outside_diameter && touched.outside_diameter ? (
                      <span className="text-error  flex flex-row">
                        {errors.outside_diameter}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Flat Crush
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Flat Crush Field. This is required."
                          >
                            <CircleHelp
                              className=" my-auto"
                              size={20}
                              strokeWidth={0.75}
                            />
                          </span>
                        </span>
                      </div>
                      <Field
                        type="text"
                        placeholder="Flat Crush"
                        name="flat_crush"
                        className={`input input-bordered w-full max-w-md ${
                          errors.flat_crush && touched.flat_crush
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.flat_crush && touched.flat_crush ? (
                      <span className="text-error  flex flex-row">
                        {errors.flat_crush}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          H20
                          <span
                            className="tooltip tooltip-right"
                            data-tip="H20 Field. This is required."
                          >
                            <CircleHelp
                              className=" my-auto"
                              size={20}
                              strokeWidth={0.75}
                            />
                          </span>
                        </span>
                      </div>
                      <Field
                        type="text"
                        placeholder="H20"
                        name="h20"
                        className={`input input-bordered w-full max-w-md ${
                          errors.h20 && touched.h20 ? "input-error" : ""
                        }`}
                      />
                    </label>

                    {errors.h20 && touched.h20 ? (
                      <span className="text-error  flex flex-row">
                        {errors.h20}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-action p-6">
              <button
                type="submit"
                className={`btn btn-outline ${
                  updateUserMutation.isPending ? "btn-disabled" : "btn-primary"
                } btn-md`}
              >
                {updateUserMutation.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Adding Site...
                  </>
                ) : (
                  <>
                    <Pencil /> Edit Article Min
                  </>
                )}
              </button>
              <Link
                className="btn btn-ghost btn-md "
                href="/dashboard/article_min_management"
              >
                BACK
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

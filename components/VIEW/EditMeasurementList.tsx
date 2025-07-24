"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Pencil, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect, FormTextArea } from "../UI/FormInput";
import { useState, useEffect, use } from "react";
import Order from "@/app/dashboard/laboratory_management/page";
export default function AddOrderList(params:any) {
  const navigator = useRouter();
  const [userid, setuserid] = useState<string | null>(null);
  useEffect(() => {
    const userid=localStorage.getItem("userid");
    setuserid(userid);
  }, []);

  console.log("the current user:",userid);
  
  const router = useRouter();
const id=params.params;

  const [initialValues, setInitialValues] = useState({
    order_form_id: "",
    length: "",
    inside_diameter: "",
    outside_diameter: "",
    flat_crush: "",
    h20: "",
    radial: "",
    number_control: "",
    remarks: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [orderID, setorderID] = useState([]);
  useEffect(() => {
    const fetchorder = async () => {
      try {
        const response = await fetch(`/api/v1/get_order?page=1&limit=10`); // Adjust endpoint URL
        const data = await response.json();
        if (response.ok) {
          const options = data.map((order: any) => ({
            value: order.id,
            label: `${order.id}`,
          }));
          setorderID(options);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to fetch Order.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchorder();
  }, []);
  
  const {
    data: userData,
    isLoading: isUserLoading,
    isSuccess,
    isError,
    error: userError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonemeasurement/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:",userData);
  useEffect(() => {
    if (isSuccess && userData && userData.length > 0) {
      const user = userData[0]; // Get the first user object
      setInitialValues((prev) => ({
        ...prev,
        order_form_id: user.order_form_id,
        length: user.length,
        inside_diameter: user.inside_diameter,
        outside_diameter: user.outside_diameter,
        flat_crush: user.flat_crush,
        h20: user.h20,
        radial: user.radial,
        number_control: user.number_control,
        remarks: user.remarks,
      }));
    }
  }, [isSuccess, userData]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_measurement?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_form_id: data.order_form_id,
          length: data.length,
          inside_diameter: data.inside_diameter,
          outside_diameter: data.outside_diameter,
          flat_crush: data.flat_crush,
          h20: data.h20,
          radial: data.radial,
          number_control: data.number_control,
          remarks: data.remarks,

        }),
      });
      return response.json();
    },
    onError: (error) => { 
      toast.error("Failed to add site");
    },
    onSuccess: (data) => {
      toast.success("Site Added Successfully");
      router.push("/dashboard/measurement_management");
    },
    onMutate: (data) => {
      return data;
    },
  });


  const Add_Order_Validator = Yup.object().shape({
    order_form_id: Yup.string().required("Order ID is require"),
    lengts: Yup.string().required("Length is required"),
    inside_diameter: Yup.string().required("Inside Diameter is required"),
    outside_diameter: Yup.string().required("Outside Diameter is required"),
    flat_crush: Yup.string().required("Flat Crush is required"),
    h20: Yup.string().required("H20 is required"),
    radial: Yup.string().required("Radial is required"),
    number_control: Yup.string().required("Number Control is required"), 
    remarks: Yup.string().required("Remarks is required"),

  });

  
  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/measurement_management">Measurement Management</Link>
          </li>
          <li>
            <span>Edit Measurement</span>
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
                    <FormSelect
                      tooltip="Select the order's ID from the dropdown"
                      name="order_form_id"
                      placeholder="Choose a Order"
                      label="Order ID"
                      options={orderID}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                    />
                    {isLoading && <p>Loading article...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                  </div>
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
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Radial
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Radial Field. This is required."
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
                        placeholder="Radial"
                        name="radial"
                        className={`input input-bordered w-full max-w-md ${
                          errors.radial && touched.radial ? "input-error" : ""
                        }`}
                      />
                    </label>

                    {errors.radial && touched.radial ? (
                      <span className="text-error  flex flex-row">
                        {errors.radial}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Number Control
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Number Control Field. This is required."
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
                        placeholder="Number Control"
                        name="number_control"
                        className={`input input-bordered w-full max-w-md ${
                          errors.number_control && touched.number_control
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.number_control && touched.number_control ? (
                      <span className="text-error  flex flex-row">
                        {errors.number_control}
                      </span>
                    ) : null}
                    </div>

                    <div>
                      <FormTextArea
      name="remarks"
      placeholder="Remarks"
      tooltip="Remarks Field. This is required."
      label="Remarks"
      errors={errors.remarks}
      touched={touched.remarks ? "true" : undefined}
      readonly={false} // Optional, based on your logic
    />
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
                    <Pencil /> Edit Measurement
                  </>
                )}
              </button>
              <Link
                className="btn btn-ghost btn-md "
                href="/dashboard/measurement_management"
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

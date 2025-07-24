"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleCheckBig, CircleHelp, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { useState, useEffect } from "react";
import Order from "@/app/dashboard/laboratory_management/page";
export default function AddOrderList(params: any) {
  const navigator = useRouter();
  const [userid, setuserid] = useState<string | null>(null);
  useEffect(() => {
    const userid=localStorage.getItem("userid");
    setuserid(userid);
  }, []);

  console.log("the current user:",userid);
  
  const router = useRouter();

  const id=params.params

  const [initialValues, setInitialValues] = useState({
    OrderID: "",
    EntryDate: "",
    ExitDate: "",
    NumberPallete: "",
    ProgramName: "",
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
      const response = await fetch(`/api/v1/getoneproofing/?id=${id}`);
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
        OrderID: user.order_form_id,
        EntryDate: user.entry_date_time,
        ExitDate: user.exit_date_time,
        NumberPallete: user.num_pallets,
        ProgramName: user.program_name,
      }));
    }
  }, [isSuccess, userData]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_proofing?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_form_id: data.OrderID,
          entry_date_time: data.EntryDate,
          exit_date_time: data.ExitDate,
          num_pallets: data.NumberPallete,
          program_name: data.ProgramName,
        }),
      });
      return response.json();
    },
    onError: (error) => { 
      toast.error("Failed to add site");
    },
    onSuccess: (data) => {
      toast.success("Site Added Successfully");
      router.push("/dashboard/proofing_management");
    },
    onMutate: (data) => {
      return data;
    },
  });


  const Add_Order_Validator = Yup.object().shape({
    OrderID: Yup.string().required("Order ID is required"),
    EntryDate: Yup.date().required("Entry Date is required"),
    ExitDate: Yup.date().required("Exit Date is required"),
    NumberPallete: Yup.string().required("Number of Pallete is required"),
    ProgramName: Yup.string().required("Program Name is required"),
  });

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
  
  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/order_management">Proofing Management</Link>
          </li>
          <li>
            <span>Add Proofing</span>
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
                      name="OrderID"
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
                          Entry Date
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Entry Date Field. This is required."
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
                        type="date"
                        placeholder="Site Name: Example: EzMiner"
                        name="EntryDate"
                        className={`input input-bordered w-full max-w-md ${
                          errors.EntryDate && touched.EntryDate
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.EntryDate && touched.EntryDate ? (
                      <span className="text-error  flex flex-row">
                        {errors.EntryDate}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Exit Date
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Exit Date Field. This is required."
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
                        type="date"
                        placeholder="Site Name: Example: EzMiner"
                        name="ExitDate"
                        className={`input input-bordered w-full max-w-md ${
                          errors.ExitDate && touched.ExitDate
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.ExitDate && touched.ExitDate ? (
                      <span className="text-error  flex flex-row">
                        {errors.ExitDate}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Number Of Pallete
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Exit Date Field. This is required."
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
                        placeholder="Site Name: Example: EzMiner"
                        name="NumberPallete"
                        className={`input input-bordered w-full max-w-md ${
                          errors.NumberPallete && touched.NumberPallete
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.NumberPallete && touched.NumberPallete ? (
                      <span className="text-error  flex flex-row">
                        {errors.NumberPallete}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <label className="form-control w-96 max-w-lg">
                      <div className="label">
                        <span className="label-text font-bold gap-x-2 flex flex-row">
                          Program Name
                          <span
                            className="tooltip tooltip-right"
                            data-tip="Exit Date Field. This is required."
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
                        placeholder="Site Name: Example: EzMiner"
                        name="ProgramName"
                        className={`input input-bordered w-full max-w-md ${
                          errors.ProgramName && touched.ProgramName
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.ProgramName && touched.ProgramName ? (
                      <span className="text-error  flex flex-row">
                        {errors.ProgramName}
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
                    <Plus /> Edit Proofing
                  </>
                )}
              </button>
              <Link
                className="btn btn-ghost btn-md "
                href="/dashboard/order_management"
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

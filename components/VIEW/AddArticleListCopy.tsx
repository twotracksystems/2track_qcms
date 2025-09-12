"use client";
import React, { useEffect, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Select from 'react-select';
import { Pencil, Radical } from "lucide-react";
import * as Yup from "yup";

export default function AddArticleListCopy() {
  const queryClient = new QueryClient();
  const query = usePathname();
  console.log(query);
  // const id = params.params;
  const navigator = useRouter();
  const supabase = createClient(); // Create the Supabase client instance

  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [nominalId, setNominalId] = useState<string | null>(null);
  const [minId, setMinId] = useState<string | null>(null);
  const [maxId, setMaxId] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setUseremail(data.user?.user_metadata.email || null);
      setUserRole(data.user?.user_metadata.role || null);
      setUserID(data.user?.id || null);
    };

    fetchUserEmail();
  }, [supabase.auth]);

  console.log("the user id is:", userID);

  const initialValues = {
    rows: [
      {
        // article_name: "",
        id_number: "",
        article_name: "",
        customer_id: "",
        LengthNominal: "",
        LengthMin: "",
        LengthMax: "",
        InsideDiameterNominal: "",
        InsideDiameterMin: "",
        InsideDiameterMax: "",
        OutsideDiameterNominal: "",
        OutsideDiameterMin: "",
        OutsideDiameterMax: "",
        FlatCrushNominal: "",
        FlatCrushMin: "",
        FlatCrushMax: "",
        H20Nominal: "",
        H20Min: "",
        H20Max: "",
        RadialNominal:"",
        RadialMin:"",
        RadialMax:"",
        NumberControl: "",
      },
    ],
  };
  const validationSchema = Yup.object({
    rows: Yup.array().of(
      Yup.object().shape({
        article_name: Yup.string().required("Product Name is required"),
        customer_id: Yup.string().required("Customer Name is required"),
        NumberControl: Yup.number().required("Number of Control is required"),
      })
    ),
  });
  const AddArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Fialed to add Article");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Article Added Successfully");
      navigator.push("/dashboard/article_management");
      console.log("article on success data", data.id);
    },
    onMutate: (data) => {
      return data;
    },
  });

  const AddNominalMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("nominal data",data);
      const response = await fetch("/api/v1/create_article_nominal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Fialed to add Article Nominal");
      console.error(error);
    },
    onSuccess: (data) => {
      if (data?.id) {
        setNominalId(data.id);
        toast.success("Article Nominal Added Successfully");
        // navigator.push("/dashboard/article_management");
        console.log("Nominal ID on success:", data.id);
      } else {
        console.warn("No ID returned in the response:", data);
      }
    },
    onMutate: (data) => {
      return data;
    },
  });
  const AddMinMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_article_min", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Fialed to add Article Min");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Article Min Added Successfully");
      // navigator.push("/dashboard/article_management");
      setMinId(data.id);
      console.log("min on success data", data.id);
    },
    onMutate: (data) => {
      return data;
    },
  });
  const AddMaxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_article_max", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Fialed to add Article Max");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Article Max Added Successfully");
      // navigator.push("/dashboard/article_management");
      setMaxId(data.id);
      console.log("max on success data", data.id);
    },
    onMutate: (data) => {
      return data;
    },
  });

  // console.log("orders data  ",measurementsData);
  console.log("max id", maxId + "min id", minId + "nominal id", nominalId);
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const [asssing_id, setAssign_id] = useState<string | null>(null);
  const { data: customerData } = useQuery({
    queryKey: ["get_customer", page, search, limit],
    queryFn: async () => {
      console.log("Fetching Data with:", { page, search, limit }); // Debug
      const response = await fetch(`/api/v1/get_customer`, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        },
        redirect: "follow",
      });
      const result = await response.json();

      console.log("API Response:", result); // Debug Response
      if (response.ok) {
        return result;
      } else {
        throw new Error("Something went wrong while fetching customer list.");
      }
    },
    retry: 1,
  });

  console.log("Customer Data:", customerData);

  const customerOptions =
    customerData?.data?.map((customer: any) => ({
      value: customer.id,
      label: `${customer.company_name}`,
    })) || [];

  return (
    <div className="flex flex-col w-full p-12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/article_management">Article Management</Link>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          for (const row of values.rows) {
            try {
              const [nominal, min, max] = await Promise.all([
                AddNominalMutation.mutateAsync({
                  length: row.LengthNominal,
                  inside_diameter: row.InsideDiameterNominal,
                  outside_diameter: row.OutsideDiameterNominal,
                  flat_crush: row.FlatCrushNominal,
                  h20: row.H20Nominal,
                  radial:row.RadialNominal,
                }),
                
                AddMinMutation.mutateAsync({
                  length: row.LengthMin,
                  inside_diameter: row.InsideDiameterMin,
                  outside_diameter: row.OutsideDiameterMin,
                  flat_crush: row.FlatCrushMin,
                  h20: row.H20Min,
                  radial:row.RadialMin,
                }),
                AddMaxMutation.mutateAsync({
                  length: row.LengthMax,
                  inside_diameter: row.InsideDiameterMax,
                  outside_diameter: row.OutsideDiameterMax,
                  flat_crush: row.FlatCrushMax,
                  h20: row.H20Max,
                  radial:row.RadialMax,
                }),
              ]);
      
              if (!nominal.id || !min.id || !max.id) {
                throw new Error("Missing required IDs");
                
              }
      
              await AddArticleMutation.mutateAsync({
                id_number:row.id_number,
                article_name: row.article_name,
                customer_id: row.customer_id,
                article_nominal: nominal.id,
                article_min: min.id,
                article_max: max.id,
                number_control: row.NumberControl,
              });
              // navigator.push("/dashboard/article_management");
              
            } catch (error) {
              toast.error("Failed to add article");
              console.error(error);
            }
            alert(
              `Nominal ID: ${nominalId}, Min ID: ${minId}, Max ID: ${maxId}`);
          
          }
        }}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            <div className="">
              <FieldArray
                name="rows"
                render={(arrayHelpers) => (
                  <div>
                    <div className="flex place-content-start gap-6">
                      {values.rows.map((row, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="inline gap-2">
                            <label className="label">ID Number</label>
                            <Field
                              name={`rows.${index}.id_number`}
                              type="text"
                              placeholder="Enter ID Number"
                              className={`input input-bordered
                             ${
                               typeof errors.rows?.[index] === "object" &&
                               errors.rows?.[index]?.id_number &&
                               touched.rows?.[index]?.id_number
                                 ? "border-red-500"
                                 : ""
                             } 
                            `}
                            />{" "}
                            <ErrorMessage
                              name={`rows.${index}.id_number`}
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </div>
                          <div className="inline gap-2">
                            <label className="label">Product Name</label>
                            <Field
                              name={`rows.${index}.article_name`}
                              type="text"
                              placeholder="Enter Product Name"
                              className={`input input-bordered
                             ${
                               typeof errors.rows?.[index] === "object" &&
                               errors.rows?.[index]?.article_name &&
                               touched.rows?.[index]?.article_name
                                 ? "border-red-500"
                                 : ""
                             } 
                            `}
                            />{" "}
                            <ErrorMessage
                              name={`rows.${index}.article_name`}
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </div>
                          <div className="inline gap-2">
                            <label className="label">Customer Name</label>
                            {/* <Field
                              as="select"
                              name={`rows.${index}.customer_id`}
                              className={`select select-bordered
                                   ${
                                     typeof errors.rows?.[index] === "object" &&
                                     errors.rows?.[index]?.customer_id &&
                                     touched.rows?.[index]?.customer_id
                                       ? "border-red-500"
                                       : ""
                                   } `}
                              defaultValue=""
                              onChange={(e: any) => {
                                // Update Formik state directly
                                setFieldValue(
                                  `rows.${index}.customer_id`,
                                  e.target.value
                                );
                              }}
                            >
                              <option value="" disabled>
                                Select Customer
                              </option>
                              {customerOptions?.map((option: any) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Field> */}
                            <Select
                              name={`rows.${index}.customer_id`}
                              placeholder="Select Customer"
                              options={customerOptions}
                              onChange={(option: any) => {
                                setFieldValue(
                                  `rows.${index}.customer_id`,
                                  option.value
                                );
                              }}
                              className={`text-lg mt-1 bg-white select-bordered mx-auto w-full max-w-md${
                                typeof errors.rows?.[index] === "object" &&
                                errors.rows?.[index]?.customer_id &&
                                touched.rows?.[index]?.customer_id
                                  ? "border-red-500"
                                  : ""
                              }`}
                              
                              />

                            <ErrorMessage
                              name={`rows.${index}.customer_id`}
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </div>

                          <div className="inline gap-2">
                            <label className="label">Number of Control</label>
                            <Field
                              name={`rows.${index}.NumberControl`}
                              type="number"
                              placeholder="Enter Number Of Control"
                              className={`input input-bordered    ${
                                typeof errors.rows?.[index] === "object" &&
                                errors.rows?.[index]?.NumberControl &&
                                touched.rows?.[index]?.NumberControl
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                            <ErrorMessage
                              name={`rows.${index}.NumberControl`}
                              component="div"
                              className="text-red-500 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex place-content-end gap-3">
                      <button className="btn btn-primary" type="submit">
                        Add Article
                      </button>
                      <Link
                        href="/dashboard/article_management"
                        className="btn btn-accent"
                      >
                        Back
                      </Link>
                    </div>
                    <div className="text-black overflow-auto">
                      <table className="table relative text-center overflow-auto">
                        <thead className="text-black text-sm">
                          <tr>
                            {/* <th>Article Name</th> */}
                            <td></td>
                            <th>Scoll Nominal</th>
                            <th>Min</th>
                            <th>Max</th>
                            {/* <th>Action</th> */}
                          </tr>
                        </thead>
                        {/* tbody for length */}{" "}
                        {values.rows.map((row, index) => (
                          <React.Fragment key={index}>
                            <tbody>
                              <tr>
                                <td>Length</td>
                                <td>
                                  <Field
                                    name={`rows.${index}.LengthNominal`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.LengthMin`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.LengthMax`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>

                                {/* <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                              </tr>
                            </tbody>
                            {/* tbody for inside diameter */}
                            <tbody>
                              <tr>
                                <td>Inside Diameter</td>
                                <td>
                                  <Field
                                    name={`rows.${index}.InsideDiameterNominal`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.InsideDiameterMin`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.InsideDiameterMax`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>

                                {/* <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                              </tr>
                            </tbody>
                            {/* tbody for outside diameter */}
                            <tbody>
                              <tr>
                                <td>Outside Diameter</td>
                                <td>
                                  <Field
                                    name={`rows.${index}.OutsideDiameterNominal`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.OutsideDiameterMin`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.OutsideDiameterMax`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>

                                {/* <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                              </tr>
                            </tbody>
                            {/* tbody for flat crush */}
                            <tbody>
                          
                                  <tr>
                                    <td>Flat Crush</td>
                                    <td>
                                      <Field
                                        name={`rows.${index}.FlatCrushNominal`}
                                        type="number"
                                        className="input input-bordered"
                                      />
                                    </td>
                                    <td>
                                      <Field
                                        name={`rows.${index}.FlatCrushMin`}
                                        type="number"
                                        className="input input-bordered"
                                      />
                                    </td>
                                    <td>
                                      <Field
                                        name={`rows.${index}.FlatCrushMax`}
                                        type="number"
                                        className="input input-bordered"
                                      />
                                    </td>
                                    {/* 
                                <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                                  </tr>
                               
                            </tbody>
                            {/* tbody for h20 */}
                            <tbody>
                              <tr>
                                <td>H20</td>
                                <td>
                                  <Field
                                    name={`rows.${index}.H20Nominal`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.H20Min`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.H20Max`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>

                                {/* <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                              </tr>
                            </tbody>
                            
                            <tbody>
                              <tr>
                                <td>Radial</td>
                                <td>
                                  <Field
                                    name={`rows.${index}.RadialNominal`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.RadialMin`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.RadialMax`}
                                    type="number"
                                    className="input input-bordered"
                                  />
                                </td>

                                {/* <td>
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    onClick={() => arrayHelpers.remove(index)}
                                  >
                                    Remove
                                  </button>
                                </td> */}
                              </tr>
                            </tbody>

                          </React.Fragment>
                        ))}
                      </table>
                    </div>
                  </div>
                )}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

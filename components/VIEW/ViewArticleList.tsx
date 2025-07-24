"use client";
import React, { useEffect, useRef, useState } from "react";
import { Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";

export default function EditArticleListCopy(params:any) {
  const router = useRouter();
  const id = params.params;

  const [initialValues,setInitialValues] = useState({ 
    rows: [
      {
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
        NumberControl: "",
      },
    ],
  });

  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nominalID, setNominalID] = useState<string | null>(null);
  const [minID, setMinID] = useState<string | null>(null);
  const [maxID, setMaxID] = useState<string | null>(null);

  const {
    data: articleData,
    isLoading: isArticleLoading,
    isSuccess: isArticleSuccess,
    isError: isArticleError,
  } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticle/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", articleData);
  useEffect(() => {
    if (isArticleSuccess && articleData && articleData.length > 0) {
      const user = articleData[0];
      setNominalID(user.article_nominal);
      setMinID(user.article_min);
      setMaxID(user.article_max);
      setInitialValues((prev) => ({
        ...prev,
        number_control: user.number_control,
        rows: prev.rows.map((row) => ({
          ...row,
          article_name: user.article_name,
          customer_id: user.customer_id,
          NumberControl: user.number_control,
        })),
      }));
      }
  }, [isArticleSuccess, articleData]);
  
  const {
    data: nominalData,
    isLoading: isNominalLoading,
    isSuccess: isNominalSuccess,
    isError: isNominalError,
  } = useQuery({
    queryKey: ["article_nominal", nominalID],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticlenominal/?id=${nominalID}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", nominalData);
  useEffect(() => {
    if (isNominalSuccess && nominalData?.length > 0) {
      setInitialValues((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => ({
          ...row,
          LengthNominal: nominalData[0].length,
          InsideDiameterNominal: nominalData[0].inside_diameter,
          OutsideDiameterNominal: nominalData[0].outside_diameter,
          FlatCrushNominal: nominalData[0].flat_crush,
          H20Nominal: nominalData[0].h20,
        })),
      }));
    }
  }, [isNominalSuccess, nominalData]);
  

  const {
    data: minData,
    isLoading: isMinLoading,
    isSuccess: isMinSuccess,
    isError: isMinError,
    error: userError,
  } = useQuery({
    queryKey: ["article_min",minID],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticlemin/?id=${minID}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", minData);
  useEffect(() => {
    if (isMinSuccess && minData?.length > 0) {
      setInitialValues((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => ({
          ...row,
          LengthMin: minData[0].length,
          InsideDiameterMin: minData[0].inside_diameter,
          OutsideDiameterMin: minData[0].outside_diameter,
          FlatCrushMin: minData[0].flat_crush,
          H20Min: minData[0].h20,
        })),
      }));
    }
  }, [isMinSuccess, minData]);

  const {
    data: maxData,
    isLoading: isMaxLoading,
    isSuccess: isMaxSuccess,
    isError: isMaxError,
    error: maxError,
  } = useQuery({
    queryKey: ["article_max", maxID],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticlemax/?id=${maxID}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id, // Only fetch data if id exists
  });
  console.log("Gatherd data:", maxData);
  useEffect(() => {
    if (isMaxSuccess && maxData?.length > 0) {
      setInitialValues((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => ({
          ...row,
          LengthMax: maxData[0].length,
          InsideDiameterMax: maxData[0].inside_diameter,
          OutsideDiameterMax: maxData[0].outside_diameter,
          FlatCrushMax: maxData[0].flat_crush,
          H20Max: maxData[0].h20,
        })),
      }));
    }
  }, [isMaxSuccess, maxData]);

  const UpdateNominalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_nominal/?id=${nominalID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update article");
    },
    onSuccess: (data) => {
      toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });
  
  const UpdateMinMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_min/?id=${nominalID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update article");
    },
    onSuccess: (data) => {
      toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const UpdateMaxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_max/?id=${nominalID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update article");
    },
    onSuccess: (data) => {
      toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });
  
  
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
            <Link href="/dashboard/measurement_management">
              Article Management
            </Link>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        onSubmit={async (values) => {
          for(const row of values.rows){
            await UpdateNominalMutation.mutateAsync({
              length: row.LengthNominal,
              inside_diameter: row.InsideDiameterNominal,
              outside_diameter: row.OutsideDiameterNominal,
              flat_crush: row.FlatCrushNominal,
              h20: row.H20Nominal,
            });
            await UpdateMinMutation.mutateAsync({
              length: row.LengthMin,
              inside_diameter: row.InsideDiameterMin,
              outside_diameter: row.OutsideDiameterMin,
              flat_crush: row.FlatCrushMin,
              h20: row.H20Min,
            });
            await UpdateMaxMutation.mutateAsync({
              length: row.LengthMax,
              inside_diameter: row.InsideDiameterMax,
              outside_diameter: row.OutsideDiameterMax,
              flat_crush: row.FlatCrushMax,
              h20: row.H20Max,
            });

          }
        }
      }
         
      >
        {({ values, setFieldValue }) => (
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
                                                                  <label className="label">Product Name</label>
                                                                  <Field
                                                                  readOnly
                                                                    name={`rows.${index}.article_name`}
                                                                    type="text"
                                                                    placeholder="Enter Product Name"
                                                                    className="input input-bordered"
                                                                  />
                                                                  </div>
                                                                  <div className="inline gap-2">
                                          <label className="label">Customer Name</label>
                                          <Field
                                          disabled
                                            as="select"
                                            name={`rows.${index}.customer_id`}
                                            className="select select-bordered"
                                            defaultValue=""
                                            onChange={(e:any) => {
                                              // Update Formik state directly
                                              setFieldValue(`rows.${index}.customer_id`, e.target.value);
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
                                          </Field>
                                        </div>
                                        
                                                                  <div className="inline gap-2">
                                                                  <label className="label">Number of Control</label>
                                                                  <Field
                                                                  readOnly
                                                                    name={`rows.${index}.NumberControl`}
                                                                    type="number"
                                                                    placeholder="Enter Number Of Control"
                                                                    className="input input-bordered"
                                                                  />
                                                                  </div>
                                                                  
                                                                </div>
                                                              ))}
                                                            </div>
                    <div className="flex place-content-end gap-3">
                      
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
                            <td></td>
                            <th>Scoll Nominal</th>
                            <th>Min</th>
                            <th>Max</th>
                          </tr>
                        </thead>
                       {values.rows.map((row, index) => (
                            <React.Fragment key={index}>
                        <tbody>
                              <tr>
                                <td>Length</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.LengthNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.LengthMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.LengthMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                              
                              </tr>
                         
                        </tbody>
                        {/* tbody for inside diameter */}
                        <tbody>
                        
                              <tr>
                                <td>Inside Diameter</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.InsideDiameterNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.InsideDiameterMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.InsideDiameterMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                             
                              </tr>
                          
                        </tbody>
                        {/* tbody for outside diameter */}
                        <tbody>
                        
                              <tr>
                                <td>Outside Diameter</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.OutsideDiameterNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.OutsideDiameterMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.OutsideDiameterMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                               
                              </tr>
                          
                        </tbody>
                        {/* tbody for flat crush */}
                        <tbody>
                          {values.rows.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td>Flat Crush</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.FlatCrushNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.FlatCrushMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.FlatCrushMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                        {/* tbody for h20 */}
                        <tbody>
                         
                              <tr>
                                <td>H20</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.H20Nominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.H20Min`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.H20Max`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                          
                              </tr>
                          
                        </tbody>  </React.Fragment>
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

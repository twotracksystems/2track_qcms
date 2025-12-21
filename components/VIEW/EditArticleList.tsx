"use client";
import React, { useEffect, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Select from "react-select";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import * as Yup from "yup";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";

export default function EditArticleListCopy(params:any) {
  const router = useRouter();
  useEscapeNavigation("/dashboard/article_management");
  const id = params.params;
   const supabase = createClient(); 
   const [UserRole,setUserRole] = useState<string | null>(null);
    useEffect(() => {
       const fetchUserEmail = async () => {
         const { data } = await supabase.auth.getUser();
         setUserRole(data.user?.user_metadata.role || null);
         console.log("User Data:", data);
       };
       
       fetchUserEmail();
     }, []);
       console.log("UserRole:", UserRole);

  const [initialValues,setInitialValues] = useState({ 
    rows: [
      {
        id_number: "",
        article_name: "",
        customer_id: "",
        LengthNominal: 0,
        LengthMin: 0,
        LengthMax: 0,
        InsideDiameterNominal: 0,
        InsideDiameterMin: 0,
        InsideDiameterMax: 0,
        OutsideDiameterNominal: 0,
        OutsideDiameterMin: 0,
        OutsideDiameterMax: 0,
        FlatCrushNominal: "0",
        FlatCrushMin: "0",
        FlatCrushMax: "0",
        H20Nominal: 0,
        H20Min: 0,
        H20Max: 0,
        RadialNominal:0,
        RadialMin:0,
        RadialMax:0,
        NumberControl: 0,
      },
    ],
  });

    const validationSchema = Yup.object({
      rows: Yup.array().of(
        Yup.object().shape({
          article_name: Yup.string().required("Product Name is required"),
          customer_id: Yup.string().required("Customer Name is required"),
          NumberControl: Yup.number().required("Number of Control is required"),
        })
      ),
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
          id_number: user.id_number,
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
            // FlatCrushNominal: parseFloat(parseFloat(nominalData[0].flat_crush).toFixed(2)),
            FlatCrushNominal: parseFloat(nominalData[0].flat_crush).toFixed(2),
            H20Nominal: nominalData[0].h20,
            RadialNominal: nominalData[0].radial,
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
            // FlatCrushMin: Number(minData[0].flat_crush),
            FlatCrushMin: parseFloat(minData[0].flat_crush).toFixed(2),
            H20Min: minData[0].h20,
            RadialMin: minData[0].radial,
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
            // FlatCrushMax: Number(maxData[0].flat_crush),
            FlatCrushMax: parseFloat(maxData[0].flat_crush).toFixed(2),
            H20Max: maxData[0].h20,
            RadialMax: maxData[0].radial,
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
      // toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });
  
  const UpdateMinMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_min/?id=${minID}`, {
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
      // toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const UpdateMaxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_max/?id=${maxID}`, {
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
      // toast.success("Article updated Successfully");
      router.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const removeCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/remove_article/?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      // ❗ Manually handle non-2xx responses
      if (!response.ok) {
        // Throw the error so `onError` will be called
        throw { status: response.status, message: result.error || "Something went wrong" };
      }
  
      return result;
    },
    onError: (error: any) => {
      console.error("Mutation Error:", error); // for debugging
      if (error.status === 400) {
        toast.error("This article is currently used in another table.");
      } else if (error.status === 405) {
        toast.error("Something went wrong. Please try again later.");
      } else {
        toast.error(error.message || "Failed to remove article");
      }
    },
    onSuccess: (data) => {
      toast.success("Article removed successfully");
      router.push("/dashboard/article_management");
    },
  });
  
  const UpdateArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article/?id=${id}`, {
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
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values) => {
  const mutationPromises = values.rows.map((row) =>
    Promise.all([
      UpdateNominalMutation.mutateAsync({
        length: row.LengthNominal,
        inside_diameter: row.InsideDiameterNominal,
        outside_diameter: row.OutsideDiameterNominal,
        flat_crush: row.FlatCrushNominal,
        h20: row.H20Nominal,
        radial:row.RadialNominal,
      }),
      UpdateMinMutation.mutateAsync({
        length: row.LengthMin,
        inside_diameter: row.InsideDiameterMin,
        outside_diameter: row.OutsideDiameterMin,
        flat_crush: row.FlatCrushMin,
        h20: row.H20Min,
        radial:row.RadialMin,
      }),
      UpdateMaxMutation.mutateAsync({
        length: row.LengthMax,
        inside_diameter: row.InsideDiameterMax,
        outside_diameter: row.OutsideDiameterMax,
        flat_crush: row.FlatCrushMax,
        h20: row.H20Max,
        radial:row.RadialMax,
      }),
      UpdateArticleMutation.mutateAsync({
        id_number: row.id_number,
        customer_id: row.customer_id,
        number_control: row.NumberControl,
      }),
      
    ])

  );

  await Promise.all(mutationPromises);

  // Redirect after all mutations succeed
  router.push("/dashboard/article_management");
}}
        
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 p-8">
                <h1 className="text-2xl font-bold py-4 text-gray-800 border-b border-gray-200 pb-4 mb-6">Article Management</h1>
                <FieldArray
                  name="rows"
                  render={(arrayHelpers) => (
                    <div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {values.rows.map((row, index) => (
                          <React.Fragment key={index}>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">ID Number</label>
                              <Field
                                name={`rows.${index}.id_number`}
                                type="text"
                                placeholder="Enter ID Number"
                                className={`input input-bordered w-full
                                  ${
                                    typeof errors.rows?.[index] === "object" &&
                                    errors.rows?.[index]?.id_number &&
                                    touched.rows?.[index]?.id_number
                                      ? "border-red-500"
                                      : ""
                                  } 
                                `}
                              />
                              <ErrorMessage
                                name={`rows.${index}.id_number`}
                                component="div"
                                className="text-red-500 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">Customer Name</label>
                              <Select
                                name={`rows.${index}.customer_id`}
                                placeholder="Select Customer"
                                options={customerOptions}
                                value={customerOptions.find((opt: any) => opt.value === row.customer_id) || null}
                                onChange={(option: any) => {
                                  setFieldValue(
                                    `rows.${index}.customer_id`,
                                    option.value
                                  );
                                }}
                                className={`text-sm mt-1 bg-white w-full${
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
                                className="text-red-500 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">Number of Control</label>
                              <Field
                                name={`rows.${index}.NumberControl`}
                                type="number"
                                placeholder="Enter Number Of Control"
                                className={`input input-bordered w-full ${
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
                                className="text-red-500 text-xs"
                              />
                            </div>
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-center table-auto">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap"></th>
                                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Scroll Nominal</th>
                                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Min</th>
                                <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Max</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50">
                              {values.rows.map((row, index) => (
                                <React.Fragment key={index}>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Length</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.LengthNominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.LengthMin`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.LengthMax`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Inside Diameter</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterNominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterMin`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterMax`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Outside Diameter</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterNominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterMin`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterMax`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Flat Crush</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.FlatCrushNominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.FlatCrushMin`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.FlatCrushMax`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">H₂O</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.H20Nominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.H20Min`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.H20Max`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Radial</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialNominal`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialMin`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialMax`}
                                        type="number"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                {UserRole === "Super Admin" && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    onClick={() => setIsRemoveModalOpen(true)}
                  >
                    <Trash2 className="inline mr-2" size={18} /> Remove Article
                  </button>
                )}
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                    UpdateArticleMutation.isPending || UpdateNominalMutation.isPending || UpdateMinMutation.isPending || UpdateMaxMutation.isPending
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  }`}
                  disabled={UpdateArticleMutation.isPending || UpdateNominalMutation.isPending || UpdateMinMutation.isPending || UpdateMaxMutation.isPending}
                >
                  {(UpdateArticleMutation.isPending || UpdateNominalMutation.isPending || UpdateMinMutation.isPending || UpdateMaxMutation.isPending) ? (
                    <>
                      <span className="loading loading-dots loading-sm"></span> Saving...
                    </>
                  ) : (
                    <>
                      Save Article
                    </>
                  )}
                </button>
                <Link
                  href="/dashboard/article_management"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </Form>
        )}
      </Formik>
      {isRemoveModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confirm Removal</h3>
            <p>Are you sure you want to remove this article? This action cannot be undone.</p>
            <div className="modal-action">
              <button
                type="button"
                onClick={() => {
                  removeCustomerMutation.mutate({ is_exist: false });
                }}
                className={`btn btn-error ${
                  removeCustomerMutation.isPending ? "loading" : ""
                }`}
              >
                Confirm
              </button>
              <button
                onClick={() => setIsRemoveModalOpen(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

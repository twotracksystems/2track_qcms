"use client";
import React, { useEffect, useRef, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import * as Yup from "yup";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
import { normalizeDecimalInput } from "@/utils/parseDecimal";

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
     }, [supabase.auth]);
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
        ResistanceNominal: 0,
        ResistanceMin: 0,
        ResistanceMax: 0,
        HumidityNominal: 0,
        HumidityMin: 0,
        HumidityMax: 0,
        NumberControl: 0,
      },
    ],
  });

  const parseNumberValue = (value: string | number | null | undefined): number => {
    const parsed = normalizeDecimalInput(value);
    return parsed ?? 0;
  };

  const normalizeFlatCrushForDisplay = (
    value: string | number | null | undefined
  ): number | null => {
    const normalized = normalizeDecimalInput(value);
    if (normalized === null) return null;
    return normalized > 1000 ? normalized / 1000 : normalized;
  };

  const normalizeFlatCrushForSave = (
    value: string | number | null | undefined
  ): number | null => {
    const normalized = normalizeDecimalInput(value);
    if (normalized === null) return null;
    return normalized > 1000 ? normalized : normalized * 1000;
  };
  // Treat 0 and 0.000 as no value so single-value rule applies for resistance
  const treatZeroAsNoValue = (value: number | null): number | null => {
    if (value == null) return null;
    if (typeof value === "number" && (value === 0 || Math.abs(value) < 1e-9)) return null;
    return value;
  };

  const normalizeCompanyName = (value: string) => value.trim().toLowerCase();

    const validationSchema = Yup.object({
      rows: Yup.array().of(
        Yup.object().shape({
          article_name: Yup.string().required("Product Name is required"),
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
        rows: prev.rows.map((row) => {
          const hasIdNumber =
            row.id_number !== "" && row.id_number !== null && row.id_number !== undefined;
          const hasArticleName =
            row.article_name !== "" && row.article_name !== null && row.article_name !== undefined;

          return {
            ...row,
            id_number: hasIdNumber ? row.id_number : user.id_number,
            article_name: hasArticleName ? row.article_name : (user.article_name ?? row.article_name),
            customer_id: user.customer_id ? String(user.customer_id) : "",
            NumberControl: user.number_control,
          };
        }),
      }));
      }
  }, [isArticleSuccess, articleData]);
  
  const {
    data: articleProdData,
    isSuccess: isArticleProdSuccess,
  } = useQuery({
    queryKey: ["article_prod", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticleprod/?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch article prod data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!id,
  });
  useEffect(() => {
    if (isArticleProdSuccess && articleProdData?.length > 0) {
      const prod = articleProdData[0];
      // Resistance: if only one value (min or max), use it for min, max, and nominal; if both min and max, leave nominal blank. Treat 0 as no value.
      const resistanceMin = treatZeroAsNoValue(normalizeFlatCrushForDisplay(prod.resistance_min));
      const resistanceMax = treatZeroAsNoValue(normalizeFlatCrushForDisplay(prod.resistance_max));
      const hasResistanceMin = resistanceMin != null;
      const hasResistanceMax = resistanceMax != null;
      const resistanceNominal =
        hasResistanceMin && hasResistanceMax
          ? null
          : hasResistanceMin
            ? resistanceMin
            : hasResistanceMax
              ? resistanceMax
              : normalizeFlatCrushForDisplay(prod.resistance);
      const resistanceMinDisplay = hasResistanceMin ? resistanceMin : (hasResistanceMax ? resistanceMax : null);
      const resistanceMaxDisplay = hasResistanceMax ? resistanceMax : (hasResistanceMin ? resistanceMin : null);
      // Humidity (H2O): same logic as resistance - single value → use for nominal/min/max; both → nominal blank; treat 0 as no value
      const humidityMin = treatZeroAsNoValue(parseNumberValue(prod.humidty_min));
      const humidityMax = treatZeroAsNoValue(parseNumberValue(prod.humidity_max));
      const hasHumidityMin = humidityMin != null;
      const hasHumidityMax = humidityMax != null;
      const humidityNominal =
        hasHumidityMin && hasHumidityMax
          ? null
          : hasHumidityMin
            ? humidityMin
            : hasHumidityMax
              ? humidityMax
              : parseNumberValue(prod.humidity);
      const humidityMinDisplay = hasHumidityMin ? humidityMin : (hasHumidityMax ? humidityMax : null);
      const humidityMaxDisplay = hasHumidityMax ? humidityMax : (hasHumidityMin ? humidityMin : null);
      setInitialValues((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => ({
          ...row,
          id_number: String(prod.article || row.id_number || ""),
          article_name: String(prod.article_name ?? row.article_name ?? ""),
          LengthNominal: parseNumberValue(prod.length),
          InsideDiameterNominal: parseNumberValue(prod.inside_diameter),
          OutsideDiameterNominal: parseNumberValue(prod.outside_diameter),
          ResistanceNominal: resistanceNominal ?? 0,
          HumidityNominal: humidityNominal ?? 0,
          LengthMin: parseNumberValue(prod.length_min),
          InsideDiameterMin: parseNumberValue(prod.inside_diameter_min),
          OutsideDiameterMin: parseNumberValue(prod.outside_diameter_min),
          ResistanceMin: resistanceMinDisplay ?? 0,
          HumidityMin: humidityMinDisplay ?? 0,
          LengthMax: parseNumberValue(prod.length_max),
          InsideDiameterMax: parseNumberValue(prod.inside_diameter_max),
          OutsideDiameterMax: parseNumberValue(prod.outside_diameter_max),
          ResistanceMax: resistanceMaxDisplay ?? 0,
          HumidityMax: humidityMaxDisplay ?? 0,
        })),
      }));
    }
  }, [isArticleProdSuccess, articleProdData]);

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
  
    useEffect(() => {
      if (!isArticleProdSuccess || !articleProdData?.length || !customerData?.data?.length) {
        return;
      }

      const prod = articleProdData[0];
      const prodCustomerName = prod?.article_name ? String(prod.article_name) : "";
      if (!prodCustomerName) {
        return;
      }

      const matchedCustomer = customerData.data.find((customer: any) => {
        return normalizeCompanyName(customer.company_name) === normalizeCompanyName(prodCustomerName);
      });

      if (!matchedCustomer) {
        return;
      }

      const nextCustomerId = String(matchedCustomer.id);
      setInitialValues((prev) => {
        const currentCustomerId = prev.rows[0]?.customer_id ? String(prev.rows[0].customer_id) : "";
        if (currentCustomerId === nextCustomerId) {
          return prev;
        }

        return {
          ...prev,
          rows: prev.rows.map((row) => ({
            ...row,
            customer_id: nextCustomerId,
          })),
        };
      });
    }, [isArticleProdSuccess, articleProdData, customerData]);

  
  return (
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values) => {
  const mutationPromises = values.rows.map((row) => {
    const length = normalizeDecimalInput(row.LengthNominal);
    const insideDiameter = normalizeDecimalInput(row.InsideDiameterNominal);
    const outsideDiameter = normalizeDecimalInput(row.OutsideDiameterNominal);
    const resistance = normalizeFlatCrushForSave(row.ResistanceNominal);
    const humidity = normalizeDecimalInput(row.HumidityNominal);
    const numberControl = normalizeDecimalInput(row.NumberControl);

    return Promise.all([
      UpdateNominalMutation.mutateAsync({
        length,
        inside_diameter: insideDiameter,
        outside_diameter: outsideDiameter,
        resistance,
        humidity,
      }),
      // Min and Max are now part of the same article_prod record
      // Update article_prod with all values at once
      UpdateArticleMutation.mutateAsync({
        id_number: row.id_number,
        article_name: row.article_name,
        customer_id: row.customer_id,
        number_control: numberControl,
      }),
    ]);
  });

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
                              <Field
                                name={`rows.${index}.article_name`}
                                type="text"
                                placeholder="Customer Name"
                                className={`input input-bordered w-full
                                  ${
                                    typeof errors.rows?.[index] === "object" &&
                                    errors.rows?.[index]?.article_name &&
                                    touched.rows?.[index]?.article_name
                                      ? "border-red-500"
                                      : ""
                                  } 
                                `}
                              />
                              <ErrorMessage
                                name={`rows.${index}.article_name`}
                                component="div"
                                className="text-red-500 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">Number of Control</label>
                              <Field
                                name={`rows.${index}.NumberControl`}
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9.,-]*"
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
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.LengthMin`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.LengthMax`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Inside Diameter</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterNominal`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterMin`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.InsideDiameterMax`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Outside Diameter</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterNominal`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterMin`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.OutsideDiameterMax`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Flat Crush</td>
                                    <td className="px-4 py-3">
                                      <Field name={`rows.${index}.ResistanceNominal`}>
                                        {({ field }: { field: any }) => (
                                          <input
                                            {...field}
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9.,-]*"
                                            className="input input-bordered w-full text-xs"
                                            onBlur={(event) => {
                                              field.onBlur(event);
                                              const normalized = normalizeFlatCrushForDisplay(event.target.value);
                                              if (normalized === null) return;
                                              setFieldValue(field.name, normalized);
                                            }}
                                          />
                                        )}
                                      </Field>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field name={`rows.${index}.ResistanceMin`}>
                                        {({ field }: { field: any }) => (
                                          <input
                                            {...field}
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9.,-]*"
                                            className="input input-bordered w-full text-xs"
                                            onBlur={(event) => {
                                              field.onBlur(event);
                                              const normalized = normalizeFlatCrushForDisplay(event.target.value);
                                              if (normalized === null) return;
                                              setFieldValue(field.name, normalized);
                                            }}
                                          />
                                        )}
                                      </Field>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field name={`rows.${index}.ResistanceMax`}>
                                        {({ field }: { field: any }) => (
                                          <input
                                            {...field}
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9.,-]*"
                                            className="input input-bordered w-full text-xs"
                                            onBlur={(event) => {
                                              field.onBlur(event);
                                              const normalized = normalizeFlatCrushForDisplay(event.target.value);
                                              if (normalized === null) return;
                                              setFieldValue(field.name, normalized);
                                            }}
                                          />
                                        )}
                                      </Field>
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">H₂O</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.HumidityNominal`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.HumidityMin`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.HumidityMax`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
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

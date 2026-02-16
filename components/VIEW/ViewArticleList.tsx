"use client";
import React, { useEffect, useRef, useState } from "react";
import { Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
import { formatNumberWithDecimals } from "@/utils/formatNumber";

type ViewArticleListProps = {
  id?: string;
  params?: string | { params?: string };
  onClose?: () => void;
};

export default function EditArticleListCopy({
  id,
  params,
  onClose,
}: ViewArticleListProps) {
  const router = useRouter();
  useEscapeNavigation("/dashboard/article_management");
  const resolvedId =
    id ?? (typeof params === "string" ? params : params?.params);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const parseNumericValue = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const cleaned = String(value).replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeFlatCrushForDisplay = (
    value: string | number | null | undefined
  ): number | null => {
    const normalized = parseNumericValue(value);
    if (normalized === null) return null;
    return normalized > 1000 ? normalized / 1000 : normalized;
  };
  // Treat 0 and 0.000 as no value so single-value rule applies for resistance
  const treatZeroAsNoValue = (value: number | null): number | null => {
    if (value == null) return null;
    if (typeof value === "number" && (value === 0 || Math.abs(value) < 1e-9)) return null;
    return value;
  };

  const normalizeFlatCrushForSave = (
    value: string | number | null | undefined
  ): number | null => {
    const normalized = parseNumericValue(value);
    if (normalized === null) return null;
    return normalized > 1000 ? normalized : normalized * 1000;
  };

  const [initialValues,setInitialValues] = useState({ 
    rows: [
      {
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
        ResistanceNominal: "",
        ResistanceMin: "",
        ResistanceMax: "",
        HumidityNominal: "",
        HumidityMin: "",
        HumidityMax: "",
        NumberControl: "",
      },
    ],
  });

  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data directly from tbl_article_prod using the id parameter (which is tbl_article_prod.id)
  const {
    data: articleProdData,
    isLoading: isArticleProdLoading,
    isSuccess: isArticleProdSuccess,
    isError: isArticleProdError,
  } = useQuery({
    queryKey: ["article_prod", resolvedId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticleprod/?id=${resolvedId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch article prod data: ${response.status}`);
      }
      return response.json(); // Expecting an array
    },
    enabled: !!resolvedId, // Only fetch data if id exists
  });

  const {
    data: articleMetaData,
    isSuccess: isArticleMetaSuccess,
  } = useQuery({
    queryKey: ["article_meta", resolvedId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonearticle/?id=${resolvedId}`);
      if (!response.ok) {
        throw new Error("Failed to load article metadata");
      }
      return response.json();
    },
    enabled: !!resolvedId,
  });

  const {
    data: customerData,
    isSuccess: isCustomerSuccess,
  } = useQuery({
    queryKey: ["customer_detail", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getonecustomer/?id=${customerId}`);
      if (!response.ok) {
        throw new Error("Failed to load customer");
      }
      return response.json();
    },
    enabled: !!customerId,
  });
  
  console.log("Gathered article_prod data:", articleProdData);
  
  useEffect(() => {
    if (isArticleProdSuccess && articleProdData?.length > 0) {
      const articleData = articleProdData[0];
      
      // Resistance: if only one value (min or max), use it for min, max, and nominal; if both min and max, leave nominal blank. Treat 0 as no value.
      const resistanceMinValue = treatZeroAsNoValue(normalizeFlatCrushForDisplay(
        articleData.resistance_min
      ));
      const resistanceMaxValue = treatZeroAsNoValue(normalizeFlatCrushForDisplay(
        articleData.resistance_max
      ));
      const hasResistanceMin = resistanceMinValue != null;
      const hasResistanceMax = resistanceMaxValue != null;
      const nominalResistance =
        hasResistanceMin && hasResistanceMax
          ? ""
          : hasResistanceMin
            ? formatNumberWithDecimals(resistanceMinValue)
            : hasResistanceMax
              ? formatNumberWithDecimals(resistanceMaxValue)
              : "";
      const displayResistanceMin = hasResistanceMin ? formatNumberWithDecimals(resistanceMinValue) : (hasResistanceMax ? formatNumberWithDecimals(resistanceMaxValue) : "");
      const displayResistanceMax = hasResistanceMax ? formatNumberWithDecimals(resistanceMaxValue) : (hasResistanceMin ? formatNumberWithDecimals(resistanceMinValue) : "");
      
      // Humidity (H2O): same logic as resistance - single value → use for nominal/min/max; both → nominal blank; treat 0 as no value
      const humidityMinValue = treatZeroAsNoValue(parseNumericValue(articleData.humidty_min));
      const humidityMaxValue = treatZeroAsNoValue(parseNumericValue(articleData.humidity_max));
      const hasHumidityMin = humidityMinValue != null;
      const hasHumidityMax = humidityMaxValue != null;
      const nominalHumidity =
        hasHumidityMin && hasHumidityMax
          ? ""
          : hasHumidityMin
            ? formatNumberWithDecimals(humidityMinValue)
            : hasHumidityMax
              ? formatNumberWithDecimals(humidityMaxValue)
              : "";
      const displayHumidityMin = hasHumidityMin ? formatNumberWithDecimals(humidityMinValue) : (hasHumidityMax ? formatNumberWithDecimals(humidityMaxValue) : "");
      const displayHumidityMax = hasHumidityMax ? formatNumberWithDecimals(humidityMaxValue) : (hasHumidityMin ? formatNumberWithDecimals(humidityMinValue) : "");

      setInitialValues((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => ({
          ...row,
          // ID Number: Use article column from tbl_article_prod
          id_number: articleData.article || "",
          // Customer Name: Use article_name from tbl_article_prod
          article_name: customerName || articleData.article_name || "",
          // Number of Control: Not available in tbl_article_prod, set to empty
          NumberControl: "",
          // Nominal values from tbl_article_prod
          LengthNominal: articleData.length || "",
          InsideDiameterNominal: articleData.inside_diameter || "",
          OutsideDiameterNominal: articleData.outside_diameter || "",
          ResistanceNominal: nominalResistance,
          HumidityNominal: nominalHumidity,
          // Min values from tbl_article_prod
          LengthMin: articleData.length_min || "",
          InsideDiameterMin: articleData.inside_diameter_min || "",
          OutsideDiameterMin: articleData.outside_diameter_min || "",
          ResistanceMin: displayResistanceMin,
          HumidityMin: displayHumidityMin,
          // Max values from tbl_article_prod
          LengthMax: articleData.length_max || "",
          InsideDiameterMax: articleData.inside_diameter_max || "",
          OutsideDiameterMax: articleData.outside_diameter_max || "",
          ResistanceMax: displayResistanceMax,
          HumidityMax: displayHumidityMax,
        })),
      }));
    }
  }, [isArticleProdSuccess, articleProdData, customerName]);

  useEffect(() => {
    if (isArticleMetaSuccess && articleMetaData?.length > 0) {
      const meta = articleMetaData[0];
      setCustomerId(meta?.customer_id ? String(meta.customer_id) : null);
    }
  }, [isArticleMetaSuccess, articleMetaData]);

  useEffect(() => {
    if (isCustomerSuccess && customerData?.length > 0) {
      setCustomerName(customerData[0]?.company_name || "");
    }
  }, [isCustomerSuccess, customerData]);

  const UpdateArticleProdMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_article_prod/?id=${resolvedId}`, {
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
          for (const row of values.rows) {
            const resistanceMin = normalizeFlatCrushForSave(row.ResistanceMin);
            const resistanceMax = normalizeFlatCrushForSave(row.ResistanceMax);
            // Update single article_prod record with all values
            await UpdateArticleProdMutation.mutateAsync({
              length: row.LengthNominal,
              inside_diameter: row.InsideDiameterNominal,
              outside_diameter: row.OutsideDiameterNominal,
              length_min: row.LengthMin,
              inside_diameter_min: row.InsideDiameterMin,
              outside_diameter_min: row.OutsideDiameterMin,
              length_max: row.LengthMax,
              inside_diameter_max: row.InsideDiameterMax,
              outside_diameter_max: row.OutsideDiameterMax,
              resistance_min: resistanceMin,
              resistance_max: resistanceMax,
              humidty_min: row.HumidityMin,
              humidity_max: row.HumidityMax,
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
                                                                  <label className="label">ID Number</label>
                                                                  <Field
                                                                  readOnly
                                                                    name={`rows.${index}.id_number`}
                                                                    type="text"
                                                                    placeholder="Enter Product Name"
                                                                    className="input input-bordered"
                                                                  />
                                                                  </div>
                                                                  <div className="inline gap-2">
                                          <label className="label">Customer Name</label>
                                          <Field
                                            readOnly
                                            name={`rows.${index}.article_name`}
                                            type="text"
                                            placeholder="Article Name"
                                            className="input input-bordered"
                                          />
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
                      
                      {onClose ? (
                        <button
                          type="button"
                          className="btn btn-accent"
                          onClick={onClose}
                        >
                          Close
                        </button>
                      ) : (
                        <Link
                          href="/dashboard/article_management"
                          className="btn btn-accent"
                        >
                          Back
                        </Link>
                      )}
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
                        {/* tbody for resistance */}
                        <tbody>
                              <tr>
                                <td>Flat Crush</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.ResistanceNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.ResistanceMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.ResistanceMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                              </tr>
                        </tbody>
                        {/* tbody for humidity */}
                        <tbody>
                              <tr>
                                <td>H₂O</td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.HumidityNominal`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.HumidityMin`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>
                                <td>
                                  <Field
                                  readOnly
                                    name={`rows.${index}.HumidityMax`}
                                    type="text"
                                    className="input input-bordered"
                                  />
                                </td>

                          
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

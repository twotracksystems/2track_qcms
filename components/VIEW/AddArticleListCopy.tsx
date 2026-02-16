"use client";
import React, { useEffect, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import * as Yup from "yup";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
import SuggestiveSearchInput from "@/components/UI/SuggestiveSearchInput";
import { normalizeDecimalInput } from "@/utils/parseDecimal";

export default function AddArticleListCopy() {
  const query = usePathname();
  console.log(query);
  // const id = params.params;
  const navigator = useRouter();
  useEscapeNavigation("/dashboard/article_management");
  const supabase = createClient(); // Create the Supabase client instance

  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
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

  const initialValues = {
    rows: [
      {
        id_number: "",
        designation_article: "",
        article_name: "",
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
        designation_article: Yup.string().required("Product Name is required"),
        article_name: Yup.string().required("Client is required"),
        NumberControl: Yup.string().required("Number of Control is required"),
      })
    ),
  });
  const AddArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_article_prod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to add article");
      }
      return result;
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to add Article";
      toast.error(message);
      console.error(error);
    },
    onSuccess: () => {
      // Toast and navigation are handled in onSubmit after all rows are processed
    },
    onMutate: (data) => {
      return data;
    },
  });

  // console.log("orders data  ",measurementsData);
  const fetchOfidForArticle = async (articleId: string) => {
    if (!articleId) return null;
    try {
      const response = await fetch(
        `/api/v1/get_ofid_by_article?article=${encodeURIComponent(articleId)}`
      );
      if (!response.ok) return null;
      const result = await response.json();
      if (result?.status === "SINGLE_MATCH") return result.ofid || null;
      if (Array.isArray(result?.ofids) && result.ofids.length > 0) {
        return result.ofids[0];
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch OFID:", error);
      return null;
    }
  };

  return (
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
          let successCount = 0;
          for (const row of values.rows) {
            try {
              const length = normalizeDecimalInput(row.LengthNominal);
              const lengthMin = normalizeDecimalInput(row.LengthMin);
              const lengthMax = normalizeDecimalInput(row.LengthMax);
              const insideNominal = normalizeDecimalInput(row.InsideDiameterNominal);
              const insideMin = normalizeDecimalInput(row.InsideDiameterMin);
              const insideMax = normalizeDecimalInput(row.InsideDiameterMax);
              const outsideNominal = normalizeDecimalInput(row.OutsideDiameterNominal);
              const outsideMin = normalizeDecimalInput(row.OutsideDiameterMin);
              const outsideMax = normalizeDecimalInput(row.OutsideDiameterMax);
              const resistanceMin = normalizeFlatCrushForSave(row.ResistanceMin);
              const resistanceMax = normalizeFlatCrushForSave(row.ResistanceMax);
              const humidityMin = normalizeDecimalInput(row.HumidityMin);
              const humidityMax = normalizeDecimalInput(row.HumidityMax);
              await AddArticleMutation.mutateAsync({
                article: row.id_number,
                designation_article: row.designation_article,
                article_name: row.article_name,
                length,
                inside_diameter: insideNominal,
                outside_diameter: outsideNominal,
                length_min: lengthMin,
                length_max: lengthMax,
                inside_diameter_min: insideMin,
                inside_diameter_max: insideMax,
                outside_diameter_min: outsideMin,
                outside_diameter_max: outsideMax,
                resistance_min: resistanceMin,
                resistance_max: resistanceMax,
                humidty_min: humidityMin,
                humidity_max: humidityMax,
              });
              successCount += 1;
            } catch (error) {
              toast.error("Failed to add article");
              console.error(error);
            }
          }
          if (successCount > 0) {
            toast.success(
              successCount === 1
                ? "Article added successfully"
                : `${successCount} articles added successfully`
            );
            navigator.push("/dashboard/article_management");
          }
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
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {values.rows.map((row, index) => (
                          <React.Fragment key={index}>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">ID Number</label>
                              <Field
                                name={`rows.${index}.id_number`}
                                type="text"
                                placeholder="Enter ID Number (leave blank to auto-generate)"
                                className={`input input-bordered w-full
                                 ${
                                   typeof errors.rows?.[index] === "object" &&
                                   errors.rows?.[index]?.id_number &&
                                   touched.rows?.[index]?.id_number
                                     ? "border-red-500"
                                     : ""
                                 } 
                                `}
                                onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
                                  const ofid = await fetchOfidForArticle(event.target.value);
                                  if (ofid) {
                                    setFieldValue(`rows.${index}.NumberControl`, ofid);
                                  }
                                }}
                              />
                              <ErrorMessage
                                name={`rows.${index}.id_number`}
                                component="div"
                                className="text-red-500 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">Product Name</label>
                              <Field
                                name={`rows.${index}.designation_article`}
                                type="text"
                                placeholder="Enter Product Name"
                                className={`input input-bordered w-full
                                 ${
                                   typeof errors.rows?.[index] === "object" &&
                                   errors.rows?.[index]?.designation_article &&
                                   touched.rows?.[index]?.designation_article
                                     ? "border-red-500"
                                     : ""
                                 } 
                                `}
                              />
                              <ErrorMessage
                                name={`rows.${index}.designation_article`}
                                component="div"
                                className="text-red-500 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-semibold text-gray-700">Client</label>
                              <SuggestiveSearchInput
                                value={row.article_name}
                                onChange={(next) =>
                                  setFieldValue(`rows.${index}.article_name`, next)
                                }
                                onSearch={() => {}}
                                placeholder="Select Client"
                                suggestionScope="clients"
                                strict
                                inputClassName={`input input-bordered w-full ${
                                  typeof errors.rows?.[index] === "object" &&
                                  errors.rows?.[index]?.article_name &&
                                  touched.rows?.[index]?.article_name
                                    ? "border-red-500"
                                    : ""
                                }`}
                                onInvalidSelection={(nextValue) => {
                                  if (nextValue.trim()) {
                                    toast.error("Select a client from the list.");
                                    setFieldValue(`rows.${index}.article_name`, "");
                                  }
                                }}
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
                                  <tr className="hover:bg-blue-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Radial</td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialNominal`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialMin`}
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9.,-]*"
                                        className="input input-bordered w-full text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Field
                                        name={`rows.${index}.RadialMax`}
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
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                    AddArticleMutation.isPending 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  }`}
                  disabled={AddArticleMutation.isPending}
                >
                  {AddArticleMutation.isPending ? (
                    <>
                      <span className="loading loading-dots loading-sm"></span> Adding Article...
                    </>
                  ) : (
                    <>
                      <Plus className="inline mr-2" size={18} /> Add Article
                    </>
                  )}
                </button>
                <Link
                  href="/dashboard/article_management"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Back
                </Link>
              </div>
            </div>
          </Form>
        )}
      </Formik>
      </div>
    </div>
  );
}

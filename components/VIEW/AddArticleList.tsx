"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { CircleHelp, Plus,} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { useState, useEffect, use } from "react";
import { useEscapeNavigation } from "@/utils/hooks/useEscapeNavigation";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
export default function AddArticleList() {
  const navigator = useRouter();
  useEscapeNavigation("/dashboard/article_management");
  const [userid, setuserid] = useState<string | null>(null);
  useEffect(() => {
    const userid=localStorage.getItem("userid");
    setuserid(userid);
  }, []);

  console.log("the current user:",userid);
  
  const router = useRouter();
  

  const Add_Article_Validator = Yup.object().shape({
    ArticleNominal: Yup.string().required("Article Nominal is required"),
    ArticleMin: Yup.string().required("Article Min is required"),
    ArticleMax: Yup.string().required("Article Max is required"),
    NumberControl: Yup.string().required("Number Control is required"),
  });

  const [initialValues, setInitialValues] = useState({
    ArticleNominal:"",
    ArticleMin:"",
    ArticleMax:"",
    NumberControl:"",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      toast.error("Failed to add article");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Article Added Successfully");
      navigator.push("/dashboard/article_management");
    },
    onMutate: (data) => {
      return data;
    },
  });


 
  const [articlenominal, setarticlenominal] = useState([]);
  const [articlemin, setarticlemin] = useState([]);
  const [articlemax, setarticlemax] = useState([]);

  useEffect(() => {
    const fetcharticlenominal = async () => {
      try {
        const response = await fetch(`/api/v1/get_article_nominal?page=1&limit=10`); // Adjust endpoint URL
        const data = await response.json();
        if (response.ok) {
          const options = data.map((nominal: any) => ({
            value: nominal.id,
            label: `${nominal.id}`,
          }));
          setarticlenominal(options);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to fetch Nominal.");
      } finally {
        setIsLoading(false);
      }
    };

    fetcharticlenominal();
  }, []);

  useEffect(() => {
    const fetcharticlemin = async () => {
      try {
        const response = await fetch(`/api/v1/get_article_min?page=1&limit=10`); // Adjust endpoint URL
        const data = await response.json();
        if (response.ok) {
          const options = data.map((min: any) => ({
            value: min.id,
            label: `${min.id}`,
          }));
          setarticlemin(options);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to fetch Min.");
      } finally {
        setIsLoading(false);
      }
    };

    fetcharticlemin();
  }
  , []);

  useEffect(() => {
    const fetcharticlemax = async () => {
      try {
        const response = await fetch(`/api/v1/get_article_max?page=1&limit=10`); // Adjust endpoint URL
        const data = await response.json();
        if (response.ok) {
          const options = data.map((max: any) => ({
            value: max.id,
            label: `${max.id}`,
          }));
          setarticlemax(options);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to fetch Max.");
      } finally {
        setIsLoading(false);
      }
    };

    fetcharticlemax();
  }, []);
  
  return (
    <div className="flex flex-col w-full px-6 py-4 text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0">
        <Formik
          initialValues={initialValues}
          validationSchema={Add_Article_Validator}
          enableReinitialize={true}
          onSubmit={async (e, actions) => {
            AddArticleMutation.mutate({
              article_nominal: e.ArticleNominal,
              article_min: e.ArticleMin,
              article_max: e.ArticleMax,
              number_control: normalizeDecimalInput(e.NumberControl),
              user_id: userid,
            });
          }}
        >
          {({ errors, touched, values }) => (
            <Form>
              <div className="flex flex-col gap-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 p-8">
                  <h1 className="text-2xl font-bold py-4 text-gray-800 border-b border-gray-200 pb-4 mb-6">Article Details</h1>
                  <div className="grid grid-cols-3 gap-6 w-full">
                    <div>
                      <FormSelect
                        tooltip="Select the article nominal's ID from the dropdown"
                        name="ArticleNominal"
                        placeholder="Choose a Article Nominal"
                        label="Article Nominal"
                        options={articlenominal}
                        errors={error ? error : ""}
                        touched="true"
                      />
                      {isLoading && <p className="text-sm text-gray-500 mt-2">Loading article...</p>}
                      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <div>
                      <FormSelect
                        tooltip="Select the article min's ID from the dropdown"
                        name="ArticleMin"
                        placeholder="Choose a Article Min"
                        label="Article Min"
                        options={articlemin}
                        errors={error ? error : ""}
                        touched="true"
                      />
                      {isLoading && <p className="text-sm text-gray-500 mt-2">Loading article...</p>}
                      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <div>
                      <FormSelect
                        tooltip="Select the article max's ID from the dropdown"
                        name="ArticleMax"
                        placeholder="Choose a Article Max"
                        label="Article Max"
                        options={articlemax}
                        errors={error ? error : ""}
                        touched="true"
                      />
                      {isLoading && <p className="text-sm text-gray-500 mt-2">Loading article...</p>}
                      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <div>
                      <label className="form-control w-full">
                        <div className="label">
                          <span className="label-text font-bold gap-x-2 flex flex-row">
                            Number Of Control
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
                          inputMode="decimal"
                          pattern="[0-9.,-]*"
                          placeholder="Enter Number Of Control"
                          name="NumberControl"
                          className={`input input-bordered w-full ${
                            errors.NumberControl && touched.NumberControl
                              ? "input-error"
                              : ""
                          }`}
                        />
                      </label>

                      {errors.NumberControl && touched.NumberControl ? (
                        <span className="text-error flex flex-row text-sm mt-1">
                          {errors.NumberControl}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
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
                      <span className="loading loading-dots loading-sm"></span>{" "}
                      Adding Article...
                    </>
                  ) : (
                    <>
                      <Plus className="inline mr-2" size={18} /> Add Article
                    </>
                  )}
                </button>
                <Link
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                  href="/dashboard/article_management"
                >
                  BACK
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

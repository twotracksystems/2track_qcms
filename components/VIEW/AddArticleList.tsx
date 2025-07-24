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
export default function AddArticleList() {
  const navigator = useRouter();
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
    <div className="flex flex-col w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/article_management">Article Management</Link>
          </li>
          <li>
            <span>Add Article</span>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={Add_Article_Validator}
        enableReinitialize={true}
        onSubmit={async (e, actions) => {
          AddArticleMutation.mutate({
            article_nominal: e.ArticleNominal,
            article_min: e.ArticleMin,
            article_max: e.ArticleMax,
            number_control: e.NumberControl,
            user_id: userid,
          });
        }}
      >
        {({ errors, touched, values }) => (
          <Form>
            <div className="flex flex-col gap-y-6">
              <div className="border p-12 rounded-md bg-white">
                <h1 className="text-xl font-bold py-4">Article Details</h1>
                <div className="grid grid-cols-3 gap-6 w-full">
                 
                  <div>
                    <FormSelect
                      tooltip="Select the article nominal's ID from the dropdown"
                      name="ArticleNominal"
                      placeholder="Choose a Article Nominal"
                      label="Article Nominal"
                      options={articlenominal}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                    />
                    {isLoading && <p>Loading article...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                  </div>

                  <div>
                    <FormSelect
                      tooltip="Select the article min's ID from the dropdown"
                      name="ArticleMin"
                      placeholder="Choose a Article Min"
                      label="Article Min"
                      options={articlemin}
                      errors={error ? error : ""}
                      touched="true" // Adjust as needed
                    />
                    {isLoading && <p>Loading article...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                  </div>

                  <div>
                    <FormSelect
                      tooltip="Select the article max's ID from the dropdown"
                      name="ArticleMax"
                      placeholder="Choose a Article Max"
                      label="Article Max"
                      options={articlemax}
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
                        type="number"
                        placeholder="Enter Number Of Control"
                        name="NumberControl"
                        className={`input input-bordered w-full max-w-md ${
                          errors.NumberControl && touched.NumberControl
                            ? "input-error"
                            : ""
                        }`}
                      />
                    </label>

                    {errors.NumberControl && touched.NumberControl ? (
                      <span className="text-error  flex flex-row">
                        {errors.NumberControl}
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
                  AddArticleMutation.isPending ? "btn-disabled" : "btn-primary"
                } btn-md`}
              >
                {AddArticleMutation.isPending ? (
                  <>
                    <span className="loading loading-dots loading-sm"></span>{" "}
                    Adding Article...
                  </>
                ) : (
                  <>
                    <Plus /> Add Article
                  </>
                )}
              </button>
              <Link
                className="btn btn-ghost btn-md "
                href="/dashboard/article_management"
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

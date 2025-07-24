"use client";
import React, { useEffect, useState } from "react";
import { Field, FieldArray, Form, Formik } from "formik";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { exit } from "process";

export default function MeasurementListViewCopy(params: any) {

  const queryClient = new QueryClient();
  const query = usePathname();
  console.log(query);
  const id = params.params;
  const navigator  = useRouter();
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
  }, []);

 console.log("the user id is:", userID);

  const initialValues = {
    rows: [
      {
        order_id: id,
        entry_data_time: "",
        exit_data_time: "",
        number_of_pallete: "",
        program_name: "",
      },
    ],
  };

   const AddOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_measurement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Fialed to add Measurement"); 
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Measurement Added Successfully");
      navigator.push("/dashboard/order_management");
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
              Measurement Management
            </Link>
          </li>
        </ul>
      </div>
      <Formik
        initialValues={initialValues}
        onSubmit={async (values) => {
          for (const row of values.rows) {
            AddOrderMutation.mutate({
              order_id: id,
              entry_data_time: row.entry_data_time,
              exit_data_time: row.exit_data_time,
              number_of_pallete: row.number_of_pallete,
              program_name: row.program_name,
              
              user_id: userID,
            });
          }
          await new Promise((r) => setTimeout(r, 500));
          alert(JSON.stringify(values, null, 2));
        }}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <div className="">
              <FieldArray
                name="rows"
                render={(arrayHelpers) => (
                  <div>
                    <div className="flex place-content-end gap-3">
                      <button
                        className="btn btn-info"
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({
                            
                            entry_data_time: "",
                            exit_data_time: "",
                            number_of_pallete: "",
                            program_name: "",

                          })
                        }
                      >
                        Add Row
                      </button>
                      <button
                                    className="btn btn-primary"
                                    type="submit"
                                  >
                                    Add Measurement
                                  </button>
                    </div>
                    <div className="text-black overflow-auto">
                      <table className="table relative text-center overflow-auto">
                        <thead className="text-black text-sm">
                          <tr>
                            <th>Entry Date Time</th>
                            <th>Exit Date Time</th>
                            <th>Number of Pallete</th>
                            <th>Program Name</th>

                          </tr>
                        </thead>
                        <tbody>
                          {values.rows.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td>
                                  <Field
                                    name={`rows.${index}.entry_data_time`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                               
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
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
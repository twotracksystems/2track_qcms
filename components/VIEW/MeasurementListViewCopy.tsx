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
        pallete_count: "",
        number_of_control: "",
        length: "",
        inside_diameter: "",
        outside_diameter: "",
        flat_crush: "",
        h20: "",
        radial: "",
        remarks: "",
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

  const { data: measurementsData, isFetching, isError } = useQuery({
    queryKey: id ? ["get_measurement", id] : ["get_measurement"], // Always provide an array for queryKey
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/get_measurement?id=${id}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
          },
        });
    
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to fetch data");
        return result;
      } catch (error) {
        console.error("Error fetching measurements:", error);
        throw error;
      }
    },
    retry: 1,
  });
  
  
  
console.log("orders data  ",measurementsData);  
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
              length: row.length,
              inside_diameter: row.inside_diameter,
              outside_diameter: row.outside_diameter,
              flat_crush: row.flat_crush,
              h20: row.h20,
              radial: row.radial,
              number_control: row.number_of_control,
              remarks: row.remarks,
              pallete_count: row.pallete_count,
              user_id: userID,
            });
          }
          
          await new Promise((r) => setTimeout(r, 500));
          alert(JSON.stringify(values, null, 2));
        }}
      >
        {({ values, setFieldValue }) => (
          console.log(values.rows),
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
                            pallete_count: "",
                            number_of_control: "",
                            length: "",
                            inside_diameter: "",
                            outside_diameter: "",
                            flat_crush: "",
                            h20: "",
                            radial: "",
                            remarks: "",

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
                                 <Link href="/dashboard/order_management" className="btn btn-accent">
                                    Back
                                  </Link> 
                                    
                    </div>
                    <div className="text-black overflow-auto">
                      <table className="table relative text-center overflow-auto">
                        <thead className="text-black text-sm">
                          <tr>
                            <th>Pallete</th>
                            <th>Number Of Controll</th>
                            <th>Length</th>
                            <th>Inside Diameter</th>
                            <th>Outside Diameter</th>
                            <th>Flat Crush</th>
                            <th>H20</th>
                            <th>Radial </th>
                            <th>Remarks</th>
                          
                          </tr>
                        </thead>
                        <tbody>
                          {values.rows.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td>
                                  <Field
                                    name={`rows.${index}.pallete_count`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.number_of_control`}
                                    type="number"
                                    placeholder="0"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                    onChange={(e: any) => {
                                      const newCount = parseInt(
                                        e.target.value,
                                        10
                                      );
                                      const currentPallete =
                                        values.rows[index].pallete_count;
                                      const currentRowsCount =
                                        values.rows.filter(
                                          (r) => r.pallete_count === currentPallete
                                        ).length;

                                      // Update `number_of_control`
                                      setFieldValue(
                                        `rows.${index}.number_of_control`,
                                        newCount
                                      );

                                      // Calculate rows to adjust
                                      const rowsToAdjust =
                                        newCount - currentRowsCount;

                                      if (rowsToAdjust > 0) {
                                        // Add rows if the number increased
                                        for (let i = 0;  i < rowsToAdjust; i++) {
                                          arrayHelpers.insert(index + 1, {
                                            pallete_count: currentPallete,
                                            number_of_control: "",
                                            length: "",
                                            inside_diameter: "",
                                            outside_diameter: "",
                                            flat_crush: "",
                                            h20: "",
                                            radial: "",
                                            remarks: "",
                                          });
                                        }
                                      } else if (rowsToAdjust < 0) {
                                        // Remove rows if the number decreased
                                        for (
                                          let i = 0;
                                          i < Math.abs(rowsToAdjust);
                                          i++
                                        ) {
                                          const rowIndex =
                                            values.rows.findIndex(
                                              (r, idx) =>
                                                idx > index &&
                                                r.pallete_count === currentPallete
                                            );
                                          if (rowIndex !== -1) {
                                            arrayHelpers.remove(rowIndex);
                                          }
                                        }
                                      }
                                    }}
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.length`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.inside_diameter`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.outside_diameter`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.flat_crush`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.h20`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.radial`}
                                    placeholder="0"
                                    type="number"
                                    className="input bg-white input-bordered w-20 max-w-md"
                                  />
                                </td>
                                <td>
                                  <Field
                                    name={`rows.${index}.remarks`}
                                    placeholder="0"
                                    type="text"
                                    className="input bg-white input-bordered w-auto max-w-md"
                                  />
                                </td>
                                <td>
                                  {/* <button
                                    className="btn btn-primary"
                                    type="submit"
                                  >
                                    Submit
                                  </button> */}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tbody>
  {isFetching ? (
    <tr>
      <td colSpan={7}>
        <span className="loading loading-dots loading-md"></span>
      </td>
    </tr>
  ) : isError ? (
    <tr>
      <td className="text-error font-bold" colSpan={7}>
        Something went wrong while fetching measurement data.
      </td>
    </tr>
  ) : measurementsData && measurementsData.length > 0 ? (
    measurementsData.map((measurement: any, index: number) => (
      <tr key={index}>
        {/* <td>{index + 1}</td> */}
        <td>{measurement.pallete_count}</td>
        <td>{measurement.number_control}</td>
        <td>{measurement.length}</td>
        <td>{measurement.inside_diameter}</td>
        <td>{measurement.outside_diameter}</td>
        <td>{measurement.flat_crush}</td>
        <td>{measurement.h20}</td>
        <td>{measurement.radial}</td>
        <td>{measurement.remarks}</td>
        <td>
          <Link
            href={`/dashboard/edit_measurement/${measurement.id}`}
            className="btn btn-sm btn-primary"
          >
            <Pencil size={16} /> Edit
          </Link>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td className="font-bold" colSpan={7}>
        No measurement data found.
      </td>
    </tr>
  )}
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
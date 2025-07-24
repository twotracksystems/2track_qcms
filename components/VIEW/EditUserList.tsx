"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { CircleHelp, Pencil, Trash2 } from "lucide-react";
import { FormInput, FormSelect } from "../UI/FormInput";
import Link from "next/link";

export default function EditUserList(params: any) {
  const navigator = useRouter();
  const uuid = params.params;

  const [initialValues, setInitialValues] = useState({
    firstname: "",
    // middlename: "",
    lastname: "",
    // suffix: "",
    role: "",
    email: "",
  });

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const {
    data: userData,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useQuery({
    queryKey: ["user", uuid],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getoneuser/?uuid=${uuid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!uuid,
  });

  useEffect(() => {
    if (isSuccess && userData && userData.length > 0) {
      const user = userData[0];
      setInitialValues({
        firstname: user.first_name || "",
        // middlename: user.middle_name || "",
        lastname: user.last_name || "",
        // suffix: user.suffix || "",
        role: user.role || "",
        email: user.email || "",
      });
    }
  }, [isSuccess, userData]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/edit_user?uuid=${uuid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          first_name: data.firstname,
          // middle_name: data.middlename,
          last_name: data.lastname,
          role: data.role,
          // suffix: data.suffix,
        }),
      });
      const responseData = await response.json();
  
      // Return status and response data
      return {
        status: response.status,
        data: responseData,
      };
    },
    onError: (error) => {
      toast.error("Failed to edit user");
    },
    onSuccess: ({ status, data }) => {
      if (status === 200) {
        // Handle success for user creation
        toast.success("User editted successfully");
  
        // Delay navigation by 2 seconds (2000 milliseconds)
        setTimeout(() => {
          navigator.push("/dashboard/user_management");
        }, 2000);
      } else if (status === 409) {
        // Handle conflict (e.g., user already exists)
        toast.error("The email is currently used. Please use a different email and try again.");
      } else {
        // Handle other non-success statuses
        toast.error("An unexpected error occur  red. Please try again or reload the page.");
      }
    },
    onMutate: (data) => {
      return data;
    },
  });
 
  const removeUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/v1/remove_user?uuid=${uuid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_exist: data.is_exist,
        }),
      });
  
      if (!response.ok) {
        throw new Error((await response.json())?.error || "Failed to remove user");
      }
  
      return response.json();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove user");
    },
    onSuccess: (data) => {
      toast.success("User removed successfully");
      navigator.push("/dashboard/user_management");
    },
  });
  
  

  const Add_User_Validator = Yup.object().shape({
    firstname: Yup.string()
        .required("First Name is required"),
    
      // middlename: Yup.string(),
    
      lastname: Yup.string()
        .required("Last Name is required"),
    
      // suffix: Yup.string()
      //   .required("Suffix is required"),
    
      role: Yup.string().required("Role is required"),
    
      email: Yup.string().email("Invalid email").required("Email is required"),
    });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col w-11/12 mx-auto text-black">
      {/* Breadcrumbs */}
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/dashboard/user_management">User Management</Link>
          </li>
          <li>
            <span>Edit User</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-row justify-end items-center m-4">
      {/* Remove User Button */}
      <button
        className="btn btn-error btn-md"
        onClick={() => setIsRemoveModalOpen(true)}
      >
        <Trash2 /> Remove User
      </button>
</div>
      {/* Edit User Form */}
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={Add_User_Validator}
        onSubmit={(values) => {
          updateUserMutation.mutate(values);
        }}
      >
        {({ errors, touched }) => (
      <Form>
      <div className="flex flex-col gap-y-6 bg-base-200">
       
        <div className="border p-12 rounded-md bg-white text-black">
        <div className="flex flex-row justify-end items-center">
      
        
        </div>
          <h1 className="text-xl font-bold py-4">User Details</h1>
          <div className="grid lg:grid-cols-3 gap-6 w-full place-items-center grid-cols-1">
            
            <div>
              <label className="form-control w-96 max-w-lg">
               <FormInput
                  tooltip="Input of the First Name. This is required."
                  name="firstname"
                  placeholder="First Name"
                  label="First Name"
                  errors={errors.firstname ? errors.firstname : ""}
                  touched={touched.firstname ? "true" : ""}
                />
              </label>

             
            </div>

            {/* <div>
              <label className="form-control w-96 max-w-lg">
               <FormInput
                  tooltip="Input of the Middle Name. This is required."
                  name="middlename"
                  placeholder="Middle Name"
                  label="Middle Name"
                  errors={errors.middlename ? errors.middlename : ""}
                  touched={touched.middlename ? "true" : ""}
                />
              </label>
            </div> */}

            <div>
              <label className="form-control w-96 max-w-lg">
                <FormInput
                    tooltip="Input of the Last Name. This is required."
                    name="lastname"
                    placeholder="Last Name"
                    label="Last Name"
                    errors={errors.lastname ? errors.lastname : ""}
                    touched={touched.lastname ? "true" : ""}
                  />
              </label>
            </div>

            {/* <div>
              <label className="form-control w-96 max-w-lg">
                <FormSelect
                  tooltip="Select the Suffix name from the dropdown"
                  name="suffix"
                  placeholder="Choose a Suffix"
                  label="Suffix Name"
                  options={[
                    { value: "Jr", label: "Jr" },
                    { value: "Sr", label: "Sr" },
                    { value: "II", label: "II" },
                    { value: "III", label: "III" },
                    { value: "IV", label: "IV" },
                    { value: "N/A", label: "N/A" },
                  ]}
                  errors={errors.role ? errors.role : ""}
                  touched={touched.role ? "true" : ""}
                />
              </label>
            </div> */}

            <div>
              <label className="form-control w-96 max-w-lg">
                <FormSelect
                  tooltip="Select the Role name from the dropdown"
                  name="role"
                  placeholder="Choose a Role"
                  label="Role Name"
                  options={[{ value: "Admin", label: "Admin" }]}
                  errors={errors.role ? errors.role : ""}
                  touched={touched.role ? "true" : ""}
                />
              </label>
            </div>
            <div>
              <label className="form-control w-96 max-w-lg">
                <FormInput
                  tooltip="Input of the Email. This is required."
                  name="email"
                  placeholder="Email"
                  label="Email"
                  errors={errors.email ? errors.email : ""}
                  touched={touched.email ? "true" : ""}
                />
              </label>
            </div>
          </div>
         
        </div>

        <div className="modal-action p-6">
          <button
            type="submit"
            className={`btn ${
              updateUserMutation.isPending ? "btn-disabled" : "btn-primary"
            } btn-md`}
          >
            {updateUserMutation.isPending ? (
              <>
                <span className="loading loading-dots loading-sm"></span>{" "}
                Editing Site...
              </>
            ) : (
              <>
                <Pencil /> EDIT USER
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigator.push("/dashboard/user_management")}
            className="btn btn-accent btn-md"
          >
            BACK
          </button>
        </div>
      </div>
    </Form>
        )}
      </Formik>

      {/* Remove User Modal */}
      {isRemoveModalOpen && (
  <div className="modal modal-open">
    <div className="modal-box">
      <h3 className="text-lg font-bold">Confirm Removal</h3>
      <p>Are you sure you want to remove this user? This action cannot be undone.</p>
      <div className="modal-action">
        <button
          onClick={() => {
            removeUserMutation.mutate(
              {is_exist: false},
            );
          }}
          className={`btn btn-error ${
            removeUserMutation.isPending ? "loading" : ""
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
  );
}

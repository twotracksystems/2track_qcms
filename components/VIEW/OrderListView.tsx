"use client";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, FieldArray, Field, ErrorMessage } from "formik";
import { Eye, Pencil, Search, Slice, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef, use } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import { DateTime } from "luxon";
import { start } from "repl";

export default function OrderListView() {
  const [page, setPage] = useState(1);
  const searchInput = useRef<HTMLInputElement>(null);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [order, setOrder] = useState("Order");
  // const [sort_by, setSort_by] = useState("Sort By");
  const {
    data: ordersData,
    refetch: refetchOrdersData,
    isFetching,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "get_order",
      page,
      search,
      limit,
      startDate,
      endDate,
      // sort_by,
      // order,
    ],
    queryFn: async () => {
      if (startDate && endDate) {
        const response = await fetch(
          `/api/v1/get_order?page=${page}&search=${encodeURIComponent(
            search
          )}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );
        const result = await response.json();

        if (response.ok) {
          return result;
        } else {
          throw new Error("Something went wrong while fetching site list.");
        }
      } else {
        const response = await fetch(
          `/api/v1/get_order?page=${page}&search=${encodeURIComponent(
            search
          )}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );
        const result = await response.json();

        if (response.ok) {
          return result;
        } else {
          throw new Error("Something went wrong while fetching site list.");
        }
      }
    },
    retry: 1,
  });

  const navigator = useRouter();
  const supabase = createClient();
  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [orderid, setOrderid] = useState<string | null>(null);
  const [orderformdisplay, setOrderformdisplay] = useState<string | null>(null);
  const [asssing_id, setAssign_id] = useState<string | null>(null);
  const [editableRowProd, setEditableRowProd] = useState<number | null>(null);
  const [editableRowProof, setEditableRowProof] = useState<number | null>(null);
  const [editableRowMes, setEditableRowMes] = useState<number | null>(null);
  const [editproductionID, setEditproductionID] = useState<string | null>(null);
  const [countNumberControl, setCountNumberControl] = useState<number>(0);
  const [numberControl, setNumberControl] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState("tab1");
  const [filterPalleteCount, setFilterPalleteCount] = useState(1);
  const [enablepallete, setEnablePallete] = useState(false);
  const [enableplus, setenableplus] = useState(true);
  const [lastpalleteCount, setLastpalleteCount] = useState<number | 1>(1);
  const [tractnumbercontrollenght, setTractnumbercontrollenght] = useState<number|null>(null);
  const [isbuttonhide, setisbuttonhide] = useState<boolean>(false);
  const [isfieldhide, setisfieldhide] = useState<boolean>(false);
  const [isfieldhideproof, setisfieldhideproof] = useState<boolean>(false);
  const [isContinueAdd, setisContinueAdd] = useState<boolean>(false);
  const [editableGroupKey, setEditableGroupKey] = useState<string | null>(null);
  const [updatedGroupData, setUpdatedGroupData] = useState<{ [key: string]: any }>({});
  const [retrievedentryDateTime, setRetrievedentryDateTime] = useState<string | null>(null);
  const [retrievedexitDateTime, setRetrievedexitDateTime] = useState<string | null>(null);
  const [isMaxRow,setisMaxRow] = useState<boolean>(false);


  console.log("current enablepallete: ", enablepallete);
  console.log("rows lenght",tractnumbercontrollenght);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setUseremail(data.user?.user_metadata.email || null);
      setUserRole(data.user?.user_metadata.role || null);
      setUserID(data.user?.id || null);
    };

    fetchUserEmail();
  }, [supabase.auth]);

  const { data: customersData } = useQuery({
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
  const ordersWithCustomerNames =
    ordersData?.data?.map((order: any) => {
      const customer = customersData?.data?.find(
        (cust: any) => cust.id === order.customer_id
      );

      return {
        ...order,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
      };
    }) || [];
  console.log("Orders With Customer Names:", ordersWithCustomerNames);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModal] = useState(false);
  const [initialValues, setInitialValues] = useState({
    rows: [
      {
        production_order_form_id: "",
        production_entry_date_time: "",
        production_exit_date_time: "",
      },
    ],
    rows2: [
      {
        production_id: "",
        production_order_form_id: "",
        production_entry_date_time: "",
        production_exit_date_time: "",
      },
    ],
  });

  const [initialValuesProofing, setInitialValuesProofing] = useState({
    rowsproofing: [
      {
        proofing_order_form_id: "",
        proofing_entry_date_time: "",
        proofing_exit_date_time: "",
        proofing_num_pallete: "",
        proofing_program_name: "",
      },
    ],

    rows3: [
      {
        proofing_id: "",
        proofing_order_form_id: "",
        proofing_entry_date_time: "",
        proofing_exit_date_time: "",
        proofing_num_pallete: "",
        proofing_program_name: "",
      },
    ],
  });

  const [initialValuesMeasurement, setInitialValuesMeasurement] = useState({
    rowsmeasurement: [
      {

        measurement_id: "",
        pallete_count: lastpalleteCount,
        number_of_control: 0,
        length: "",
        inside_diameter: "",
        outside_diameter: "",
        flat_crush: "",
        h20: "",
        radial: "",
        remarks: "",
        isnew: false, // Added isnew property
        iswhiteAll: false,
      },
    ],
    rows4: [
      {
        id: "",
        measurement_id: "",
        pallete_count: "",
        number_of_control: "",
        length: "",
        inside_diameter: "",
        outside_diameter: "",
        flat_crush: "",
        h20: "",
        radial: "",
        remarks: "",
        isControlRow: false,
      },
    ],
  });

  // useEffect(() => {
  //   setInitialValuesMeasurement((prev) => ({
  //     ...prev,
  //     rowsmeasurement: prev.rowsmeasurement.map((row) => ({
  //       ...row,
  //       pallete_count: lastpalleteCount,
  //     })),
  //   }));
  // }, [lastpalleteCount]);

  // console.log("controlnumber:  ", initialValuesMeasurement.rowsmeasurement[0].number_of_control);
  //   console.log("controlnumber:  ", initialValuesMeasurement.rowsmeasurement[0].number_of_control);
  const initialValuesAssign = {
    user_id: "",
  };
  const validationSchemaAssign = Yup.object({
    user_id: Yup.string().required("User is required"),
  });

  const validationSchema = Yup.object({
    rows: Yup.array().of(
      Yup.object().shape({
        production_entry_date_time: Yup.date()
          .required("Entry Date & Time is required")
          .typeError("Invalid date format"),
        production_exit_date_time: Yup.date()
          .required("Exit Date & Time is required")
          .typeError("Invalid date format"),
      })
    ),
  });
  const validationSchemaProofing = Yup.object({
    rowsproofing: Yup.array().of(
      Yup.object().shape({
        proofing_entry_date_time: Yup.date()
          .required("Entry Date & Time is required")
          .typeError("Invalid date format"),
        proofing_exit_date_time: Yup.date()
          .required("Exit Date & Time is required")
          .typeError("Invalid date format"),
        proofing_num_pallete: Yup.number().required(
          "Number of Pallets is required"
        ),
        proofing_program_name: Yup.string().required(
          "Program Name is required"
        ),
      })
    ),
  });

  const AddOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to add production");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Production Added Successfully");
      navigator.push("/dashboard/order_management");
      refetchProductionData();
    },
  });

  const { data: fetchedProductionData, refetch: refetchProductionData } =
    useQuery({
      queryKey: ["production", orderid],
      queryFn: async () => {
        const response = await fetch(`/api/v1/getoneorder/?id=${orderid}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch production data: ${response.status}`
          );
        }
        return response.json();
      },
      enabled: !!orderid,
    });

  useEffect(() => {
    if (fetchedProductionData?.length > 0) {
      const productionData = fetchedProductionData[0];
      setisbuttonhide(false);
      // setisfieldhide(true);
      setRetrievedentryDateTime(productionData.entry_date_time);
      setRetrievedexitDateTime(productionData.exit_date_time);
      if(productionData.entry_date_time ===null && productionData.exit_date_time ===null){
        setisfieldhide(false);
      }else{
        setisfieldhide(true);
      }
      //setEditproductionID(productionData.id);
      setInitialValues((prev) => ({
        ...prev,
        rows2: fetchedProductionData.map((data: any) => ({
          production_id: data.id,
          production_order_form_id: data.order_form_id,
          production_entry_date_time: data.entry_date_time,
          production_exit_date_time: data.exit_date_time,
        })),
        
      }));
      
    } else {
      setisbuttonhide(true);
      // setisfieldhide(false);
      setInitialValues((prev) => ({
        ...prev,
        rows2: [
          {
            production_id: "",
            production_order_form_id: "",
            production_entry_date_time: "",
            production_exit_date_time: "",
            ishidefield: false,
          },
        ],
      }));
    }
  }, [fetchedProductionData, refetchProductionData]);
  console.log("fetchedProductionData", fetchedProductionData?.length);
  
        console.log("updated entry",retrievedentryDateTime);

  const updateProductionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(
        `/api/v1/edit_production?id=${orderid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entry_date_time: updatedData.production_entry_date_time,
            exit_date_time: updatedData.production_exit_date_time,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update production data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update production data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Production data updated successfully");
      refetchProductionData();
    },
  });

  const removeProductionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      console.log("data of remove:mutation", updatedData);
      const response = await fetch(
        `/api/v1/remove_production?id=${updatedData.production_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_exist: updatedData.is_exist,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update production data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to remove production data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Production data remove successfully");
      refetchProductionData();
    },
  });

  // proofing
  const AddProofingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_proofing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to add proofing");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Proofing Added Successfully");
      navigator.push("/dashboard/order_management");
      refetchProofingData();
    },
  });

  const { data: fetchedProofingData, refetch: refetchProofingData } = useQuery({
    queryKey: ["proofing", orderid],
    queryFn: async () => {
      const response = await fetch(`/api/v1/getoneproofing/?id=${orderid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch proofing data: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!orderid,
  });

  useEffect(() => {
    if (fetchedProofingData?.length > 0) {
      const proofingData = fetchedProofingData[0];
      //setEditproductionID(proofingData.id);
      setisfieldhideproof(true);
      setInitialValuesProofing((prev) => ({
        ...prev,
        rows3: fetchedProofingData.map((data: any) => ({
          proofing_id: data.id,
          proofing_order_form_id: data.order_form_id,
          proofing_entry_date_time: data.entry_date_time,
          proofing_exit_date_time: data.exit_date_time,
          proofing_num_pallete: data.num_pallets,
          proofing_program_name: data.program_name,
        })),
      }));
    } else {
      setisfieldhideproof(false);
      setInitialValuesProofing((prev) => ({
        ...prev,
        rows3: [
          {
            proofing_id: "",
            proofing_order_form_id: "",
            proofing_entry_date_time: "",
            proofing_exit_date_time: "",
            proofing_num_pallete: "",
            proofing_program_name: "",
          },
        ],
      }));
    }
  }, [fetchedProofingData]);
  // console.log("fetchedProofingData", fetchedProofingData?.length);

  const updateProofingMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(
        `/api/v1/edit_proofing?id=${updatedData.proofing_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entry_date_time: updatedData.proofing_entry_date_time,
            exit_date_time: updatedData.proofing_exit_date_time,
            num_pallets: updatedData.proofing_num_pallete,
            program_name: updatedData.proofing_program_name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update proofing data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update proofing data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Proofing data updated successfully");
      refetchProofingData();
    },
  });
  const removeProofingMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(
        `/api/v1/remove_proofing?id=${updatedData.proofing_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_exist: updatedData.is_exist,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update proofing data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to remove proofing data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Proofing data remove successfully");
      refetchProofingData();
    },
  });

  //measurement
  const AddMeasurementMutation = useMutation({
    mutationFn: async (data: any) => {
      // alert("Data to be added: " + JSON.stringify(data, null, 2));
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
      refetchMeasurentData();
    },
    onMutate: (data) => {
      return data;
    },
  });

  const { data: fetchedMeasurementData, refetch: refetchMeasurentData } =
    useQuery({
      queryKey: ["measurement", orderid],
      queryFn: async () => {
        const response = await fetch(
          `/api/v1/getonemeasurement/?id=${orderid}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch proofing data: ${response.status}`);
        }
        return response.json();
      },
      enabled: !!orderid,
    });

  useEffect(() => {
    if (fetchedMeasurementData?.length > 0) {
      //setEditproductionID(proofingData.id);
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rows4: fetchedMeasurementData.map((data: any) => ({
          measurement_id: data.id,
          pallete_count: data.pallete_count,
          number_of_control: data.number_control,
          length: data.length,
          inside_diameter: data.inside_diameter,
          outside_diameter: data.outside_diameter,
          flat_crush: data.flat_crush,
          h20: data.h20,
          radial: data.radial,
          remarks: data.remarks,
        })),
      }));
    }
  }, [fetchedMeasurementData]);

  useEffect(() => {
    if (fetchedMeasurementData?.length > 0) {
      // If fetchedMeasurementData has data, update rowsmeasurement with numberControl
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rowsmeasurement: prev.rowsmeasurement.map((row) => ({
          ...row,
          number_of_control: 0, // Set to the provided numberControl
          pallete_count: 0,
          iswhiteAll: true,
        })),
      }));
    } else {
      // If fetchedMeasurementData is empty or undefined, set number_of_control to 0
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rowsmeasurement: prev.rowsmeasurement.map((row) => ({
          ...row,
          number_of_control: numberControl,
          pallete_count: lastpalleteCount,
          iswhiteAll: false,
        })),
      }));
    }
  }, [numberControl, lastpalleteCount, fetchedMeasurementData]);

  useEffect(() => {
    if (fetchedMeasurementData?.length > 0) {
      // If fetchedMeasurementData has data, update rowsmeasurement with numberControl
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rowsmeasurement: prev.rowsmeasurement.map((row) => ({
          ...row,
          number_of_control: 0, // Set to the provided numberControl
        })),
      }));
    } else {
      // If fetchedMeasurementData is empty or undefined, set number_of_control to 0
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rowsmeasurement: prev.rowsmeasurement.map((row) => ({
          ...row,
          number_of_control: numberControl, // Reset to 0
        })),
      }));
    }
  }, [numberControl, fetchedMeasurementData]);

  useEffect(() => {
    if (fetchedMeasurementData?.length > 0) {
      // Extract pallete_count values
      const palleteCounts = fetchedMeasurementData.map(
        (item: any) => item.pallete_count || 0
      );

      // Find the highest pallete_count
      const maxPalleteCount = Math.max(...palleteCounts);

      // Update the state
      // setHighestPalleteCount(maxPalleteCount);

      console.log("All Pallete Counts:", palleteCounts);
      console.log("Highest Pallete Count:", maxPalleteCount);
      setLastpalleteCount(maxPalleteCount);
      setEnablePallete(true);
    } else {
      setLastpalleteCount(1);
      setTractnumbercontrollenght(1);
      setEnablePallete(false);
    }
  }, [fetchedMeasurementData]); // Add fetchedMeasurementData as a dependency
  
  const updateMeasurementMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      // alert("Data to be updated: " + JSON.stringify(updatedData, null, 2));
      console.log("Data to be updated: ", updatedData);
      const response = await fetch(
        `/api/v1/edit_measurement?id=${updatedData.measurement_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pallete_count: updatedData.pallete_count,
            number_control: 0,
            length: updatedData.length,
            inside_diameter: updatedData.inside_diameter,
            outside_diameter: updatedData.outside_diameter,
            flat_crush: updatedData.flat_crush,
            h20: updatedData.h20,
            radial: updatedData.radial,
            remarks: updatedData.remarks,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update measurement data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update measurement data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Measurement data updated successfully");
      refetchMeasurentData();

      // You can do additional logic here, e.g., close the modal or refresh data
    },
  });

  const removeMeasurementMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(
        `/api/v1/remove_measurement?id=${updatedData.measurement_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_exist: updatedData.is_exist,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove measurement data");
      }

      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to remove measurement data");
      console.error(error);
    },
    onSuccess: (data) => {
      toast.success("Measurement data remove successfully");
      refetchMeasurentData();

      // You can do additional logic here, e.g., close the modal or refresh data
    },
  });
  //assigning
  const [error, setError] = useState<string | null>(null);

  const {
    data: customerData,
    isFetching: isFetchingCustomers,
    isError: isErrorCustomers,
    refetch: refetchAssignData,
  } = useQuery({
    queryKey: ["get_users", page, search, limit],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/get_users?page=${page}&search=${search}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      return response.json();
    },
    staleTime: 5000,
    retry: 2,
    // Handle error inside the query function
  });

  const customerOptions =
    customerData?.data.map((customer: any) => ({
      value: customer.uuid,
      label: `${customer.first_name} ${customer.last_name}`,
    })) || [];

  const AssignOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();

      // Return status and response data
      return {
        status: response.status,
        data: responseData,
      };
    },
    onError: (error) => {
      toast.error("Failed to add assignee");
    },
    onSuccess: ({ status, data }) => {
      if (status === 200) {
        // Handle success for user creation
        toast.success("Assign added successfully");
        refetchAssignData();
        // Delay navigation by 2 seconds (2000 milliseconds)
        setTimeout(() => {
          navigator.push("/dashboard/order_management");
        }, 2000);
      } else if (status === 409) {
        // Handle conflict (e.g., user already exists)
        toast.error(
          "The email is already registered. Please use a different email and try again."
        );
      } else {
        // Handle other non-success statuses
        toast.error("An unexpected error occur  red. Please try again.");
      }
    },
    onMutate: (data) => {
      return data;
    },
  });

  return (
    <div className="overflow-x-auto mt-4 w-11/12 mx-auto text-black">
      <div className="breadcrumbs my-4 text-lg text-slate-600 font-semibold">
        <ul>
          <li>
            <Link href="/"> </Link>
          </li>
          <li>
            <span>Order Fabrication Management</span>
          </li>
        </ul>
      </div>
      <div className="w-11/12 flex flex-col mx-auto gap-y-12 h-full">
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex gap-4">
            <label className="input mt-auto pr-0 input-bordered flex flex-row justify-center items-center">
              <input
                type="text"
                ref={searchInput}
                className="grow w-full"
                placeholder="Search OF ID"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const searchValue = searchInput.current?.value || "";
                    console.log("Search Triggered:", searchValue); // Debug
                    setSearch(searchValue);
                    setPage(1); // Reset to page 1
                  }
                }}
              />

              <button
                onClick={() => {
                  setSearch(searchInput.current?.value || "");
                  setPage(1);
                }}
                className="btn btn-sm h-full drop-shadow-2xl flex items-center gap-2"
              >
                <Search color="#000000" /> Search
              </button>
            </label>
            {/* <div className="flex flex-col">
              <label className="text-black">Order By: </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="Order">Order</option>
                <option value="Ascending">Ascending</option>
                <option value="Descending">Descending</option>
              </select>
            </div> */}
            {/* <div className="flex flex-col">
              <label className="text-black">Sort By: </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={sort_by}
                onChange={(e) => setSort_by(e.target.value)}
              >
                <option value="Sort By">Sort By</option>
                <option value="order_fabrication_control">
                  Order Fabrication ID
                </option>
                <option value="product_name">Product Name</option>
                <option value="created_at">Created Date</option>
                <option value="pallete_count"></option>
              </select>
            </div> */}
            <div className="flex flex-col">
              <label className="text-black">Start Date: </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered"
                placeholder="Start Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-black">End Date: </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered"
                placeholder="End Date"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-black invisible">End Date: </label>
              <Link
                href="/dashboard/addorder"
                className="btn my-auto btn-primary"
              >
                Add Order
              </Link>
            </div>
            <div className="flex flex-col">
              <label className="text-black invisible">End Date: </label>
              <button
                className="btn my-auto btn-info"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  // setOrder("Order");
                  // setSort_by("Sort By");
                  setSearch("");
                  setPage(1);
                  if (searchInput.current) {
                    searchInput.current.value = "";
                  }
                }}
              >
                Refresh
              </button>
            </div>

            {/* <button
    onClick={() => {
      setSearch(searchInput.current?.value || "");
      setPage(1);
    }}
    className="btn btn-sm btn-primary"
  >
    Search
  </button> */}
          </div>
        </div>

        <table className="table text-center">
          <thead>
            <tr>
              <th>OF ID</th>
              {/* <th>Product Name</th> */}
              <th>Customer Name</th>
              <th>Product Name</th>
              <th>Pallete Count</th>
              {/* <th>Created Date</th> */}
              <th>Production Entry Date</th>
              <th>Production Exit Date</th>
              <th>OPTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={7}>
                  <span className="loading loading-dots loading-md"></span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="text-error font-bold" colSpan={7}>
                  Something went wrong while fetching orders list.
                </td>
              </tr>
            ) : ordersData?.data?.length > 0 ? (
              ordersData.data.map((order: any, index: number) => (
                <tr key={index}>
                  <td
                    className="text-xs hover:text-orange-500 hover:cursor-pointer"
                    onClick={() => {
                      setIsModalOpen(true);
                      setOrderid(order.id);
                      setOrderformdisplay(order.order_fabrication_control);
                      setNumberControl(3);
                      setFilterPalleteCount(order.pallete_count);
                    }}
                  >
                    {order.order_fabrication_control}
                  </td>
                  {/* <td>{order.product_name ? order.product_name: " "}</td> */}
                  <td>{order.tbl_customer?.company_name ? order.tbl_customer?.company_name: " "}</td>
                  <td>{order.tbl_article?.article_name ? order.tbl_article?.article_name: " "}</td>
                  <td>{order.pallete_count ? order.pallete_count : " "}</td>
                  <td>
                    {order.entry_date_time
                      ? DateTime.fromISO(order.entry_date_time, { zone: "utc" }).toFormat("dd/MM/yy hh:mm a")
                      : " "}
                  </td>
                  <td>
                    {order.exit_date_time
                      ? DateTime.fromISO(order.exit_date_time,{zone:"utc"}).toFormat(
                          "dd/MM/yy hh:mm a"
                        )
                      : " "}
                  </td>

                  <td className="justify-center items-center flex gap-4">
                    {userRole === "Super Admin" && (
                      <button
                        className="btn btn-info"
                        onClick={() => {
                          setAssignModal(true);
                          setOrderid(order.id);
                        }}
                      >
                        Assign
                      </button>
                    )}
                    <Link
                      href={`/dashboard/editorder/${order.id}`}
                      className="link flex"
                    >
                      <Pencil className="text-warning" /> Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="font-bold" colSpan={7}>
                  NO DATA FOUND.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7}>
                <span className="text-xs">
                  {ordersData?.total_count
                    ? `${(page - 1) * limit + 1}-${Math.min(
                        page * limit,
                        ordersData.total_count
                      )} of ${ordersData.total_count} Order Fabrication Found`
                    : "No Results"}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
        {/* Pagination */}
        <div className="flex justify-between gap-4 items-center mx-auto">
          <div className="join">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`join-item btn ${page === 1 ? "disabled" : ""}`}
              disabled={page === 1}
            >
              «
            </button>
            <button className="join-item btn">Page {page}</button>
            <button
              onClick={() =>
                setPage((prev) =>
                  prev * limit < (ordersData?.total_count || 0)
                    ? prev + 1
                    : prev
                )
              }
              className={`join-item btn ${
                page * limit >= (ordersData?.total_count || 0) ? "disabled" : ""
              }`}
              disabled={page * limit >= (ordersData?.total_count || 0)}
            >
              »
            </button>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-full">
              <div className="flex place-content-end"></div>
              <div role="tablist" className="tabs tabs-lifted">
                <input
                  type="radio"
                  name="my_tabs_2"
                  role="tab"
                  className="tab"
                  aria-label="Production"
                  id="tab1"
                  checked={selectedTab === "tab1"}
                  onChange={() => setSelectedTab("tab1")}
                />
                <div
                  role="tabpanel"
                  className="tab-content bg-base-100 border-base-300 rounded-box p-6"
                >
                  <Formik
                    initialValues={initialValues}
                    enableReinitialize={true}
                    validationSchema={validationSchema}
                    onSubmit={async (values) => {
                      try {
                        for (const row of values.rows) {
                          if (orderid) {
                            await updateProductionMutation.mutateAsync({
                              production_entry_date_time: row.production_entry_date_time,
                              production_exit_date_time: row.production_exit_date_time,
                            });
                          }
                        }
                      } catch (error) {
                        toast.error("Failed to complete operation");
                        console.error("Error in mutation:", error);
                      }
                    }}
                  >
                    {({ values, setFieldValue, errors, touched }) => (
                      console.log(values),
                      (
                        <Form>
                          <div className="">
                            <FieldArray
                              name="rows"
                              render={(arrayHelpers) => (
                                <div>
                                  <div className="flex place-content-end gap-3">
                                    {retrievedentryDateTime === null && retrievedexitDateTime=== null ? (
                      
                                      <button
                                        className="btn btn-primary"
                                        type="submit"
                                      >
                                        Save Production
                                      </button>
                                    ) : null}
                                    <button
                                      className="btn btn-accent"
                                      onClick={() => {
                                        refetchOrdersData();
                                        setEditableRowProd(null);
                                        setIsModalOpen(false);
                                        setOrderid(null);
                                        refetchMeasurentData();
                                        refetchProductionData();
                                        refetchProofingData();
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="text-black overflow-auto">
                                    <table className="table relative text-center overflow-auto">
                                      <thead className="text-black text-sm">
                                        <tr>
                                          {/* <th>Article Name</th> */}
                                          {/* <td></td> */}
                                          <th>OF_ID</th>
                                          <th>Entry Date & Time</th>
                                          <th>Exit Date & Time</th>
                                          <th>Action</th>
                                        </tr>
                                      </thead>
                                      {/* tbody for length */}
                                      {values.rows.map((row, index) => (
                                        <React.Fragment key={index}>
                                          <tbody>
                                            <tr>
                                              <td>
                                                <Field
                                                  readOnly
                                                  value={orderformdisplay}
                                                  name={`rows.${index}.production_order_form_id`}
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md 
                                                    ${
                                                    isfieldhide
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }
                                                  `}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rows.${index}.production_entry_date_time`}
                                                  type="datetime-local"
                                                  className={`input input-bordered 
    ${
      typeof errors.rows?.[index] === "object" &&
      errors.rows?.[index]?.production_entry_date_time &&
      touched.rows?.[index]?.production_entry_date_time
        ? "border-red-500"
        : ""
    } 
    ${isfieldhide ? "hidden" : "bg-white"}
  `}
                                                />

                                                <ErrorMessage
                                                  name={`rows.${index}.production_entry_date_time`}
                                                  component="div"
                                                  className="text-red-500 text-sm"
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rows.${index}.production_exit_date_time`}
                                                  type="datetime-local"
                                                  className={`input input-bordered ${
                                                    typeof errors.rows?.[
                                                      index
                                                    ] === "object" &&
                                                    errors.rows?.[index]
                                                      ?.production_exit_date_time &&
                                                    touched.rows?.[index]
                                                      ?.production_exit_date_time
                                                      ? "border-red-500"
                                                      : ""
                                                  }${
                                                    isfieldhide
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }
                                                  `}
                                                />
                                                <ErrorMessage
                                                  name={`rows.${index}.production_exit_date_time`}
                                                  component="div"
                                                  className="text-red-500 text-sm"
                                                />
                                              </td>
                                              <td>
                                                {/* <button
                                                  className= {`btn btn-error bg-red ${isfieldhide ? "hidden" : "bg-white"}`}
                                                  type="button"
                                                  onClick={() =>
                                                    arrayHelpers.remove(index)
                                                  }
                                                >
                                                  Remove
                                                </button> */}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </React.Fragment>
                                      ))}

                                      {/* second FieldArray */}
                                      {isLoading || isFetching ? (
                                        <tr>
                                          <td colSpan={7}>
                                            <span className="loading loading-dots loading-md"></span>
                                          </td>
                                        </tr>
                                      ) : isError ? (
                                        <tr>
                                          <td
                                            className="text-error font-bold"
                                            colSpan={7}
                                          >
                                            Something went wrong while fetching
                                            orders list.
                                          </td>
                                        </tr>
                                      ) : retrievedentryDateTime === null && retrievedexitDateTime === null ? (
                                        <p className="text-center text-sm text-slate-600">
                                          No Production Data Found
                                        </p>
                                      ) : (
                                        <FieldArray
                                          name="rows2"
                                          render={(arrayHelpers) => (
                                            <tbody>
                                              <tr>
                                                <td></td>
                                              </tr>
                                              {values.rows2.map(
                                                (row, index) => (
                                                  <tr key={index}>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_order_form_id`}
                                                        type="text"
                                                        value={orderformdisplay}
                                                        className="input input-bordered"
                                                        readOnly
                                                      />
                                                    </td>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_entry_date_time`}
                                                        type="datetime-local"
                                                        className="input input-bordered"
                                                        value={
                                                          values.rows2[index]
                                                            .production_entry_date_time
                                                            ? values.rows2[
                                                                index
                                                              ].production_entry_date_time.slice(
                                                                0,
                                                                16
                                                              )
                                                            : ""
                                                        }
                                                        onChange={(e: any) => {
                                                          const newValue =
                                                            e.target.value;
                                                          setFieldValue(
                                                            `rows2.${index}.production_entry_date_time`,
                                                            newValue
                                                          );
                                                        }}
                                                        readOnly={
                                                          editableRowProd !==
                                                          index
                                                        }
                                                      />
                                                    </td>
                                                    <td className="border-y border-slate-500">
                                                      <Field
                                                        name={`rows2.${index}.production_exit_date_time`}
                                                        type="datetime-local"
                                                        className="input input-bordered"
                                                        value={
                                                          values.rows2[index]
                                                            .production_exit_date_time
                                                            ? values.rows2[
                                                                index
                                                              ].production_exit_date_time.slice(
                                                                0,
                                                                16
                                                              )
                                                            : ""
                                                        }
                                                        onChange={(e: any) => {
                                                          const newValue =
                                                            e.target.value;
                                                          setFieldValue(
                                                            `rows2.${index}.production_exit_date_time`,
                                                            newValue
                                                          );
                                                        }}
                                                        readOnly={
                                                          editableRowProd !==
                                                          index
                                                        }
                                                      />
                                                    </td>

                                                    <td className="border-y border-slate-500">
                                                      <div className="flex gap-2">
                                                        {editableRowProd ===
                                                        index ? (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className="btn btn-success"
                                                              onClick={async () => {
                                                                try {
                                                                  await updateProductionMutation.mutateAsync(
                                                                    {
                                                                      production_id:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_id,
                                                                      production_entry_date_time:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_entry_date_time,
                                                                      production_exit_date_time:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_exit_date_time,
                                                                    }
                                                                  );
                                                                  setEditableRowProd(
                                                                    null
                                                                  ); // Reset editable row after saving
                                                                } catch (error) {
                                                                  console.error(
                                                                    "Error in mutation:",
                                                                    error
                                                                  );
                                                                }
                                                              }}
                                                            >
                                                              Save
                                                            </button>
                                                            <button
                                                              className="btn btn-primary"
                                                              type="button"
                                                              onClick={() => {
                                                                // Alert first, then reset the editable row and refetch data
                                                                if (
                                                                  window.confirm(
                                                                    "Are you sure you want to cancel?"
                                                                  )
                                                                ) {
                                                                  setTractnumbercontrollenght(
                                                                    0
                                                                  );
                                                                  setEditableRowProd(
                                                                    null
                                                                  ); // Reset the editable state
                                                                  refetchProductionData(); // Trigger the refetch
                                                                  // Close the modal first
                                                                  setIsModalOpen(
                                                                    false
                                                                  );

                                                                  // Reopen it after a small delay
                                                                  setTimeout(
                                                                    () => {
                                                                      setIsModalOpen(
                                                                        true
                                                                      );
                                                                      setSelectedTab(
                                                                        "tab1"
                                                                      );
                                                                    },
                                                                    100
                                                                  ); // Delay of 100ms to ensure the close transition happens
                                                                }
                                                              }}
                                                            >
                                                              Cancel
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className={`btn btn-primary ${
                                                                editableRowProd !==
                                                                null
                                                                  ? "hidden"
                                                                  : ""
                                                              }`}
                                                              onClick={() =>
                                                                setEditableRowProd(
                                                                  index
                                                                )
                                                              }
                                                            >
                                                              Edit
                                                            </button>
                                                            {/* <button
                                                              type="button"
                                                              className={`btn btn-error ${
                                                                editableRowProd !==
                                                                null
                                                                  ? "hidden"
                                                                  : ""
                                                              } ${
                                                                removeProductionMutation.isPending
                                                                  ? "loading"
                                                                  : ""
                                                              }`}
                                                              onClick={() => {
                                                                const isConfirmed =
                                                                  window.confirm(
                                                                    "Are you sure you want to remove this production?"
                                                                  );
                                                                if (
                                                                  isConfirmed
                                                                ) {
                                                                  removeProductionMutation.mutate(
                                                                    {
                                                                      production_id:
                                                                        values
                                                                          .rows2[
                                                                          index
                                                                        ]
                                                                          .production_id,
                                                                      is_exist:
                                                                        false,
                                                                    }
                                                                  );
                                                                }
                                                              }}
                                                            >
                                                              Remove
                                                            </button> */}
                                                          </>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          )}
                                        />
                                      )}
                                    </table>
                                  </div>
                                </div>
                              )}
                            />
                          </div>
                        </Form>
                      )
                    )}
                  </Formik>
                </div>

                <input
                  type="radio"
                  name="my_tabs_2"
                  role="tab"
                  className="tab"
                  aria-label="Proofing"
                  defaultChecked
                  id="tab2"
                  checked={selectedTab === "tab2"}
                  onChange={() => setSelectedTab("tab2")}
                />
                <div
                  role="tabpanel"
                  className="tab-content bg-base-100 border-base-300 rounded-box p-6"
                >
                  <Formik
                    initialValues={initialValuesProofing}
                    enableReinitialize={true}
                    validationSchema={validationSchemaProofing}
                    onSubmit={async (values) => {
                      try {
                        for (const row of values.rowsproofing) {
                          await AddProofingMutation.mutateAsync({
                            order_form_id: orderid,
                            entry_date_time: row.proofing_entry_date_time,
                            exit_date_time: row.proofing_exit_date_time,
                            num_pallets: row.proofing_num_pallete,
                            program_name: row.proofing_program_name,
                            user_id: userID,
                          });
                        }
                      } catch (error) {
                        toast.error("Failed to complete operation");
                        console.error("Error in mutation:", error);
                      }
                    }}
                  >
                    {({ values, setFieldValue, errors, touched }) => (
                      <Form>
                        <div className="">
                          <FieldArray
                            name="rowsproofing"
                            render={(arrayHelpers) => (
                              <div>
                                <div className="flex place-content-end gap-3">
                                  {/* {fetchedProofingData?.length === 0 ? ( */}
                                    {/* <> */}
                                      <button
                                      className="btn btn-info"
                                      type="button"
                                      onClick={() => arrayHelpers.push({
                                        proofing_order_form_id: "",
                                        proofing_entry_date_time: "",
                                        proofing_exit_date_time: "",
                                        proofing_num_pallete: "",
                                        proofing_program_name: "",
                                      })}
                                    >
                                      Add Proofing
                                    </button>
                                      <button
                                        className="btn btn-primary"
                                        type="submit"
                                      >
                                        Save Proofing
                                      </button>
                                    {/* </> */}
                                  {/* // ) : null} */}
                                  <button
                                    className="btn btn-accent"
                                    onClick={() => {
                                      refetchOrdersData();
                                      setTractnumbercontrollenght(0);
                                      setEditableRowProof(null);
                                      setIsModalOpen(false);
                                      setOrderid(null);
                                      refetchMeasurentData();
                                      refetchProductionData();
                                      refetchProofingData();
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="text-black overflow-auto">
                                  <table className="table relative text-center overflow-auto">
                                    <thead className="text-black text-sm">
                                      <tr>
                                        {/* <th>Article Name</th> */}
                                        {/* <td></td> */}
                                        <th>OF_ID</th>
                                        <th>Entry Date & Time</th>
                                        <th>Exit Date & Time</th>
                                        <th>Number Of Pallets</th>
                                        <th>Program Name</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    {/* tbody for length */}
                                    {values.rowsproofing.map((row, index) => (
                                      <React.Fragment key={index}>
                                        <tbody>
                                          <tr>
                                            <td>
                                              <Field
                                                readOnly
                                                value={orderformdisplay}
                                                name={`rowsproofing.${index}.proofing_order_form_id`}
                                                type="number"
                                                className="input input-bordered w-20 max-w-md"
                                                // className={`input input-bordered w-20 max-w-md 
                                                //   ${isfieldhideproof
                                                //     ? "hidden"
                                                //     : "bg-white"
                                                // }
                                                // `}
                                              />
                                            </td>
                                            <td>
                                              <Field
                                                name={`rowsproofing.${index}.proofing_entry_date_time`}
                                                type="datetime-local"
                                                className={`input input-bordered ${
                                                  typeof errors.rows3?.[
                                                    index
                                                  ] === "object" &&
                                                  errors.rows3?.[index]
                                                    ?.proofing_entry_date_time &&
                                                  touched.rows3?.[index]
                                                    ?.proofing_entry_date_time
                                                    ? "border-red-500"
                                                    : ""
                                                }
                                            
                                                `}
                                              />
                                              <ErrorMessage
                                                name={`rowsproofing.${index}.proofing_entry_date_time`}
                                                component="div"
                                                className="text-red-500 text-sm"
                                              />
                                            </td>
                                            <td>
                                              <Field
                                                name={`rowsproofing.${index}.proofing_exit_date_time`}
                                                type="datetime-local"
                                                className={`input input-bordered ${
                                                  typeof errors.rows3?.[
                                                    index
                                                  ] === "object" &&
                                                  errors.rows3?.[index]
                                                    ?.proofing_exit_date_time &&
                                                  touched.rows3?.[index]
                                                    ?.proofing_exit_date_time
                                                    ? "border-red-500"
                                                    : ""
                                                }
                                              
                                                `}
                                              />
                                              <ErrorMessage
                                                name={`rowsproofing.${index}.proofing_exit_date_time`}
                                                component="div"
                                                className="text-red-500 text-sm"
                                              />
                                            </td>
                                            <td>
                                              <Field
                                                name={`rowsproofing.${index}.proofing_num_pallete`}
                                                type="number"
                                                className="input input-bordered max-w-md"
                                                // className={`input input-bordered ${
                                                //   isfieldhideproof
                                                //     ? "hidden"
                                                //     : "bg-white"
                                                // }`}
                                              />
                                            </td>
                                            <td>
                                              <Field
                                                name={`rowsproofing.${index}.proofing_program_name`}
                                                type="text"
                                                className="input input-bordered max-w-md"
                                                // className={`input input-bordered ${
                                                //   isfieldhideproof
                                                //     ? "hidden"
                                                //     : "bg-white"
                                                // }`}
                                              />
                                            </td>
                                            <td>
                                              <button
                                                className="btn btn-error"
                                                type="button"
                                                onClick={() =>
                                                  arrayHelpers.remove(index)
                                                }
                                              >
                                                Remove
                                              </button>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </React.Fragment>
                                    ))}

                                    {/* second FieldArray */}
                                    {isLoading || isFetching ? (
                                      <tr>
                                        <td colSpan={7}>
                                          <span className="loading loading-dots loading-md"></span>
                                        </td>
                                      </tr>
                                    ) : isError ? (
                                      <tr>
                                        <td
                                          className="text-error font-bold"
                                          colSpan={7}
                                        >
                                          Something went wrong while fetching
                                          orders list.
                                        </td>
                                      </tr>
                                    ) : fetchedProofingData?.length === 0 ? (
                                      <p className="text-center text-sm text-slate-600">
                                        No Proofing Data Found
                                      </p>
                                    ) : (
                                      <FieldArray
                                        name="rows3"
                                        render={(arrayHelpers) => (
                                          <tbody>
                                            <tr>
                                              <td></td>
                                            </tr>
                                            {values.rows3.map((row, index) => (
                                              <tr key={index}>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows3.${index}.proofing_order_form_id`}
                                                    type="text"
                                                    value={orderformdisplay}
                                                    className="input input-bordered"
                                                    readOnly
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows3.${index}.proofing_entry_date_time`}
                                                    type="datetime-local"
                                                    className="input input-bordered"
                                                    value={
                                                      values.rows3[index]
                                                        .proofing_entry_date_time
                                                        ? values.rows3[
                                                            index
                                                          ].proofing_entry_date_time.slice(
                                                            0,
                                                            16
                                                          )
                                                        : ""
                                                    }
                                                    onChange={(e: any) => {
                                                      const newValue =
                                                        e.target.value;
                                                      setFieldValue(
                                                        `rows3.${index}.proofing_entry_date_time`,
                                                        newValue
                                                      );
                                                    }}
                                                    readOnly={
                                                      editableRowProof !== index
                                                    }
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows3.${index}.proofing_exit_date_time`}
                                                    type="datetime-local"
                                                    className="input input-bordered"
                                                    value={
                                                      values.rows3[index]
                                                        .proofing_exit_date_time
                                                        ? values.rows3[
                                                            index
                                                          ].proofing_exit_date_time.slice(
                                                            0,
                                                            16
                                                          )
                                                        : ""
                                                    }
                                                    onChange={(e: any) => {
                                                      const newValue =
                                                        e.target.value;
                                                      setFieldValue(
                                                        `rows3.${index}.proofing_exit_date_time`,
                                                        newValue
                                                      );
                                                    }}
                                                    readOnly={
                                                      editableRowProof !== index
                                                    }
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows3.${index}.proofing_num_pallete`}
                                                    type="number"
                                                    className="input input-bordered"
                                                    readOnly={
                                                      editableRowProof !== index
                                                    }
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows3.${index}.proofing_program_name`}
                                                    type="text"
                                                    className="input input-bordered"
                                                    readOnly={
                                                      editableRowProof !== index
                                                    }
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <div className="flex gap-2">
                                                    {editableRowProof ===
                                                    index ? (
                                                      <>
                                                        <button
                                                          type="button"
                                                          className="btn btn-success"
                                                          onClick={async () => {
                                                            try {
                                                              await updateProofingMutation.mutateAsync(
                                                                {
                                                                  proofing_id:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_id,
                                                                  proofing_entry_date_time:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_entry_date_time,
                                                                  proofing_exit_date_time:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_exit_date_time,
                                                                  proofing_num_pallete:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_num_pallete,
                                                                  proofing_program_name:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_program_name,
                                                                }
                                                              );
                                                              setEditableRowProof(
                                                                null
                                                              ); // Reset editable row after saving
                                                              refetchProofingData(); // Refetch data after update
                                                            } catch (error) {
                                                              console.error(
                                                                "Error in mutation:",
                                                                error
                                                              );
                                                            }
                                                          }}
                                                        >
                                                          Save
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="btn btn-primary"
                                                          onClick={() => {
                                                            if (
                                                              window.confirm(
                                                                "Are you sure you want to cancel?"
                                                              )
                                                            ) {
                                                              setTractnumbercontrollenght(
                                                                0
                                                              );
                                                              setEditableRowProof(
                                                                null
                                                              ); // Reset the editable state
                                                              refetchProofingData(); // Refetch the proofing data
                                                              // location.reload();
                                                              setIsModalOpen(
                                                                false
                                                              );
                                                              setTimeout(() => {
                                                                setIsModalOpen(
                                                                  true
                                                                );
                                                                setSelectedTab(
                                                                  "tab2"
                                                                );
                                                              }, 100);
                                                            }
                                                          }}
                                                        >
                                                          Cancel
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <button
                                                          type="button"
                                                          className={`btn btn-primary ${
                                                            editableRowProof !==
                                                            null
                                                              ? "hidden"
                                                              : ""
                                                          }`}
                                                          onClick={() =>
                                                            setEditableRowProof(
                                                              index
                                                            )
                                                          }
                                                        >
                                                          Edit
                                                        </button>
                                                        {/* <button
                                                          type="button"
                                                          className={`btn btn-error ${
                                                            editableRowProof !==
                                                            null
                                                              ? "hidden"
                                                              : ""
                                                          } ${
                                                            removeProofingMutation.isPending
                                                              ? "loading"
                                                              : ""
                                                          }`}
                                                          onClick={() => {
                                                            const isConfirmed =
                                                              window.confirm(
                                                                "Are you sure you want to remove this proofing?"
                                                              );
                                                            if (isConfirmed) {
                                                              removeProofingMutation.mutate(
                                                                {
                                                                  proofing_id:
                                                                    values
                                                                      .rows3[
                                                                      index
                                                                    ]
                                                                      .proofing_id,
                                                                  is_exist:
                                                                    false,
                                                                }
                                                              );
                                                            }
                                                          }}
                                                        >
                                                          Remove
                                                        </button> */}
                                                      </>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        )}
                                      />
                                    )}
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

                <input
                  type="radio"
                  name="my_tabs_2"
                  role="tab"
                  className="tab"
                  aria-label="Measurement"
                  id="tab3"
                  checked={selectedTab === "tab3"}
                  onChange={() => setSelectedTab("tab3")}
                />
                <div
                  role="tabpanel"
                  className="tab-content bg-base-100 border-base-300 rounded-box p-6"
                >
                  <Formik
                    initialValues={initialValuesMeasurement}
                    enableReinitialize={true}
                    onSubmit={async (values) => {
                      // Check if all rows have 0 or empty values

                      // const isAllEmptyOrZero = values.rowsmeasurement.every(
                      //   (row) =>
                      //     row.pallete_count === 0 && row.number_of_control === 0
                      // );
                      // console.log(
                      //   "current row lenght",
                      //   tractnumbercontrollenght + 1
                      // );
                      // if (isAllEmptyOrZero) {
                      //   alert(
                      //     "Cannot submit: All fields are empty or have a value of 0."
                      //   );
                      //   return; // Prevent form submission
                      // } else {
                        // const pallete_number=values.rowsmeasurement[0].pallete_count;
                        // const control_number=values.rowsmeasurement[0].number_of_control;
                        // if(numberControl===tractnumbercontrollenght){
                        // const userConfirmed = window.confirm("The number of controls is not yet complete. Are you sure you want to submit it?");
                        // if (!userConfirmed) {
                        //   return;
                        // }
                        // }
                        if (isMaxRow=== false) {
                          alert(
                            "The number of controls is not yet complete. Please ensure that it is completed before submitting."
                          );
                          return;
                        }
                          // if (userConfirmed) {
                          //   (async () => {
                              for (const row of values.rowsmeasurement) {
                                const measurementData = {
                                  order_id: orderid,
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
                                };
                                // setLastpalleteCount(0);
                                // setNumberControl(0);
                                // Log for debugging
                                // alert("Inserting data: " + JSON.stringify(measurementData, null, 2));
                                console.log("Inserting data:", measurementData);

                                // Wait for mutation to complete before moving to the next
                                await AddMeasurementMutation.mutateAsync(
                                  measurementData
                                );
                              }
                          //   })();
                          // }
                        // } else {
                        //   (async () => {
                        //     for (const row of values.rowsmeasurement) {
                        //       const measurementData = {
                        //         order_id: orderid,
                        //         length: row.length,
                        //         inside_diameter: row.inside_diameter,
                        //         outside_diameter: row.outside_diameter,
                        //         flat_crush: row.flat_crush,
                        //         h20: row.h20,
                        //         radial: row.radial,
                        //         number_control: row.number_of_control,
                        //         remarks: row.remarks,
                        //         pallete_count: row.pallete_count,
                        //         user_id: userID,
                        //       };
                        //       setLastpalleteCount(0);
                        //       // setNumberControl(0);
                        //       // Log for debugging
                        //       // alert("Inserting data: " + JSON.stringify(measurementData, null, 2));
                        //       console.log("Inserting data:", measurementData);

                        //       // Wait for mutation to complete before moving to the next
                        //       await AddMeasurementMutation.mutateAsync(
                        //         measurementData
                        //       );
                        //     }
                        //   })();
                        // }
                      // }

                      // console.log("Values are: ",values.rowsmeasurement);
                    }}
                  >
                    {({ values, setFieldValue }) => (
                      <Form>
                        <div className="">
                          <FieldArray
                            name="rowsmeasurement"
                            render={(arrayHelpers) => (
                              <div>
                                <div className="flex place-content-end gap-3">
                                <button
  className="btn btn-info"
  type="button"
  onClick={() => {
    let currentMaxPallete = values.rowsmeasurement.reduce(
      (max, row) => Math.max(max, row.pallete_count || 0),
      0
    );

    if (currentMaxPallete === 0) {
      currentMaxPallete = lastpalleteCount;
    }

    // Remove any incomplete rows
    values.rowsmeasurement.forEach((row, index) => {
      if (row.pallete_count === 0 && row.number_of_control === 0) {
        arrayHelpers.remove(index);
      }
    });
    if(isMaxRow===false){
      alert("The number of controls is not yet complete. Please ensure that it is completed before adding a new pallete.");
      return;
    }
    // Add 3 new rows for the new pallete
    // for (let i = 0; i < numberControl; i++) {
      arrayHelpers.push({
        pallete_count: currentMaxPallete + 1,
        number_of_control: numberControl,
        length: "",
        inside_diameter: "",
        outside_diameter: "",
        flat_crush: "",
        h20: "",
        radial: "",
        remarks: "",
        isNew: true, // Indicating it's a new row
      });
    // }

    setEnablePallete(true);
  }}
>
  Add Pallete
</button>




                                  <button
                                    className="btn btn-primary"
                                    type="submit"
                                  >
                                    Save Measurement
                                  </button>

                                  <button
                                    className="btn btn-accent"
                                    onClick={() => {
                                      refetchOrdersData();
                                      setIsModalOpen(false);
                                      setOrderid(null);
                                      refetchMeasurentData();
                                      refetchProductionData();
                                      refetchProofingData();
                                      setTractnumbercontrollenght(0);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div className="text-black overflow-auto">
                                  <table className="table relative text-center overflow-auto">
                                    <thead className="text-black text-sm">
                                      <tr>
                                        <th>Pallete</th>
                                        {/* <th>Number Of Control</th> */}
                                        <th>Length</th>
                                        <th>Inside Diameter</th>
                                        <th>Outside Diameter</th>
                                        <th>Flat Crush</th>
                                        <th>H20</th>
                                        <th>Radial</th>
                                        <th>Remarks</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                    {values.rowsmeasurement.map((row, index) => {
    // Count how many rows exist for the same number_of_control
    const existingRows = values.rowsmeasurement.filter(
      (r) => r.number_of_control === row.number_of_control && r.pallete_count === row.pallete_count
    );

    const maxRowsReached = existingRows.length >= row.number_of_control;
    const isLastRow = existingRows.length === 1;
    
    console.log("maxRowsReached", maxRowsReached);
    setisMaxRow(maxRowsReached);
    return  (
                                          <React.Fragment key={index}>
                                            <tr>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.pallete_count`}
                                                  placeholder={` ${
                                                    row.number_of_control == 0
                                                      ? ""
                                                      : ""
                                                  }`}
                                                  type="number"
                                                  readOnly
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.isnew ||
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "text-white hidden"
                                                      : "bg-white"
                                                  }`}
                                                  onChange={(e: any) => {
                                                    const newPalleteCount =
                                                      parseInt(
                                                        e.target.value,
                                                        10
                                                      );
                                                    setFieldValue(
                                                      `rowsmeasurement.${index}.pallete_count`,
                                                      newPalleteCount
                                                    );
                                                  }}
                                                />
                                              </td>

                                              <td className="hidden">
                                                <Field
                                                  name={`rowsmeasurement.${index}.number_of_control`}
                                                  type="number"
                                                  placeholder={
                                                    row.number_of_control === 0
                                                      ? ""
                                                      : row.number_of_control.toString()
                                                  } // Fixes the placeholder issue
                                                  readOnly
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.isnew ||
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "text-white hidden"
                                                      : "bg-white"
                                                  }`}
                                                  onChange={(e: any) => {
                                                    const newControlNumber =
                                                      parseInt(
                                                        e.target.value,
                                                        10
                                                      );
                                                    setFieldValue(
                                                      `rowsmeasurement.${index}.number_of_control`,
                                                      newControlNumber
                                                    );
                                                  }}
                                                />
                                              </td>

                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.length`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "text-white hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.inside_diameter`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "text-white hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.outside_diameter`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.flat_crush`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.h20`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.radial`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="number"
                                                  className={`input input-bordered w-20 max-w-md ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
                                                <Field
                                                  name={`rowsmeasurement.${index}.remarks`}
                                                  placeholder={
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? ""
                                                      : "0"
                                                  }
                                                  type="text"
                                                  className={`input input-bordered ${
                                                    values.rowsmeasurement[
                                                      index
                                                    ]?.iswhiteAll
                                                      ? "hidden"
                                                      : "bg-white"
                                                  }`}
                                                />
                                              </td>
                                              <td>
            {/* Add Row Button (Hidden if max rows reached) */}
            {!maxRowsReached && (
              <><button
                className="btn btn-success mt-2"
                type="button"
                onClick={() => {
                  arrayHelpers.push({
                    pallete_count: row.pallete_count,
                    number_of_control: row.number_of_control,
                    length: "",
                    inside_diameter: "",
                    outside_diameter: "",
                    flat_crush: "",
                    h20: "",
                    radial: "",
                    remarks: "",
                    isnew: true,
                  });

                  setEnablePallete(true);
                } }
              >
                +
              </button>
            
                <button
                className="btn btn-error mt-2"
                type="button"
                onClick={() => {
                  arrayHelpers.remove(index);
                }}
              >
                Remove
              </button>
       
              
            </>
            )}
            
            
            {/* Remove Button (Hidden if it's the last row for this control) */}
            {/* {isLastRow && (
              <button
                type="button"
                className="btn btn-error"
                onClick={() => {
                  arrayHelpers.remove(index);
                }}
              >
                Remove
              </button>
            )} */}
          </td>

                                            </tr>
                                          </React.Fragment>
                                        );
                                      }
                                      )}
                                    </tbody>
                                    {isLoading || isFetching ? (
              <tr>
                <td colSpan={7}>
                  <span className="loading loading-dots loading-md"></span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="text-error font-bold" colSpan={7}>
                  Something went wrong while fetching orders list.
                </td>
              </tr>
            ) : fetchedMeasurementData?.length === 0 ? (
                            <p className="text-center text-sm text-slate-600">
                              No Measurement Data Found
                            </p>
                          ) : (
                            <FieldArray
                              name="rows4"
                              render={(arrayHelpers) => (
                                
                                <tbody className="border-y border-slate-500">
                                  {values.rows4.map((row, index) => (
                                    <tr key={index} className="border-y border-slate-500">
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.pallete_count`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.pallete_count}
                                          readOnly
                                        />
                                      </td>
                                      {/* <td className="">
                                        
                                        <Field
                                          name={`rows4.${index}.number_of_control`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md hidden"
                                          value={row.number_of_control}
                                        />
                                      </td> */}
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.length`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.length}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.inside_diameter`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.inside_diameter}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.outside_diameter`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.outside_diameter}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.flat_crush`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.flat_crush}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.h20`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.h20}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.radial`}
                                          type="number"
                                          className="input input-bordered w-20 max-w-md"
                                          value={row.radial}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <Field
                                          name={`rows4.${index}.remarks`}
                                          type="text"
                                          className="input input-bordered"
                                          value={row.remarks}
                                          readOnly={editableRowMes !== index}
                                        />
                                      </td>
                                      <td className="border-y border-slate-500">
                                        <div className="flex gap-2">
                                          {editableRowMes === index ? (
                                            <>
                                              <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={async () => {
                                                  try {
                                                    await updateMeasurementMutation.mutateAsync(
                                                      {
                                                        ...row,
                                                      }
                                                    );
                                                    setEditableRowMes(null); // Reset editable row after saving
                                                    refetchMeasurentData(); // Refetch data after update
                                                  } catch (error) {
                                                    console.error(
                                                      "Error in mutation:",
                                                      error
                                                    );
                                                  }
                                                  setIsModalOpen(false);
                                                  setTimeout(() => {
                                                    setIsModalOpen(true);
                                                    setSelectedTab("tab3");
                                                  }, 100);
                                                }}
                                              >
                                                Save
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => {
                                                  if (
                                                    window.confirm(
                                                      "Are you sure you want to cancel?"
                                                    )
                                                  ) {
                                                    setTractnumbercontrollenght(0);
                                                    setEditableRowMes(null); // Reset the editable state
                                                    refetchMeasurentData(); // Refetch measurement data
                                                    setIsModalOpen(false);
                                                    setTimeout(() => {
                                                      setIsModalOpen(true);
                                                      setSelectedTab("tab3");
                                                    }, 100);
                                                  }
                                                }}
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              {!editableRowMes && (
                                                <>
                                                  <button
                                                    type="button"
                                                    className={`btn btn-primary ${
                                                      editableRowMes !== null
                                                        ? "hidden"
                                                        : ""
                                                    }`}
                                                    onClick={() => {
                                                      setEditableRowMes(index);
                                                      console.log(
                                                        "the id is:",
                                                        row.measurement_id
                                                      );
                                                    }}
                                                  >
                                                    Edit
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className={`btn btn-error ${
                                                      editableRowMes !== null
                                                        ? "hidden"
                                                        : ""
                                                    } ${
                                                      removeMeasurementMutation.isPending
                                                        ? "loading"
                                                        : ""
                                                    }`}
                                                    onClick={() => {
                                                      const isConfirmed =
                                                        window.confirm(
                                                          "Are you sure you want to remove this measurement?"
                                                        );
                                                      if (isConfirmed) {
                                                        removeMeasurementMutation.mutate(
                                                          {
                                                            measurement_id:
                                                              row.measurement_id,
                                                            is_exist: false,
                                                          }
                                                        );
                                                      }
                                                    }}
                                                  >
                                                    Remove
                                                  </button>
                                                </>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              )}
                            />
                          )}
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
              </div>
            </div>
          </div>
        )}
        {isAssignModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-1xl">
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-4">
                  <label className="label">Assign Order</label>
                  <select
                    className="select select-bordered"
                    onChange={(e) => {
                      setAssign_id(e.target.value);
                    }}
                  >
                    <option value="" disabled selected>
                      Select Customer
                    </option>
                    {customerOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 place-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      AssignOrderMutation.mutate({
                        order_form_id: orderid,
                        user_id: asssing_id,
                      });
                    }}
                  >
                    Assign
                  </button>
                  <button
                    className="btn btn-accent"
                    onClick={() => {
                      setAssignModal(false);
                      setOrderid(null);
                      window.location.reload();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

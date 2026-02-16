"use client";
import { createClient } from "@/utils/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, FieldArray, Field, ErrorMessage } from "formik";
import { Calendar, Eye, Pencil, Slice, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState, use } from "react";
import toast from "react-hot-toast";
import * as Yup from "yup";
import { FormSelect } from "../UI/FormInput";
import SuggestiveSearchInput from "../UI/SuggestiveSearchInput";
import { DateTime } from "luxon";
import { start } from "repl";
import DownloadOrderListView from "./DownloadOrderListView";
import { read } from "fs";
import ImprovedPagination from "../UI/ImprovedPagination";
import { normalizeDecimalInput } from "@/utils/parseDecimal";

export default function OrderListView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [ofidOrClientInput, setOfidOrClientInput] = useState("");
  const [designationInputValue, setDesignationInputValue] = useState("");
  const [ofidSearch, setOfidSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const startDatePickerRef = useRef<HTMLInputElement>(null);
  const endDatePickerRef = useRef<HTMLInputElement>(null);
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
      ofidSearch,
      clientSearch,
      designationSearch,
      limit,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const hasStructuredSearch =
        ofidSearch.trim() !== "" ||
        clientSearch.trim() !== "" ||
        designationSearch.trim() !== "";
      if (hasStructuredSearch) {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("ofid", ofidSearch.trim());
        params.set("client", clientSearch.trim());
        if (designationSearch.trim()) {
          params.set("designation", designationSearch.trim());
        }
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const response = await fetch(`/api/v1/get_order?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
          },
        });
        const result = await response.json();
        if (response.ok) {
          return result;
        }
        throw new Error(result?.error || "Something went wrong while fetching site list.");
      }

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

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `/api/v1/remove_order?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete order.");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Order deleted successfully.");
      refetchOrdersData();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete order.";
      toast.error(message);
    },
    onSettled: () => {
      setDeletingId(null);
    },
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
  const [tractnumbercontrollenght, setTractnumbercontrollenght] = useState<
    number | null
  >(null);
  const [isbuttonhide, setisbuttonhide] = useState<boolean>(false);
  const [isfieldhide, setisfieldhide] = useState<boolean>(false);
  const [isfieldhideproof, setisfieldhideproof] = useState<boolean>(false);
  const [isContinueAdd, setisContinueAdd] = useState<boolean>(false);
  const [editableGroupKey, setEditableGroupKey] = useState<string | null>(null);
  const [updatedGroupData, setUpdatedGroupData] = useState<{
    [key: string]: any;
  }>({});
  const [retrievedentryDateTime, setRetrievedentryDateTime] = useState<
    string | null
  >(null);
  const [retrievedexitDateTime, setRetrievedexitDateTime] = useState<
    string | null
  >(null);
  const [isMaxRow, setisMaxRow] = useState<boolean>(false);
  const [currentpalleteCount, setcurrentpalleteCount] = useState<number>(0);
  const [isflatcount, setisflatcount] = useState<number>(0);
  const [ish20count, setish20count] = useState<number>(0);
  const [isReadonly, setIsReadonly] = useState<boolean>(true);
  const [flatitem, setFlatitem] = useState([]);
  const [h20item, setH20item] = useState([]);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const formatToTwoDecimals = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "";
    const numericValue = normalizeDecimalInput(value as string | number | null | undefined);
    if (numericValue === null) return String(value);
    return numericValue.toFixed(2);
  };
  

  console.log("orderformid: ", orderid);

  console.log("current enablepallete: ", enablepallete);
  console.log("rows lenght", tractnumbercontrollenght);
  
  // Selection state for table rows
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Persist full order objects by id to allow cross-page download
  const [selectedById, setSelectedById] = useState<Record<string, any>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);

  // State to store designations by OFID (same logic as modal)
  const [designationsByOfid, setDesignationsByOfid] = useState<Record<string, string>>({});
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);

  // Current page rows: numeric-leading OFIDs first, then by OFID descending
  const sortedOrders = useMemo(() => {
    const rows = Array.isArray(ordersData?.data) ? ordersData.data : [];
    return [...rows].sort((a: any, b: any) => {
      const aVal = String(a.order_fabrication_control ?? "");
      const bVal = String(b.order_fabrication_control ?? "");
      const aNum = /^[0-9]/.test(aVal);
      const bNum = /^[0-9]/.test(bVal);
      if (aNum !== bNum) return aNum ? -1 : 1;
      return bVal.localeCompare(aVal, undefined, { numeric: true });
    });
  }, [ordersData?.data]);

  // Function to toggle "select all" rows
  const toggleSelectAll = () => {
    // Get rows safely (current page only, sorted)
    const rows: any[] = sortedOrders;
    if (!rows.length) return;

    const pageIds = rows.map((row: any) => String(row.id));
    const allPageSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allPageSelected) {
      // Unselect only current page rows
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      setSelectedById((prev) => {
        const next = { ...prev };
        for (const id of pageIds) delete next[id];
        return next;
      });
    } else {
      // Select all current page rows, preserving previous selections
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
      setSelectedById((prev) => {
        const next = { ...prev };
        for (const row of rows) next[String(row.id)] = row;
        return next;
      });
    }
  };

  // Function to toggle a single row by ID
  const toggleSelectOne = (id: string) => {
    const rows: any[] = sortedOrders;
    const found = rows.find((r) => String(r.id) === id);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedById((prev) => {
      const next = { ...prev };
      if (prev[id]) {
        delete next[id];
      } else if (found) {
        next[id] = found;
      }
      return next;
    });
  };

  // Effect to update "Select All" checkbox state
  useEffect(() => {
    // Determine selection state for current page only
    const rows: any[] = sortedOrders;
    const pageIds = rows.map((row: any) => String(row.id));
    const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));

    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedOnPage.length > 0 && selectedOnPage.length < pageIds.length;
    }
  }, [selectedIds, sortedOrders]); // run whenever selection or rows change

  const selectedOrders = React.useMemo(() => {
    // Provide all selected orders across all pages
    if (selectedIds.length === 0) return [];
    return selectedIds.map((id) => selectedById[id]).filter(Boolean);
  }, [selectedIds, selectedById]);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setUseremail(data.user?.user_metadata.email || null);
      setUserRole(data.user?.user_metadata.role || null);
      setUserID(data.user?.id || null);
    };

    fetchUserEmail();
  }, [supabase.auth]);

  // Function to fetch designation for a single OFID (same logic as modal)
  const fetchDesignationForOfid = async (ofid: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/v1/test_resolve_by_ofid?ofid=${encodeURIComponent(ofid)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const matchingArticles = data.matching_articles || [];
      const productionRecord = data.production_record;
      
      if (matchingArticles.length === 0) {
        return null;
      }
      
      // If only one match, use it
      if (matchingArticles.length === 1) {
        return matchingArticles[0].designated_article || null;
      }
      
      // If multiple matches, prioritize the one that best matches production record length
      if (productionRecord?.length && matchingArticles.length > 1) {
        // Find the match with the closest length to production record
        const prodLength = parseFloat(productionRecord.length);
        if (!isNaN(prodLength)) {
          let bestMatch = matchingArticles[0];
          let smallestDiff = Infinity;
          
          for (const article of matchingArticles) {
            if (article.parsed_dimensions?.length) {
              const articleLength = article.parsed_dimensions.length;
              const diff = Math.abs(prodLength - articleLength);
              
              // If exact match, use it immediately
              if (diff < 0.01) {
                return article.designated_article || null;
              }
              
              // Track the closest match
              if (diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = article;
              }
            }
          }
          
          // Return the best match (closest length)
          return bestMatch.designated_article || null;
        }
      }
      
      // Fallback: return first match
      return matchingArticles[0].designated_article || null;
    } catch (error) {
      console.error(`Error fetching designation for OFID ${ofid}:`, error);
      return null;
    }
  };

  // Fetch designations for all orders on current page (same logic as modal)
  useEffect(() => {
    const fetchDesignations = async () => {
      if (!ordersData?.data || ordersData.data.length === 0) {
        setDesignationsByOfid({});
        return;
      }

      setIsLoadingDesignations(true);
      const designations: Record<string, string> = {};

      // Fetch designations for all orders in parallel
      await Promise.all(
        ordersData.data.map(async (order: any) => {
          const ofid = order.order_fabrication_control;
          if (ofid) {
            const designation = await fetchDesignationForOfid(String(ofid));
            if (designation) {
              designations[ofid] = designation;
            }
          }
        })
      );

      setDesignationsByOfid(designations);
      setIsLoadingDesignations(false);
    };

    fetchDesignations();
  }, [ordersData?.data]);

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

  const [initialValuesDrying, setInitialValuesDrying] = useState({
    drying_entry_datetime: "",
    drying_exit_datetime: "",
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
        remarks: "",
        isnew: false, // Added isnew property
        iswhiteAll: false,
        isReadonly: false, // Allow editing ID/OD on initial row
        isReadOnlyFlat: false, // Allow editing Flat Crush and H2O on initial row
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
        remarks: "",
        isControlRow: false,
      },
    ],
  });

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
  const validationSchemaDrying = Yup.object({
    drying_entry_datetime: Yup.string(),
    drying_exit_datetime: Yup.string(),
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

  // Handle PDF download (calls shared PDF utility)
  // PDF download now handled by DownloadOrderListView component

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
      if (
        productionData.entry_date_time === null &&
        productionData.exit_date_time === null
      ) {
        setisfieldhide(false);
      } else {
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

  console.log("updated entry", retrievedentryDateTime);

  const updateProductionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(`/api/v1/edit_production?id=${orderid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entry_date_time: updatedData.production_entry_date_time,
          exit_date_time: updatedData.production_exit_date_time,
        }),
      });

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

  // Build datetime string for datetime-local from tbl_prod drying_* fields
  const buildDryingDatetime = (dateVal: any, timeVal: any): string => {
    if (!dateVal) return "";
    const d = typeof dateVal === "string" ? dateVal.split("T")[0].split(" ")[0].trim() : "";
    if (!d) return "";
    const t = timeVal && typeof timeVal === "string" ? timeVal.trim().slice(0, 5) : "00:00";
    if (t.length === 4) return `${d}T0${t}`;
    return `${d}T${t}`;
  };

  useEffect(() => {
    if (!currentOrder || !orderid) return;
    setInitialValuesDrying({
      drying_entry_datetime: buildDryingDatetime(currentOrder.drying_start_date, currentOrder.drying_start_time),
      drying_exit_datetime: buildDryingDatetime(currentOrder.drying_end_date, currentOrder.drying_end_time),
    });
  }, [currentOrder, orderid]);

  const updateDryingMutation = useMutation({
    mutationFn: async (payload: {
      order_id: string;
      drying_start_date: string;
      drying_start_time: string;
      drying_end_date: string;
      drying_end_time: string;
    }) => {
      const response = await fetch("/api/v1/update_drying", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update drying");
      }
      return response.json();
    },
    onError: (error) => {
      toast.error("Failed to update drying");
      console.error(error);
    },
    onSuccess: () => {
      toast.success("Drying updated successfully");
      refetchOrdersData();
    },
  });

  //measurement
  const AddMeasurementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/v1/create_measurement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) {
        const msg = body?.error ?? `Request failed (${response.status})`;
        console.error("create_measurement failed:", response.status, msg);
        throw new Error(msg);
      }
      return body;
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "Failed to add Measurement");
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

  const { 
    data: fetchedMeasurementData, 
    refetch: refetchMeasurentData, 
    isError: isMeasurementError, 
    error: measurementError,
    isLoading: isMeasurementLoading,
    isFetching: isMeasurementFetching
  } = useQuery({
      queryKey: ["measurement", orderformdisplay],
      queryFn: async () => {
        if (!orderformdisplay) {
          console.log("No orderformdisplay, returning empty array");
          return [];
        }
        console.log("Fetching measurement data for ofid:", orderformdisplay);
        const response = await fetch(
          `/api/v1/getonemeasurementprod?ofid=${encodeURIComponent(orderformdisplay)}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch measurement data:", response.status, errorData);
          throw new Error(`Failed to fetch measurement data: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched measurement data:", data);
        return data;
      },
      enabled: !!orderformdisplay,
    });

  useEffect(() => {
    console.log("fetchedMeasurementData changed:", fetchedMeasurementData);
    if (fetchedMeasurementData && fetchedMeasurementData.length > 0) {
      console.log("Mapping measurement data to rows4");
      const mappedRows = fetchedMeasurementData.map((data: any) => {
        const mappedRow = {
          measurement_id: data.id,
          pallete_count: data.palette_num || 0, // Map palette_num to pallete_count
          number_of_control: 0, // Not in tbl_measurement_prod, set to 0
          length: data.length || 0,
          inside_diameter: data.inside_diameter || 0,
          outside_diameter: data.outside_diameter || 0,
          flat_crush: data.flat_crush || 0,
          h20: data.h2o || data.humidity || 0, // Map h2o (from humidity) to h20
          remarks: data.remarks || "", // Retrieve remarks value, default to empty string
        };
        console.log("Mapped row remarks:", mappedRow.remarks, "from data.remarks:", data.remarks, "Full row:", mappedRow);
        return mappedRow;
      });
      console.log("All mapped rows with remarks:", mappedRows.map((r: any) => ({ id: r.measurement_id, remarks: r.remarks })));
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rows4: mappedRows,
      }));
    } else if (fetchedMeasurementData && fetchedMeasurementData.length === 0) {
      console.log("No measurement data found, clearing rows4");
      setInitialValuesMeasurement((prev) => ({
        ...prev,
        rows4: [],
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
      // Pallete count
      const palleteCounts = fetchedMeasurementData.map((item: any) =>
        parseInt(item.pallete_count || "0", 10)
      );
      const maxPalleteCount = Math.max(...palleteCounts);
      // setcurrentpalleteCount(maxPalleteCount);
      const nextPalleteCount = maxPalleteCount + 1;
      setcurrentpalleteCount(nextPalleteCount);
      console.log("Next Pallete Count:", nextPalleteCount);

      // Flat Crush count (not 0 or null)
      const flatcrushValidCount = fetchedMeasurementData.filter(
        (item: any) =>
          item.flat_crush !== 0 &&
          item.flat_crush !== null &&
          item.flat_crush !== undefined
      ).length;

      console.log("Flat Crush Count (not 0 or null):", flatcrushValidCount);
      setisflatcount(flatcrushValidCount);
      // ✅ Extract valid flat_crush values (not 0, null, undefined)
      const validFlatCrushValues = fetchedMeasurementData
        .map((item: any) => parseFloat(item.flat_crush))
        .filter((v: number) => !isNaN(v) && v !== 0);

      // Log valid values
      console.log("Flat Crush Values != 0:", validFlatCrushValues);
      setFlatitem(validFlatCrushValues);
      // H20 count (not 0 or null)
     const validH20Values = fetchedMeasurementData
        .map((item: any) => parseFloat(item.h20))
        .filter((v: number) => !isNaN(v) && v !== 0);
      console.log("H₂O count (not 0 or null):", validH20Values);
      setH20item(validH20Values);
      setLastpalleteCount(maxPalleteCount);
      setEnablePallete(true);
    } else {
      setLastpalleteCount(1);
      setTractnumbercontrollenght(1);
      setEnablePallete(false);
    }
  }, [fetchedMeasurementData]);

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

  const formatIsoToDisplay = (iso?: string) => {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  };

  const parseDisplayToIso = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (!match) return "";
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "";
    if (
      parsed.getUTCFullYear() !== Number(year) ||
      parsed.getUTCMonth() + 1 !== Number(month) ||
      parsed.getUTCDate() !== Number(day)
    ) {
      return "";
    }
    return iso;
  };

  const handleDatePickerChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setIso: (value: string) => void,
    setDisplay: (value: string) => void
  ) => {
    const iso = event.target.value;
    setIso(iso);
    setDisplay(formatIsoToDisplay(iso));
  };

  const handleSearch = () => {
    const raw = ofidOrClientInput.trim();
    const nextDesignation = designationInputValue.trim();

    // Refresh: both OFID/Client and designation empty → clear filters and refetch
    if (!raw && !nextDesignation) {
      setOfidSearch("");
      setClientSearch("");
      setDesignationSearch("");
      setSearch("");
      setPage(1);
      refetchOrdersData();
      return;
    }

    // Designation only (no OFID/Client) → require OFID/Client
    if (!raw && nextDesignation) {
      toast.error("Please fill out the OFID/Client field.");
      return;
    }

    // Normal search: OFID/Client provided
    const looksLikeOfid = /^\d+$/.test(raw);
    setOfidSearch(looksLikeOfid ? raw : "");
    setClientSearch(looksLikeOfid ? "" : raw);
    setDesignationSearch(nextDesignation);
    setSearch("");
    setPage(1);
  };

  return (
    <div className="overflow-x-auto w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        <div className="w-full flex flex-nowrap gap-3 items-end bg-gradient-to-br from-blue-50/30 to-blue-100/20 p-4 rounded-xl shadow-lg border border-blue-200/30 overflow-x-auto overflow-y-visible backdrop-blur-sm">
          {/* Search Bar - Pill Shape Design */}
          <div className="flex flex-1 min-w-[240px] gap-2">
            <div className="w-full min-w-0">
              <SuggestiveSearchInput
                value={ofidOrClientInput}
                onChange={setOfidOrClientInput}
                onSearch={handleSearch}
                placeholder="OFID or Client (at least one required)"
                suggestionScope="clients"
                inputClassName="w-full px-3 py-2.5 rounded-full bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-md hover:shadow-lg"
                buttonClassName="hidden"
              />
            </div>
            <input
              type="text"
              value={designationInputValue}
              onChange={(event) => setDesignationInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Designation (optional)"
              className="w-full px-3 py-2.5 rounded-full bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-md hover:shadow-lg"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 rounded-full bg-blue-700 text-white text-xs font-semibold shadow-md hover:bg-blue-800 transition-all duration-300"
            >
              Search
            </button>
          </div>

          {/* Start Date */}
          <div className="flex flex-col min-w-[120px] shrink-0">
            <label className="text-[10px] font-semibold text-blue-700 mb-1 uppercase tracking-wide">Start Date:</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={startDateInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setStartDateInput(nextValue);
                  setStartDate(parseDisplayToIso(nextValue));
                }}
                className="w-full px-2.5 py-2 pr-9 rounded-lg border border-blue-200/60 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              />
              <input
                ref={startDatePickerRef}
                type="date"
                value={startDate}
                onChange={(event) =>
                  handleDatePickerChange(event, setStartDate, setStartDateInput)
                }
                className="absolute inset-0 opacity-0"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => {
                  const picker = startDatePickerRef.current;
                  if (!picker) return;
                  if (picker.showPicker) {
                    picker.showPicker();
                  } else {
                    picker.focus();
                    picker.click();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition"
                aria-label="Open start date picker"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col min-w-[120px] shrink-0">
            <label className="text-[10px] font-semibold text-blue-700 mb-1 uppercase tracking-wide">End Date:</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={endDateInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setEndDateInput(nextValue);
                  setEndDate(parseDisplayToIso(nextValue));
                }}
                className="w-full px-2.5 py-2 pr-9 rounded-lg border border-blue-200/60 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              />
              <input
                ref={endDatePickerRef}
                type="date"
                value={endDate}
                onChange={(event) =>
                  handleDatePickerChange(event, setEndDate, setEndDateInput)
                }
                className="absolute inset-0 opacity-0"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => {
                  const picker = endDatePickerRef.current;
                  if (!picker) return;
                  if (picker.showPicker) {
                    picker.showPicker();
                  } else {
                    picker.focus();
                    picker.click();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition"
                aria-label="Open end date picker"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add Order Button */}
          <Link
            href="/dashboard/addorder"
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-500/20"
          >
            Add Order
          </Link>

          {/* Refresh Button */}
          {/* <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSearch("");
              setPage(1);
              if (searchInput.current) {
                searchInput.current.value = "";
              }
            }}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border border-blue-400/20"
          >
            Refresh
          </button> */}

          {/* Download Button */}
          <div className="min-w-[90px] shrink-0">
            <DownloadOrderListView
              className="w-full"
              selectedOrders={selectedOrders}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-12">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="checkbox border-white/50 bg-white/10 checked:bg-blue-900 checked:border-blue-900 checkbox-sm"
                      checked={(() => {
                        const rows: any[] = sortedOrders;
                        if (!rows.length) return false;
                        const pageIds = rows.map((r: any) => String(r.id));
                        return pageIds.every((id) => selectedIds.includes(id));
                      })()}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">OF ID</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap">Company</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide">Designation</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-16">Pallete</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap" title="From production start (prod_start_date + prod_start_time)">Entry Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap" title="From production end (prod_end_date + prod_end_time)">Exit Date</th>
                  <th className="px-2 py-2.5 font-bold text-xs uppercase tracking-wide whitespace-nowrap w-24">OPTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <div className="flex justify-center items-center">
                        <span className="loading loading-dots loading-md text-blue-900"></span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td className="px-4 py-8 text-red-600 font-bold" colSpan={8}>
                      Something went wrong while fetching orders list.
                    </td>
                  </tr>
                ) : sortedOrders.length > 0 ? (
                  sortedOrders.map((order: any, index: number) => (
                    <tr 
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="px-2 py-2.5">
                        <input
                          type="checkbox"
                          className="checkbox border-blue-300 checked:bg-blue-900 checked:border-blue-900 checkbox-sm"
                          checked={selectedIds.includes(String(order.id))}
                          onChange={() => toggleSelectOne(String(order.id))}
                        />
                      </td>
                      <td
                        className="px-2 py-2.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:cursor-pointer transition-colors duration-200 whitespace-nowrap"
                        onClick={() => {
                          setIsModalOpen(true);
                          setOrderid(order.id);
                          setCurrentOrder(order);
                          setOrderformdisplay(order.order_fabrication_control);
                          setNumberControl(3);
                          setFilterPalleteCount(order.pallete_count);
                          // Prefill Production tab from tbl_prod (entry/exit from list row)
                          setInitialValues((prev) => ({
                            ...prev,
                            rows: [
                              {
                                production_order_form_id: String(order.id ?? ""),
                                production_entry_date_time: order.entry_date_time ?? "",
                                production_exit_date_time: order.exit_date_time ?? "",
                              },
                            ],
                          }));
                        }}
                      >
                        {order.order_fabrication_control}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        {order.tbl_customer?.company_name
                          ? order.tbl_customer?.company_name
                          : " "}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        {(() => {
                          const ofid = order.order_fabrication_control;
                          // When row has article_ref, API may return designation from tbl_article_prod link — use it first
                          if (order.article_ref != null && order.article_ref !== "" && order.tbl_article?.designation_article) {
                            return order.tbl_article.designation_article;
                          }
                          // Otherwise as-is: fetched designations (same logic as modal)
                          if (ofid && designationsByOfid[ofid]) {
                            return designationsByOfid[ofid];
                          }
                          // Show loading indicator if still fetching
                          if (isLoadingDesignations) {
                            return <span className="text-gray-400">Loading...</span>;
                          }
                          // Fallback to tbl_article if available
                          if (order.tbl_article?.designation_article) {
                            return order.tbl_article.designation_article;
                          }
                          // Try alternative property names
                          if (order.tbl_article?.designated_article) {
                            return order.tbl_article.designated_article;
                          }
                          return " ";
                        })()}
                      </td>
                      <td className="px-2 py-2.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {order.pallete_count ? order.pallete_count : " "}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {order.entry_date_time
                          ? DateTime.fromISO(order.entry_date_time, {
                              zone: "utc",
                            }).toFormat("dd/MM/yy hh:mm a")
                          : " "}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        {order.exit_date_time
                          ? DateTime.fromISO(order.exit_date_time, {
                              zone: "utc",
                            }).toFormat("dd/MM/yy hh:mm a")
                          : " "}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-center items-center gap-2">
                          {userRole === "Super Admin" && (
                            <button
                              className="px-2 py-1 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
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
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                          <button
                            type="button"
                            className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[10px] transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 ${
                              deleteOrderMutation.isPending &&
                              deletingId === String(order.id)
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                            }`}
                            disabled={
                              deleteOrderMutation.isPending &&
                              deletingId === String(order.id)
                            }
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Delete this order? This action cannot be undone."
                              );
                              if (!confirmed) return;
                              const id = String(order.id);
                              setDeletingId(id);
                              deleteOrderMutation.mutate(id);
                            }}
                          >
                            <Trash className="h-3 w-3" />
                            {deleteOrderMutation.isPending &&
                            deletingId === String(order.id)
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 font-bold text-gray-500" colSpan={8}>
                      NO DATA FOUND.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-t-2 border-blue-200/50">
                  <td colSpan={8} className="px-4 py-2.5">
                    <span className="text-xs font-medium text-blue-900">
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
          </div>
        </div>
        {/* Improved Pagination */}
        <div className="mt-2 pb-2 overflow-x-auto">
          <ImprovedPagination
            currentPage={page}
            totalCount={ordersData?.total_count || 0}
            limit={limit}
            onPageChange={setPage}
            className=""
          />
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
                              production_entry_date_time:
                                row.production_entry_date_time,
                              production_exit_date_time:
                                row.production_exit_date_time,
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
                                  <div className="flex justify-end gap-3 mb-4">
                                    {retrievedentryDateTime === null &&
                                    retrievedexitDateTime === null ? (
                                      <button
                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                        type="submit"
                                      >
                                        Save Production
                                      </button>
                                    ) : null}
                                    <button
                                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                                      onClick={() => {
                                        refetchOrdersData();
                                        setEditableRowProd(null);
                                        setIsModalOpen(false);
                                        setOrderid(null);
                                        setCurrentOrder(null);
                                        refetchMeasurentData();
                                        refetchProductionData();
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>

                                  <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
                                    <table className="table w-full text-center">
                                      <thead>
                                        <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                                          {/* <th>Article Name</th> */}
                                          {/* <td></td> */}
                                          <th className="text-xs font-bold py-3">OF_ID</th>
                                          <th className="text-xs font-bold py-3">Entry Date & Time</th>
                                          <th className="text-xs font-bold py-3">Exit Date & Time</th>
                                          <th className="text-xs font-bold py-3">Action</th>
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
                                      ) : retrievedentryDateTime === null &&
                                        retrievedexitDateTime === null ? (
                                        <tbody>
                                          <tr>
                                            <td colSpan={7} className="text-center text-sm text-slate-600">
                                              No Production Data Found
                                            </td>
                                          </tr>
                                        </tbody>
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
                                                      <div className="flex gap-2 justify-end">
                                                        {editableRowProd ===
                                                        index ? (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
                                                              className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs transition-all duration-300 shadow-sm hover:shadow-md"
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
                                                              className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
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
                  aria-label="Drying"
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
                    initialValues={initialValuesDrying}
                    enableReinitialize={true}
                    validationSchema={validationSchemaDrying}
                    onSubmit={async (values) => {
                      if (!orderid) return;
                      const parseDt = (dt: string) => {
                        if (!dt || !dt.includes("T")) return { date: "", time: "00:00:00" };
                        const [datePart, timePart] = dt.split("T");
                        const date = (datePart || "").trim();
                        const time = (timePart || "00:00").trim().slice(0, 8);
                        const timeStr = time.length <= 5 ? `${time}:00`.slice(0, 8) : time;
                        return { date, time: timeStr };
                      };
                      const start = parseDt(values.drying_entry_datetime);
                      const end = parseDt(values.drying_exit_datetime);
                      try {
                        await updateDryingMutation.mutateAsync({
                          order_id: orderid,
                          drying_start_date: start.date,
                          drying_start_time: start.time,
                          drying_end_date: end.date,
                          drying_end_time: end.time,
                        });
                      } catch (error) {
                        toast.error("Failed to update drying");
                        console.error(error);
                      }
                    }}
                  >
                    {({ values }) => (
                      <Form>
                        <div className="">
                          <div className="flex justify-end gap-3 mb-4">
                            <button
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                              type="submit"
                              disabled={updateDryingMutation.isPending}
                            >
                              {updateDryingMutation.isPending ? "Saving..." : "Save Drying"}
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                              onClick={() => {
                                refetchOrdersData();
                                setTractnumbercontrollenght(0);
                                setEditableRowProof(null);
                                setIsModalOpen(false);
                                setOrderid(null);
                                setCurrentOrder(null);
                                refetchMeasurentData();
                                refetchProductionData();
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
                            <table className="table w-full text-center">
                              <thead>
                                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                                  <th className="text-xs font-bold py-3">OF_ID</th>
                                  <th className="text-xs font-bold py-3">Entry Date & Time</th>
                                  <th className="text-xs font-bold py-3">Exit Date & Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    <input
                                      readOnly
                                      value={orderformdisplay ?? ""}
                                      className="input input-bordered w-20 max-w-md"
                                    />
                                  </td>
                                  <td>
                                    <Field
                                      name="drying_entry_datetime"
                                      type="datetime-local"
                                      className="input input-bordered w-full max-w-md"
                                    />
                                  </td>
                                  <td>
                                    <Field
                                      name="drying_exit_datetime"
                                      type="datetime-local"
                                      className="input input-bordered w-full max-w-md"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
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
                    key={JSON.stringify(initialValuesMeasurement.rows4)} // Force re-render when rows4 changes
                    initialValues={initialValuesMeasurement}
                    enableReinitialize={false}
                    onSubmit={async (values) => {
                      if (isMaxRow === false) {
                        alert(
                          "The number of controls is not yet complete. Please ensure that it is completed before submitting."
                        );
                        return;
                      }
                      // if (userConfirmed) {
                      //   (async () => {
                      for (const row of values.rowsmeasurement) {
                        if (row.iswhiteAll) continue; // Skip placeholder rows
                        const measurementData = {
                          order_id: orderid,
                          ofid: orderformdisplay ?? undefined,
                          length: row.length,
                          inside_diameter: row.inside_diameter,
                          outside_diameter: row.outside_diameter,
                          flat_crush: row.flat_crush,
                          h20: row.h20,
                          number_control: row.number_of_control,
                          remarks: row.remarks,
                          pallete_count: row.pallete_count ?? 0,
                          user_id: userID,
                        };

                        console.log("Inserting data:", measurementData);

                        await AddMeasurementMutation.mutateAsync(
                          measurementData
                        );
                      }
                    }}
                  >
                    {({ values, setFieldValue }) => (
                      <Form>
                        <div className="">
                          <FieldArray
                            name="rowsmeasurement"
                            render={(arrayHelpers) => (
                              <div>
                                <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
                                  <button
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                    type="button"
                                    onClick={() => {
                                      const numberToAdd = 3;

                                      // Check if there's any unsaved/new pallete
                                      const hasNewPallete =
                                        values.rowsmeasurement.some(
                                          (row) => row.isnew
                                        );
                                      if (hasNewPallete) {
                                        alert(
                                          "Please save the current pallete(s) before adding more."
                                        );
                                        return;
                                      }

                                      for (let i = 1; i <= numberToAdd; i++) {
                                        const newIndex = values.rowsmeasurement.length + i - 1;
                                        arrayHelpers.push({
                                          pallete_count: 0,
                                          number_of_control: 0,
                                          length: "0",
                                          inside_diameter: "0",
                                          outside_diameter: "0",
                                          flat_crush: "0",
                                          h20: "0",
                                          remarks: "",
                                          isnew: true,
                                          iswhiteAll: false,
                                          isReadonly: false,
                                          isReadOnlyFlat: false, // Allow editing Flat Crush and H2O on all rows
                                        });
                                      }
                                      setcurrentpalleteCount((prev) => prev + numberToAdd);
                                    }}
                                  >
                                    Add Pallete
                                  </button>

                                  <button
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                    type="submit"
                                  >
                                    Save Measurement
                                  </button>
                                  <button
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md"
                                    onClick={() => {
                                      refetchOrdersData();
                                      setIsModalOpen(false);
                                      setOrderid(null);
                                      setCurrentOrder(null);
                                      refetchMeasurentData();
                                      refetchProductionData();
                                      setTractnumbercontrollenght(0);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
                                  <table className="table w-full text-center">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                                        <th className="text-xs font-bold py-3">Pallete</th>
                                        <th className="text-xs font-bold py-3">Length</th>
                                        <th className="text-xs font-bold py-3">Inside Diameter</th>
                                        <th className="text-xs font-bold py-3">Outside Diameter</th>
                                        <th className="text-xs font-bold py-3">Flat Crush</th>
                                        <th className="text-xs font-bold py-3">H₂O</th>
                                        <th className="text-xs font-bold py-3">Remarks</th>
                                        <th className="text-xs font-bold py-3">Option</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {values.rowsmeasurement.map(
                                        (row, index) => {
                                          // Count how many rows exist for the same number_of_control
                                          const existingRows =
                                            values.rowsmeasurement.filter(
                                              (r) =>
                                                r.number_of_control ===
                                                  row.number_of_control &&
                                                r.pallete_count ===
                                                  row.pallete_count
                                            );

                                          const maxRowsReached =
                                            existingRows.length >=
                                            row.number_of_control;
                                          const isLastRow =
                                            existingRows.length === 1;

                                          console.log(
                                            "maxRowsReached",
                                            maxRowsReached
                                          );
                                          setisMaxRow(maxRowsReached);
                                          return (
                                            <React.Fragment key={index}>
                                              <tr>
                                                <td>
                                                  <Field
                                                    name={`rowsmeasurement.${index}.pallete_count`}
                                                    placeholder={
                                                      values.rowsmeasurement[index]?.iswhiteAll
                                                        ? ""
                                                        : "0"
                                                    }
                                                    type="number"
                                                    readOnly={!!values.rowsmeasurement[index]?.iswhiteAll}
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "text-black hidden"
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
                                                      row.number_of_control ===
                                                      0
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "text-white hidden"
                                                        : "bg-white"
                                                    }`}
                                                    onBlur={(e: any) => {
                                                      setFieldValue(
                                                        `rowsmeasurement.${index}.length`,
                                                        formatToTwoDecimals(
                                                          e.target.value
                                                        )
                                                      );
                                                    }}
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    readOnly={
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.isReadonly
                                                    }
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "text-white hidden"
                                                        : values
                                                            .rowsmeasurement[
                                                            index
                                                          ]?.isReadonly //if my data disable 2 3
                                                        ? "bg-gray-200 cursor-not-allowed"
                                                        : "bg-white"
                                                    }`}
                                                    onBlur={(e: any) => {
                                                      setFieldValue(
                                                        `rowsmeasurement.${index}.inside_diameter`,
                                                        formatToTwoDecimals(
                                                          e.target.value
                                                        )
                                                      );
                                                    }}
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    readOnly={
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.isReadonly
                                                    }
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "hidden"
                                                        : values
                                                            .rowsmeasurement[
                                                            index
                                                          ]?.isReadonly //if my data disable 2 3
                                                        ? "bg-gray-200 cursor-not-allowed"
                                                        : "bg-white"
                                                    }`}
                                                    onBlur={(e: any) => {
                                                      setFieldValue(
                                                        `rowsmeasurement.${index}.outside_diameter`,
                                                        formatToTwoDecimals(
                                                          e.target.value
                                                        )
                                                      );
                                                    }}
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    readOnly={
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.isReadOnlyFlat
                                                    }
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "hidden"
                                                        : values
                                                            .rowsmeasurement[
                                                            index
                                                          ]?.isReadOnlyFlat
                                                        ? "bg-gray-200 cursor-not-allowed"
                                                        : "bg-white"
                                                    }`}
                                                    onBlur={(e: any) => {
                                                      setFieldValue(
                                                        `rowsmeasurement.${index}.flat_crush`,
                                                        formatToTwoDecimals(
                                                          e.target.value
                                                        )
                                                      );
                                                    }}
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    readOnly={
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.isReadOnlyFlat
                                                    }
                                                    className={`input input-bordered w-20 max-w-md ${
                                                      values.rowsmeasurement[
                                                        index
                                                      ]?.iswhiteAll
                                                        ? "hidden"
                                                        : values
                                                            .rowsmeasurement[
                                                            index
                                                          ]?.isReadOnlyFlat
                                                        ? "bg-gray-200 cursor-not-allowed"
                                                        : "bg-white"
                                                    }`}
                                                    onBlur={(e: any) => {
                                                      setFieldValue(
                                                        `rowsmeasurement.${index}.h20`,
                                                        formatToTwoDecimals(
                                                          e.target.value
                                                        )
                                                      );
                                                    }}
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
                                                        : "Add remarks"
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

                                                </td>
                                                <td></td>
                                              </tr>
                                            </React.Fragment>
                                          );
                                        }
                                      )}
                                    </tbody>
                                

                                    {isMeasurementLoading || isMeasurementFetching ? (
                                      <tr>
                                        <td colSpan={8}>
                                          <span className="loading loading-dots loading-md"></span>
                                        </td>
                                      </tr>
                                    ) : isMeasurementError ? (
                                      <tr>
                                        <td
                                          className="text-error font-bold"
                                          colSpan={8}
                                        >
                                          {measurementError?.message || "Something went wrong while fetching measurement data."}
                                        </td>
                                      </tr>
                                    ) : fetchedMeasurementData && fetchedMeasurementData.length === 0 ? (
                                      <tbody>
                                        <tr>
                                          <td colSpan={8} className="text-center text-sm text-slate-600">
                                            No Measurement Data Found
                                          </td>
                                        </tr>
                                      </tbody>
                                    ) : fetchedMeasurementData && fetchedMeasurementData.length > 0 ? (
                                      <FieldArray
                                        name="rows4"
                                        render={(arrayHelpers) => (
                                          <tbody className="border-y border-slate-500">
                                            {values.rows4.map((row, index) => (
                                              <tr
                                                key={index}
                                                className="border-y border-slate-500"
                                              >
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows4.${index}.pallete_count`}
                                                    type="number"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={row.pallete_count}
                                                    readOnly />
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
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={
                                                      editableRowMes === index
                                                        ? row.length
                                                        : formatToTwoDecimals(
                                                            row.length
                                                          )
                                                    }
                                                    readOnly={editableRowMes !== index}
                                                    onBlur={(e: any) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(
                                                          `rows4.${index}.length`,
                                                          formatToTwoDecimals(
                                                            e.target.value
                                                          )
                                                        );
                                                      }
                                                    }} />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows4.${index}.inside_diameter`}
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={
                                                      editableRowMes === index
                                                        ? row.inside_diameter
                                                        : formatToTwoDecimals(
                                                            row.inside_diameter
                                                          )
                                                    }
                                                    readOnly={editableRowMes !== index}
                                                    onBlur={(e: any) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(
                                                          `rows4.${index}.inside_diameter`,
                                                          formatToTwoDecimals(
                                                            e.target.value
                                                          )
                                                        );
                                                      }
                                                    }} />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows4.${index}.outside_diameter`}
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={
                                                      editableRowMes === index
                                                        ? row.outside_diameter
                                                        : formatToTwoDecimals(
                                                            row.outside_diameter
                                                          )
                                                    }
                                                    readOnly={editableRowMes !== index}
                                                    onBlur={(e: any) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(
                                                          `rows4.${index}.outside_diameter`,
                                                          formatToTwoDecimals(
                                                            e.target.value
                                                          )
                                                        );
                                                      }
                                                    }} />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows4.${index}.flat_crush`}
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={
                                                      editableRowMes === index
                                                        ? row.flat_crush
                                                        : formatToTwoDecimals(
                                                            row.flat_crush
                                                          )
                                                    }
                                                    readOnly={editableRowMes !== index}
                                                    onBlur={(e: any) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(
                                                          `rows4.${index}.flat_crush`,
                                                          formatToTwoDecimals(
                                                            e.target.value
                                                          )
                                                        );
                                                      }
                                                    }} />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <Field
                                                    name={`rows4.${index}.h20`}
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="input input-bordered w-20 max-w-md"
                                                    value={
                                                      editableRowMes === index
                                                        ? row.h20
                                                        : formatToTwoDecimals(
                                                            row.h20
                                                          )
                                                    }
                                                    readOnly={editableRowMes !== index}
                                                    onBlur={(e: any) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(
                                                          `rows4.${index}.h20`,
                                                          formatToTwoDecimals(
                                                            e.target.value
                                                          )
                                                        );
                                                      }
                                                    }} />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <input
                                                    type="text"
                                                    className="input input-bordered"
                                                    value={row.remarks || ""}
                                                    readOnly={editableRowMes !== index}
                                                    onChange={(e) => {
                                                      if (editableRowMes === index) {
                                                        setFieldValue(`rows4.${index}.remarks`, e.target.value);
                                                      }
                                                    }}
                                                  />
                                                </td>
                                                <td className="border-y border-slate-500">
                                                  <div className="flex gap-2 justify-end">
                                                    {editableRowMes ===
                                                      index ? (
                                                      <>
                                                        <button
                                                          type="button"
                                                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                                          onClick={async () => {
                                                            try {
                                                              await updateMeasurementMutation.mutateAsync(
                                                                {
                                                                  ...row,
                                                                }
                                                              );
                                                              setEditableRowMes(
                                                                null
                                                              ); // Reset editable row after saving
                                                              refetchMeasurentData(); // Refetch data after update
                                                            } catch (error) {
                                                              console.error(
                                                                "Error in mutation:",
                                                                error
                                                              );
                                                            }
                                                            setIsModalOpen(
                                                              false
                                                            );
                                                            setTimeout(() => {
                                                              setIsModalOpen(
                                                                true
                                                              );
                                                              setSelectedTab(
                                                                "tab3"
                                                              );
                                                            }, 100);
                                                          } }
                                                        >
                                                          Save
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs transition-all duration-300 shadow-sm hover:shadow-md"
                                                          onClick={() => {
                                                            if (window.confirm(
                                                              "Are you sure you want to cancel?"
                                                            )) {
                                                              setTractnumbercontrollenght(
                                                                0
                                                              );
                                                              setEditableRowMes(
                                                                null
                                                              ); // Reset the editable state
                                                              refetchMeasurentData(); // Refetch measurement data
                                                              setIsModalOpen(
                                                                false
                                                              );
                                                              setTimeout(() => {
                                                                setIsModalOpen(
                                                                  true
                                                                );
                                                                setSelectedTab(
                                                                  "tab3"
                                                                );
                                                              }, 100);
                                                            }
                                                          } }
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
                                                              className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${editableRowMes !==
                                                                  null
                                                                  ? "hidden"
                                                                  : ""}`}
                                                              onClick={() => {
                                                                setEditableRowMes(
                                                                  index
                                                                );
                                                                console.log(
                                                                  "the id is:",
                                                                  row.measurement_id
                                                                );
                                                              } }
                                                            >
                                                              Edit
                                                            </button>
                                                            <button
                                                              type="button"
                                                              className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${editableRowMes !==
                                                                  null
                                                                  ? "hidden"
                                                                  : ""} ${removeMeasurementMutation.isPending
                                                                  ? "opacity-50 cursor-not-allowed"
                                                                  : ""}`}
                                                              onClick={() => {
                                                                const isConfirmed = window.confirm(
                                                                  "Are you sure you want to remove this measurement?"
                                                                );
                                                                if (isConfirmed) {
                                                                  removeMeasurementMutation.mutate(
                                                                    {
                                                                      measurement_id: row.measurement_id,
                                                                      is_exist: false,
                                                                    }
                                                                  );
                                                                }
                                                              } }
                                                              disabled={removeMeasurementMutation.isPending}
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
                                    ) : null}
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

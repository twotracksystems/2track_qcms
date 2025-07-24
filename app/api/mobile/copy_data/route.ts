import { createClient } from "@/utils/supabase/server";
import { get } from "http";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    const getArticle = await supabase.from("tbl_article").select("*");
    const getArticleMax = await supabase.from("tbl_article_max").select("*");
    const getArticleMin = await supabase.from("tbl_article_min").select("*");
    const getArticleNominal = await supabase
      .from("tbl_article_nominal")
      .select("*");
    const getAssigneeHistory = await supabase
      .from("tbl_assignee_history")
      .select("*");
    const getCustomer = await supabase.from("tbl_customer").select("*");
    const getLaboratory = await supabase.from("tbl_laboratory").select("*");
    const getMeasurement = await supabase.from("tbl_measurement").select("*");
    const getMeasurementHistory = await supabase
      .from("tbl_measurement_history")
      .select("*");
    const tbl_orders_form = await supabase.from("tbl_orders_form").select("*");
    const getProduction = await supabase.from("tbl_production").select("*");
    const getProofing = await supabase.from("tbl_proofing").select("*");
    const getUsers = await supabase.from("tbl_users").select("*");

    if (
      getArticle.error ||
      getArticleMax.error ||
      getArticleMin.error ||
      getArticleNominal.error ||
      getAssigneeHistory.error ||
      getCustomer.error ||
      getLaboratory.error ||
      getMeasurement.error ||
      getMeasurementHistory.error ||
      tbl_orders_form.error ||
      getProduction.error ||
      getProofing.error ||
      getUsers.error
    ) {
      console.log("Error fetching data from Supabase:", {
        getArticleError: getArticle.error,
        getArticleMaxError: getArticleMax.error,
        getArticleMinError: getArticleMin.error,
        getArticleNominalError: getArticleNominal.error,
        getAssigneeHistoryError: getAssigneeHistory.error,
        getCustomerError: getCustomer.error,
        getLaboratoryError: getLaboratory.error,
        getMeasurementError: getMeasurement.error,
        getMeasurementHistoryError: getMeasurementHistory.error,
        tbl_orders_formError: tbl_orders_form.error,
        getProductionError: getProduction.error,
        getProofingError: getProofing.error,
        getUsersError: getUsers.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch data from Supabase" },
        { status: 500 }
      );
    }
    // Prepare the response data
    const responseData = {
      article: getArticle.data,
      articleMax: getArticleMax.data,
      articleMin: getArticleMin.data,
      articleNominal: getArticleNominal.data,
      assigneeHistory: getAssigneeHistory.data,
      customer: getCustomer.data,
      laboratory: getLaboratory.data,
      measurement: getMeasurement.data,
      measurementHistory: getMeasurementHistory.data,
      ordersForm: tbl_orders_form.data,
      production: getProduction.data,
      proofing: getProofing.data,
      users: getUsers.data,
    };

    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

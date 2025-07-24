
import EditMeasurementList from "@/components/VIEW/MeasurementListViewCopy";
import React from "react";
export default async function EditUser({params}: {params:any}) {
  const {id} = await params;
  return <EditMeasurementList params={id}></EditMeasurementList>;
}

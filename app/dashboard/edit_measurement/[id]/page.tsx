"use client";
import EditMeasurementList from "@/components/VIEW/EditMeasurementList";

export default function EditUser({params}: {params:any}) {
  return <EditMeasurementList params={params.id}></EditMeasurementList>;
}

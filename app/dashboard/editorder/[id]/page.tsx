
import EditOrderList from "@/components/VIEW/EditOrderList";
import React from "react";

export default async function EditOrder({ params }: { params: any }) {
  const {id} = await params;
  return <EditOrderList params={id}></EditOrderList>;
}

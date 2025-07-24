import ViewCustomerList from "@/components/VIEW/ViewCustomerList";
import React from "react";

export default async function EditCustomer({ params }: { params: any }) {
  const {id} = await params;
  return <ViewCustomerList params={id}></ViewCustomerList>;
}

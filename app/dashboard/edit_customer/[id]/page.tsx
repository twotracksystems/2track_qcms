import EditCustomerList from "@/components/VIEW/EditCustomerList";
import React from "react";

export default async function EditCustomer({ params }: { params: any }) {
  const {id} = await params;
  return <EditCustomerList params={id}></EditCustomerList>;
}

import EditUserList from "@/components/VIEW/EditUserList";
import React from "react";

export default async function EditUser({ params }: { params: any }) {
  const {id} = await params;
  return <EditUserList params={id}></EditUserList>;
}

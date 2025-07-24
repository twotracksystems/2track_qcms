import ViewUserList from "@/components/VIEW/ViewUserList";
import React from "react";

export default async function EditUser({ params }: { params: any }) {
  const {id} = await params;
  return <ViewUserList params={id}></ViewUserList>;
}

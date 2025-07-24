
import EditArticleList from "@/components/VIEW/ViewArticleList";
import React from "react";

export default async function EditUser({params}: {params:any}) {
  const {id} = await params;
  return <EditArticleList params={id}></EditArticleList>;
}

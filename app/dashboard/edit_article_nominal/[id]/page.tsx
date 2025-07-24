"use client";
import EditArticleNominalList from "@/components/VIEW/EditArticleNominalList";

export default function EditUser({params}: {params:any}) {
  return <EditArticleNominalList params={params.id}></EditArticleNominalList>;
}

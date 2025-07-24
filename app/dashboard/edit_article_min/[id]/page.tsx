"use client";
import EditArticleMinList from "@/components/VIEW/EditArticleMinList";

export default function EditUser({params}: {params:any}) {
  return <EditArticleMinList params={params.id}></EditArticleMinList>;
}

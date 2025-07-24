"use client";
import EditArticleMaxList from "@/components/VIEW/EditArticleMaxList";

export default function EditUser({ params }: { params: any }) {
  return <EditArticleMaxList params={params.id}></EditArticleMaxList>;
}

// import IndexHeader from "@/components/UI/IndexHeader";
// import IndexWithoutHeader from "@/components/UI/IndexWithoutHeader";
// import AddUserView from "@/components/VIEW/AddUserView";
// import LoginView from "@/components/VIEW/LoginView";
// import UserListView from "@/components/VIEW/UserListView";
// import Navigation from "@/components/UI/Navigation";
// import SideBar from "@/components/UI/SideBar";
"use client";
import AddArticleNominalList from "@/components/VIEW/AddArticleNominalList";
export default function AddArticleNominal({params}: {params:any}) {
  return (
    <AddArticleNominalList params={params.id}></AddArticleNominalList>
  );
}


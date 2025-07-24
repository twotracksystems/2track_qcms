// import IndexHeader from "@/components/UI/IndexHeader";
// import IndexWithoutHeader from "@/components/UI/IndexWithoutHeader";
// import AddUserView from "@/components/VIEW/AddUserView";
// import LoginView from "@/components/VIEW/LoginView";
// import UserListView from "@/components/VIEW/UserListView";
// import Navigation from "@/components/UI/Navigation";
// import SideBar from "@/components/UI/SideBar";
"use client";
import EditProofingList from "@/components/VIEW/EditProofingList";
export default function EditProofing({params}: {params:any}) {
  return (
    <EditProofingList params={params.id}></EditProofingList>
  );
}


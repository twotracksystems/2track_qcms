"use client";
import UserListView from "@/components/VIEW/UserListView";
import SideBar from "@/components/UI/SideBar";

export default function Home() {
  return (
    <><SideBar>
      <UserListView></UserListView>
    </SideBar></>
  );
}

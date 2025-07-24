
import CustomerListView from "@/components/VIEW/CustomerListView";
import SideBar from "@/components/UI/SideBar";

export default function Home() {
  return (
    <><SideBar>
      <CustomerListView></CustomerListView>
    </SideBar></>
  );
}

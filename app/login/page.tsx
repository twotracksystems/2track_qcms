import IndexHeader from "@/components/UI/IndexHeader";
import IndexWithoutHeader from "@/components/UI/IndexWithoutHeader";
import LoginView from "@/components/VIEW/LoginView";

export default function Home() {
  return (
    <IndexWithoutHeader>
      <LoginView />
    </IndexWithoutHeader>
  );
}

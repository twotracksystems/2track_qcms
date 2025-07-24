import IndexHeader from "@/components/UI/IndexHeader";
import IndexWithoutHeader from "@/components/UI/IndexWithoutHeader";
import EmailConfirmation from "@/components/VIEW/EmailConfirmation";

export default function Home() {
  return (
    <IndexWithoutHeader>
      <EmailConfirmation />
    </IndexWithoutHeader>
  );
}

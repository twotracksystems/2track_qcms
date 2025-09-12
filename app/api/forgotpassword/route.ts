import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {  // Remove 'res' parameter
  const { email } = await req.json();

  const supabase = await createClient();
  if (!email) {
    return NextResponse.json(
      { error: "Email and code are required." },
      { status: 400 }
    );
  }

  
const { data, error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.log("Error fetching data:", error);
    return NextResponse.json(
      { error: "Invalid email or code." },
      { status: 401 }
    );
  }

  // If everything is valid
  return NextResponse.json(
    { message: "Verification successful.", user: data },
    { status: 200 }
  );
}

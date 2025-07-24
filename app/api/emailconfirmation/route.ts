import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {  // Remove 'res' parameter
  const { email, code } = await req.json();

  const supabase = await createClient();
  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tbl_users")
    .select("*")
    .eq("email", email)
    .eq("code", code) // Assuming you store the code in a field like "verification_code"
    .single();

  if (error || !data) {
    console.log("Error fetching data:", error);
    return NextResponse.json(
      { error: "Invalid email or code." },
      { status: 401 }
    );
  }
  const codeExpiration = new Date(data.code_expiration);
  const now = new Date();
  
  if (now > codeExpiration) {
    return NextResponse.json(
      { error: "Code expired." },
      { status: 402 }
    );
  }

  const updateuser = await supabase
      .from("tbl_users")
      .update({ is_verified: true })
      .eq("email", email)
      .eq("code", code)
      .single();

  // If everything is valid
  return NextResponse.json(
    { message: "Verification successful.", user: data },
    { status: 200 }
  );
}

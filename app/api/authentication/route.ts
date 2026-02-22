import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401, statusText: "Login Failed" }
    );
  }

  const userinformation = await supabase
    .from("tbl_users")
    .select("*")
    .eq("uuid", data.user?.id);

  if (userinformation.error) {
    return NextResponse.json(
      { error: userinformation.error.message },
      { status: 401, statusText: "Login Failed" }
    );
  }

  if (!userinformation.data?.[0]) {
    return NextResponse.json(
      { error: "User record not found." },
      { status: 404, statusText: "Login Failed" }
    );
  }

  const JoinData = { ...data, db_record: { ...userinformation.data[0] } };

  return NextResponse.json(JoinData, {
    status: 200,
    statusText: "Login Successful",
  });
}

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { userInfo } from "os";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  const userinformation = await supabase
    .from("tbl_users")
    .select("*")
    .eq("uuid", data.user?.id);


  if (error || userinformation.error) {
    return NextResponse.json(
      { error: error?.message || userinformation.error?.message },
      { status: 401, statusText: "Login Failed" }
    );
  }
  const JoinData = { ...data, db_record:{...userinformation.data[0]} };


  return NextResponse.json(JoinData, {
    status: 200,
    statusText: "Login Successful",
  });
}

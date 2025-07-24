import { createClient } from "@/utils/supabase/admin";
import { roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    email,
    first_name,
    // middle_name,
    last_name,
    role,
    // suffix,
    password,
  } = await req.json();

  const supabase = await createClient();
  const current_role = await roleExtractor(supabase);

  if (current_role !== "Super Admin") {
    return NextResponse.json(
      { error: "No permission to perform this action." },
      { status: 401 }
    );
  }

  // Sign up the user with Supabase
  const {data,error}=await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata:{
      first_name: first_name,
      // middle_name: middle_name,
      last_name: last_name,
      // suffix: suffix,
      role: role,
    }
  });


  console.log(error,data)


  // Handle the error if it exists
  if (error) {
    if (error.message.includes("already registered")) {
      // Check for email already registered error
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    } else {
      // Handle other errors
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  // Insert user details if sign up was successful
  const insertUserDetails = await supabase.from("tbl_users").insert([
    {
      uuid: data.user?.id,
      email: email,
      first_name: first_name,
      // middle_name: middle_name,
      last_name: last_name,
      role: role,
      // suffix: suffix,
      is_exist: true,
    },
  ]);

  console.log("User details inserted:", insertUserDetails);
  if (insertUserDetails.error) {  
    return NextResponse.json(
      { error: insertUserDetails.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

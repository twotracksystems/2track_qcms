import { createClient, roleExtractor } from "@/utils/supabase/server";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {

    // Parse request body
    const { email,password } =
      await req.json();

    // Check required fields
    if (!email !|| !password) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: email and password",
        },
        { status: 400 }
      );
    }
    // Initialize Supabase client
    const supabase = await createClient();


const { data, error } = await supabase.auth.updateUser({
  email: email,
  password: password,
})

if (error) {
  console.error("Error updating user:", error);
  return NextResponse.json(
    { error: "Failed to update user", details: error.message },
    { status: 500 }
  );
}
    return NextResponse.json(
      { message: "User updated successfully", data: data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: err.message },
      { status: 500 }
    );
  }
}

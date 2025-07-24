
import { createClient } from "@/utils/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend("re_6FHQ1PNq_JNzXrmuNGJQCfZ9CYvGJ2jCt");

console.log("API Route Loaded: /api/send");

export async function POST(req: NextRequest) {
  console.log("Request method:", req.method);
  console.log("Headers:", req.headers);

  const supabase = createClient();

  try {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const currentDate = new Date(); 
const codeExpiration = new Date(currentDate.getTime() + 5 * 60 * 1000); 

// console.log("Current Date:", currentDate);
// console.log("Future Date (+5 minutes):", futureDate);


    const body = await req.json();
    console.log("Request body:", body);

    // Validate email field
    if (!body.email) {
      console.error("Missing email field in request body");
      return NextResponse.json(
        { error: "Missing 'email' in request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Check if the email exists in the database
    const { data: user, error: fetchError } = await supabase
      .from("tbl_users")
      .select("email")
      .eq("email", email)
      .single(); // Ensures only one record is fetched

    if (fetchError || !user) {
      console.error("Invalid email: Email does not exist in the database");
      return NextResponse.json(
        { error: "Invalid email address. Email does not exist." },
        { status: 404 }
      );
    }

    // Send the verification email
    const { data: emailResponse, error: sendError } = await resend.emails.send({
      from: "Acme <onboarding@dev.sledgehammerdevelopmentteam.uk>",
      to: [email],
      subject: "Verify Your Email Address",
      text: `Your verification code is: ${verificationCode}`,
    });

    if (sendError) {
      console.error("Resend API error:", sendError);
      return NextResponse.json(
        { error: sendError.message || "Failed to send email" },
        { status: 500 }
      );
    }

    // Update the user's verification code and expiration in the database
    const { error: updateError } = await supabase
      .from("tbl_users")
      .update({
        code: verificationCode,
        code_expiration: codeExpiration.toISOString(),
      })
      .eq("email", email);

    if (updateError) {
      console.error("Error updating user data:", updateError);
      return NextResponse.json(
        { error: "Failed to update user verification data" },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", emailResponse);
    return NextResponse.json({ message: "Email sent successfully", data: user.email, emailResponse });
  } catch (error) {
    console.error("Caught exception:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

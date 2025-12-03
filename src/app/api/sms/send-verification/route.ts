import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import {
  storeVerificationCode,
  cleanupExpiredCodes,
} from "@/lib/verification-storage";

export async function POST(request: NextRequest) {
  try {
    const { phone, name, email } = await request.json();

    if (!phone || !name || !email) {
      return NextResponse.json(
        { success: false, error: "Phone, name, and email are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Clean up expired codes
    cleanupExpiredCodes();

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code with phone as key
    storeVerificationCode(cleanedPhone, {
      code,
      expiresAt,
      phone: cleanedPhone,
      name,
      email,
    });

    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { success: false, error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // Format phone number for Twilio (E.164 format)
    const formattedPhone = cleanedPhone.startsWith("1")
      ? `+${cleanedPhone}`
      : `+1${cleanedPhone}`;

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send SMS
    try {
      await client.messages.create({
        body: `Your Smart Scale verification code is: ${code}. This code expires in 10 minutes.`,
        from: fromNumber,
        to: formattedPhone,
      });

      return NextResponse.json({
        success: true,
        message: "Verification code sent successfully",
      });
    } catch (twilioError: any) {
      console.error("Twilio error:", twilioError);
      
      // Handle specific Twilio errors
      let errorMessage = "Failed to send verification code";
      
      if (twilioError.code === 21211) {
        errorMessage = "Invalid phone number format. Please check and try again.";
      } else if (twilioError.code === 21608) {
        errorMessage = "This phone number is not verified. If you're using a Twilio trial account, you must verify recipient phone numbers first.";
      } else if (twilioError.code === 21614) {
        errorMessage = "Invalid 'To' phone number. Please check the number and try again.";
      } else if (twilioError.message?.includes("trial")) {
        errorMessage = "Trial account limitation: Please verify this phone number in your Twilio console first, or upgrade your account.";
      } else if (twilioError.message) {
        errorMessage = twilioError.message;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: twilioError.code,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send verification code",
      },
      { status: 500 }
    );
  }
}


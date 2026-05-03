import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { phone, otp } = await request.json();

  if (!phone || !otp) {
    return NextResponse.json({ error: "Missing phone or otp" }, { status: 400 });
  }

  const apiKey = process.env.CLICKATELL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clickatell not configured" }, { status: 500 });
  }

  const message = `Your OverBerg Go verification code is: ${otp}. Valid for 5 minutes.`;

  const res = await fetch("https://platform.clickatell.com/messages/http/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      content: message,
      to: [phone.replace(/\+/g, "")],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Clickatell error:", body);
    return NextResponse.json({ error: "SMS delivery failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, messageId: data.messages?.[0]?.apiMessageId });
}

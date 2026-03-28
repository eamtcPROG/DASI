import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/lib/auth-server"

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response, request)
  return response
}

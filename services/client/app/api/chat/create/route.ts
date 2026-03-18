import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME } from "@/lib/auth"
import { requestGateway } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json(
      {
        error: true,
        htmlcode: 401,
        object: null,
        messages: [{ message: "Authentication required.", type: "error" }],
      },
      { status: 401 }
    )
  }

  const body = await request.json()
  
  const { ok, status, payload } = await requestGateway(
    "/chat/join",
    { 
      method: "POST",
      body,
      token
    }
  )

  return NextResponse.json(payload, { status })
}

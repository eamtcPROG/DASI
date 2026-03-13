import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth"
import { createErrorResponse, requestGateway } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return createErrorResponse("Authentication required.", 401)
  }

  const { searchParams } = request.nextUrl
  const page = searchParams.get("page") ?? "1"
  const onPage = searchParams.get("onPage") ?? "50"

  const { ok, status, payload } = await requestGateway(
    `/auth/users?page=${page}&onPage=${onPage}`,
    { token },
  )

  if (!payload) {
    return createErrorResponse("Gateway service is unavailable.", 503)
  }

  return NextResponse.json(payload, { status: ok ? status : status })
}

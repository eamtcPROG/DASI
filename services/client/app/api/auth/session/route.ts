import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  type AuthDto,
  type ResultObjectDto,
} from "@/lib/auth"
import { getSessionCookieOptions, requestGateway } from "@/lib/auth-server"

function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      error: true,
      htmlcode: status,
      object: null,
      messages: [{ message, type: "error" }],
    } satisfies ResultObjectDto<null>,
    { status },
  )
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return createErrorResponse("Authentication required.", 401)
  }

  const { ok, status, payload } = await requestGateway<ResultObjectDto<AuthDto>>(
    "/auth/refresh",
    {
      token,
    },
  )

  if (!payload) {
    const response = createErrorResponse("Gateway service is unavailable.", 503)
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }

  const response = NextResponse.json(payload, { status })

  if (ok && payload.object?.access_token) {
    response.cookies.set(
      AUTH_COOKIE_NAME,
      payload.object.access_token,
      getSessionCookieOptions(),
    )
  } else {
    response.cookies.delete(AUTH_COOKIE_NAME)
  }

  return response
}

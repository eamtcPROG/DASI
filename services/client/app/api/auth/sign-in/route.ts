import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  type AuthDto,
  type ResultObjectDto,
  type SignInDto,
} from "@/lib/auth"
import {
  createErrorResponse,
  getSessionCookieOptions,
  requestGateway,
} from "@/lib/auth-server"

export async function POST(request: Request) {
  let body: SignInDto

  try {
    body = (await request.json()) as SignInDto
  } catch {
    return createErrorResponse("Invalid request body.", 400)
  }

  const { ok, status, payload } = await requestGateway<ResultObjectDto<AuthDto>>(
    "/auth/sign-in",
    {
      method: "POST",
      body,
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

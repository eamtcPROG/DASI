import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  type AuthDto,
  type CreateUserDto,
  type ResultObjectDto,
} from "@/lib/auth"
import {
  clearSessionCookie,
  createErrorResponse,
  getSessionCookieOptions,
  requestGateway,
} from "@/lib/auth-server"

export async function POST(request: Request) {
  let body: CreateUserDto

  try {
    body = (await request.json()) as CreateUserDto
  } catch {
    return createErrorResponse("Invalid request body.", 400)
  }

  const { ok, status, payload } = await requestGateway<ResultObjectDto<AuthDto>>(
    "/auth/sign-up",
    {
      method: "POST",
      body,
    },
  )

  if (!payload) {
    const response = createErrorResponse("Gateway service is unavailable.", 503)
    clearSessionCookie(response, request)
    return response
  }

  const response = NextResponse.json(payload, { status })

  if (ok && payload.object?.access_token) {
    response.cookies.set(
      AUTH_COOKIE_NAME,
      payload.object.access_token,
      getSessionCookieOptions(request),
    )
  } else {
    clearSessionCookie(response, request)
  }

  return response
}

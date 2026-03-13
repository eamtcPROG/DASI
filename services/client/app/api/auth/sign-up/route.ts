import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  type AuthDto,
  type CreateUserDto,
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

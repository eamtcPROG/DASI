import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  type AuthDto,
  type ResultObjectDto,
  type SignInDto,
} from "@/lib/auth"
import {
  clearSessionCookie,
  createErrorResponse,
  getSessionCookieOptions,
  requestGateway,
} from "@/lib/auth-server"

function summarizeSignInPayload(payload: ResultObjectDto<AuthDto> | null) {
  if (!payload) return { payload: null as const }
  const obj = payload.object
  const token = obj?.access_token
  const fullToken = process.env.AUTH_DEBUG_LOG === "true"
  return {
    error: payload.error,
    htmlcode: payload.htmlcode,
    messages: payload.messages,
    hasObject: Boolean(obj),
    user: obj?.user ?? null,
    access_token: fullToken
      ? token
      : token
        ? `${token.slice(0, 12)}…(len=${token.length})`
        : null,
  }
}

export async function POST(request: Request) {
  let body: SignInDto

  try {
    body = (await request.json()) as SignInDto
  } catch {
    return createErrorResponse("Invalid request body.", 400)
  }

  const forwarded = {
    host: request.headers.get("host"),
    "x-forwarded-host": request.headers.get("x-forwarded-host"),
    "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
    "x-forwarded-for": request.headers.get("x-forwarded-for"),
  }

  console.info("[auth/sign-in] request", {
    url: request.url,
    forwarded,
    email: body.email,
    gatewayUrl: (process.env.GATEWAY_URL ?? "http://127.0.0.1:3000").replace(/\/$/, ""),
  })

  const { ok, status, payload } = await requestGateway<ResultObjectDto<AuthDto>>(
    "/auth/sign-in",
    {
      method: "POST",
      body,
    },
  )

  console.info("[auth/sign-in] gateway", {
    ok,
    httpStatus: status,
    summary: summarizeSignInPayload(payload),
  })

  if (!payload) {
    const response = createErrorResponse("Gateway service is unavailable.", 503)
    clearSessionCookie(response, request)
    console.info("[auth/sign-in] no payload; cleared session cookie")
    return response
  }

  const response = NextResponse.json(payload, { status })
  const cookieOpts = getSessionCookieOptions(request)

  if (ok && payload.object?.access_token) {
    response.cookies.set(
      AUTH_COOKIE_NAME,
      payload.object.access_token,
      cookieOpts,
    )
    console.info("[auth/sign-in] set session cookie", {
      name: AUTH_COOKIE_NAME,
      options: cookieOpts,
    })
  } else {
    clearSessionCookie(response, request)
    console.info("[auth/sign-in] cleared session cookie (no token or !ok)", {
      ok,
      hasToken: Boolean(payload.object?.access_token),
    })
  }

  const setCookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : []
  console.info("[auth/sign-in] outgoing Set-Cookie count", setCookieHeaders.length)
  for (let i = 0; i < setCookieHeaders.length; i++) {
    const line = setCookieHeaders[i]
    const redacted = line.replace(
      new RegExp(`^${AUTH_COOKIE_NAME}=[^;]+`),
      `${AUTH_COOKIE_NAME}=<redacted>`,
    )
    console.info(`[auth/sign-in] Set-Cookie[${i}]`, redacted)
  }
  if (process.env.AUTH_DEBUG_LOG === "true") {
    console.info("[auth/sign-in] Set-Cookie raw (AUTH_DEBUG_LOG)", setCookieHeaders)
  }

  return response
}

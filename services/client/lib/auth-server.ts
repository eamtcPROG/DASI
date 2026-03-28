import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE,
  type AuthDto,
  type ResultObjectDto,
  type UserDto,
} from "@/lib/auth"

const DEFAULT_GATEWAY_URL = "http://127.0.0.1:3000"

type GatewayRequestOptions = {
  method?: "GET" | "POST"
  body?: unknown
  token?: string
}

type GatewayResponse<T> = {
  ok: boolean
  status: number
  payload: T | null
}

function getGatewayUrl() {
  return (process.env.GATEWAY_URL ?? DEFAULT_GATEWAY_URL).replace(/\/$/, "")
}

async function parseJson<T>(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function createErrorResponse(message: string, status: number) {
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

export async function requestGateway<T>(
  path: string,
  { method = "GET", body, token }: GatewayRequestOptions = {},
): Promise<GatewayResponse<T>> {
  const headers = new Headers({
    Accept: "application/json",
  })

  if (body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${getGatewayUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })

    return {
      ok: response.ok,
      status: response.status,
      payload: await parseJson<T>(response),
    }
  } catch {
    return {
      ok: false,
      status: 503,
      payload: null,
    }
  }
}

function firstForwardedValue(
  request: Request | undefined,
  name: string,
): string | undefined {
  if (!request) return undefined
  const raw = request.headers.get(name)
  if (!raw) return undefined
  return raw.split(",")[0]?.trim()
}

function forwardedHostHostname(request: Request | undefined): string | undefined {
  const host = firstForwardedValue(request, "x-forwarded-host")
  if (!host) return undefined
  return host.split(":")[0]?.toLowerCase()
}

function isUnsafeInternalHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0]
  if (h === "localhost" || h === "[::1]" || h.startsWith("127.")) return true
  if (h.startsWith("10.") || h.startsWith("192.168.")) return true
  return /^172\.(1[6-9]|2\d|3[01])\./.test(h)
}

/**
 * Secure flag: SECURE_COOKIES overrides; else trust X-Forwarded-Proto: https (nginx TLS
 * termination); else production default.
 */
function sessionCookieSecure(request?: Request): boolean {
  const flag = process.env.SECURE_COOKIES
  if (flag === "true") return true
  if (flag === "false") return false
  const proto = firstForwardedValue(request, "x-forwarded-proto")
  if (proto === "https") return true
  return process.env.NODE_ENV === "production"
}

/**
 * Optional Domain for Set-Cookie when Host seen by Node is the internal upstream (127.0.0.1,
 * container name). Set AUTH_COOKIE_DOMAIN=converso.me or TRUST_PROXY_COOKIE_HOST=true with
 * nginx: proxy_set_header X-Forwarded-Host $host;
 */
function sessionCookieDomain(request?: Request): string | undefined {
  const fromEnv = process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (fromEnv) {
    return fromEnv.startsWith(".") ? fromEnv.slice(1) : fromEnv
  }
  if (process.env.TRUST_PROXY_COOKIE_HOST !== "true" || !request) {
    return undefined
  }
  const host = forwardedHostHostname(request)
  if (!host || isUnsafeInternalHost(host)) return undefined
  return host
}

export type SessionCookieOptions = {
  httpOnly: boolean
  sameSite: "lax"
  secure: boolean
  path: string
  maxAge: number
  domain?: string
}

export function getSessionCookieOptions(request?: Request): SessionCookieOptions {
  const domain = sessionCookieDomain(request)
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(request),
    path: "/",
    maxAge: SESSION_MAX_AGE,
    ...(domain ? { domain } : {}),
  }
}

/** Clears the session cookie with the same path/domain as getSessionCookieOptions. */
export function clearSessionCookie(response: NextResponse, request?: Request) {
  const opts = getSessionCookieOptions(request)
  response.cookies.set(AUTH_COOKIE_NAME, "", { ...opts, maxAge: 0 })
}

export async function getSessionFromToken(token: string) {
  const result = await requestGateway<ResultObjectDto<AuthDto>>("/auth/refresh", {
    token,
  })

  if (!result.ok || !result.payload?.object) {
    return null
  }

  return result.payload.object
}

export const getSessionFromCookie = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return getSessionFromToken(token)
})

export async function requireUser(): Promise<UserDto> {
  const session = await getSessionFromCookie()

  if (!session) {
    redirect("/signin")
  }

  return session.user
}

export async function redirectIfAuthenticated() {
  const session = await getSessionFromCookie()

  if (session) {
    redirect("/chat")
  }
}

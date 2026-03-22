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

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.SECURE_COOKIES === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  }
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

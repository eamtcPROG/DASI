import { NextResponse } from "next/server"

import { type ResultObjectDto } from "@/lib/auth"
import { createErrorResponse, requestGateway } from "@/lib/auth-server"

export async function POST(request: Request) {
  let body: { email: string }

  try {
    body = (await request.json()) as { email: string }
  } catch {
    return createErrorResponse("Invalid request body.", 400)
  }

  const {status, payload } = await requestGateway<ResultObjectDto<null>>(
    "/auth/reset-password",
    { method: "POST", body },
  )

  if (!payload) {
    return createErrorResponse("Gateway service is unavailable.", 503)
  }

  return NextResponse.json(payload, { status })
}

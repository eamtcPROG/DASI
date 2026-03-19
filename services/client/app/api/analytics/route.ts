import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME } from "@/lib/auth"
import { requestGateway } from "@/lib/auth-server"

type RangeKey = "1m" | "1h" | "1d" | "7d" | "30d"

function getRangeConfig(range: RangeKey): { bucketMs: number; bucketCount: number } {
  if (range === "1m") return { bucketMs: 5_000, bucketCount: 12 }
  if (range === "1h") return { bucketMs: 300_000, bucketCount: 12 }
  if (range === "1d") return { bucketMs: 3_600_000, bucketCount: 24 }
  if (range === "7d") return { bucketMs: 86_400_000, bucketCount: 7 }
  return { bucketMs: 259_200_000, bucketCount: 10 }
}

function getBucketLabel(range: RangeKey, index: number, bucketCount: number): string {
  if (range === "1m") return `${(bucketCount - index) * 5}s`
  if (range === "1h") return `${(bucketCount - index) * 5}m`
  if (range === "1d") return `${23 - index}h`
  if (range === "7d") return `D-${6 - index}`
  return `W-${9 - index}`
}

function buildMessageBucketsFromTimes(messageTimes: string[], range: RangeKey) {
  const { bucketMs, bucketCount } = getRangeConfig(range)
  const now = Date.now()
  const buckets = Array.from({ length: bucketCount }).map((_, index) => ({
    bucket: getBucketLabel(range, index, bucketCount),
    messages: 0,
    users: 0,
    chats: 0,
  }))

  for (const timestamp of messageTimes) {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) continue
    const elapsed = Math.max(0, now - date.getTime())
    const reverseIndex = Math.floor(elapsed / bucketMs)
    const index = bucketCount - 1 - reverseIndex
    if (index < 0 || index >= bucketCount) continue
    buckets[index].messages += 1
  }

  return buckets
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const range = (request.nextUrl.searchParams.get("range") ?? "1d") as RangeKey

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

  const { status, payload } = await requestGateway<{
    object?: {
      totalUsers: number
      totalMessages: number
      totalChats?: number
      updatedAt: string
      lastMessageAt?: string | null
    }
    totalUsers?: number
    totalMessages?: number
    totalChats?: number
    updatedAt?: string
    lastMessageAt?: string | null
  }>("/analytics", { method: "GET", token })

  const { payload: activityPayload } = await requestGateway<
    | Array<{ bucket: string; messages: number; users: number; chats?: number }>
    | {
        object?: Array<{ bucket: string; messages: number; users: number; chats?: number }>
      }
    | {
        objects?: Array<{ bucket: string; messages: number; users: number; chats?: number }>
      }
  >(`/analytics/activity?range=${range}`, { method: "GET", token })

  const data = payload?.object ?? payload ?? { totalUsers: 0, totalMessages: 0, updatedAt: new Date().toISOString() }
  // Gateway wraps arrays into ResultListDto => `{ objects: [...] }`
  const activity = Array.isArray(activityPayload)
    ? activityPayload
    : Array.isArray(activityPayload?.object)
      ? activityPayload.object
      : Array.isArray(activityPayload?.objects)
        ? activityPayload.objects
        : []
  const normalizedActivity = activity.length > 0 ? activity : getEmptyBuckets(range)

  return NextResponse.json(
    {
      totalUsers: data.totalUsers ?? 0,
      totalMessages: data.totalMessages ?? 0,
      totalChats: data.totalChats ?? 0,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      lastMessageAt: data.lastMessageAt ?? null,
      activity: normalizedActivity,
      messageTimes: [],
    },
    { status }
  )
}

function getEmptyBuckets(range: RangeKey) {
  return buildMessageBucketsFromTimes([], range)
}

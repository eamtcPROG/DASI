"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, BarChart3, Clock3, MessageCircleMore, MessagesSquare, Users } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

type RangeKey = "1m" | "1h" | "1d" | "7d" | "30d"

type AnalyticsStats = {
  totalUsers: number
  totalMessages: number
  totalChats: number
  updatedAt: string
  lastMessageAt: string | null
  activity: ActivityPoint[]
}

type ActivityPoint = {
  bucket: string
  messages: number
  users: number
  chats: number
}

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "1m", label: "1m" },
  { key: "1h", label: "1h" },
  { key: "1d", label: "1d" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
]

function getEmptySeries(range: RangeKey): ActivityPoint[] {
  const count =
    range === "1m" || range === "1h" ? 12 : range === "1d" ? 24 : range === "7d" ? 7 : 10

  return Array.from({ length: count }).map((_, index) => ({
    bucket:
      range === "1m"
        ? `${(count - index) * 5}s`
        : range === "1h"
          ? `${(count - index) * 5}m`
          : range === "1d"
            ? `${23 - index}h`
            : range === "7d"
              ? `D-${6 - index}`
              : `W-${9 - index}`,
    messages: 0,
    users: 0,
    chats: 0,
  }))
}

const chartConfig = {
  messages: {
    label: "Messages",
    color: "var(--chart-5)",
  },
  users: {
    label: "Users",
    color: "var(--primary)",
  },
  chats: {
    label: "Chats",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function timeAgo(timestamp: string) {
  const date = new Date(timestamp)
  const diff = Date.now() - date.getTime()

  if (Number.isNaN(diff) || diff < 0) return "just now"

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function AnalyticsPageClient() {
  const [range, setRange] = useState<RangeKey>("1d")
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStats(silent = false) {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const response = await fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Unable to load analytics")
        }
        const data = (await response.json()) as AnalyticsStats
        if (!cancelled) {
          setStats({
            totalUsers: data.totalUsers ?? 0,
            totalMessages: data.totalMessages ?? 0,
            totalChats: data.totalChats ?? 0,
            updatedAt: data.updatedAt ?? new Date().toISOString(),
            lastMessageAt: data.lastMessageAt ?? null,
            activity: data.activity ?? [],
          })
        }
      } catch {
        if (!cancelled) setError("Failed to load analytics data.")
      } finally {
        if (!cancelled && !silent) setLoading(false)
      }
    }

    void loadStats()
    const intervalId = window.setInterval(() => {
      void loadStats(true)
    }, 10000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [range])

  const series = useMemo(() => {
    const real = stats?.activity ?? []
    return real.length > 0 ? real : getEmptySeries(range)
  }, [stats, range])
  const hasActivity = useMemo(
    () => series.some((point) => point.messages > 0 || point.users > 0 || point.chats > 0),
    [series],
  )

  const totalUsers = stats?.totalUsers ?? 0
  const totalMessages = stats?.totalMessages ?? 0
  const totalChats = stats?.totalChats ?? 0
  const messagesPerUser = totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : "0.0"
  const lastUpdated = stats?.updatedAt ? timeAgo(stats.updatedAt) : "n/a"
  const lastMessageActivity = stats?.lastMessageAt ? timeAgo(stats.lastMessageAt) : "no messages yet"

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Analytics unavailable</CardTitle>
          <CardDescription>{error ?? "Please try again in a moment."}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/70 bg-card/75">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Workspace analytics</CardTitle>
            <CardDescription>
              Track users, messaging activity, and recent platform engagement.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.key}
                type="button"
                variant={range === option.key ? "default" : "outline"}
                size="sm"
                className="rounded-xl"
                onClick={() => setRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Total users
            </CardDescription>
            <CardTitle className="text-3xl">{totalUsers.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageCircleMore className="size-4 text-primary" />
              Total messages
            </CardDescription>
            <CardTitle className="text-3xl">{totalMessages.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessagesSquare className="size-4 text-primary" />
              Total chats
            </CardDescription>
            <CardTitle className="text-3xl">{totalChats.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Messages per user
            </CardDescription>
            <CardTitle className="text-3xl">{messagesPerUser}</CardTitle>
            <CardDescription className="flex items-center gap-1 pt-1">
              <Clock3 className="size-3.5" />
              Last update {lastUpdated}
            </CardDescription>
            <CardDescription className="flex items-center gap-1">
              <Clock3 className="size-3.5" />
              Last message {lastMessageActivity}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" />
              Message activity
            </CardTitle>
            <CardDescription>Messages over selected time window</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasActivity ? (
              <p className="mb-3 text-xs text-muted-foreground">
                No activity yet for this range. Send messages or create chats to see bars.
              </p>
            ) : null}
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={series}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="messages" fill="var(--primary)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Activity trend</CardTitle>
            <CardDescription>Stacked trend for messages, users, and chats</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasActivity ? (
              <p className="mb-3 text-xs text-muted-foreground">
                Trend will appear after events are captured in the selected time slot.
              </p>
            ) : null}
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={series}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="chats"
                  stackId="activity"
                  stroke="var(--chart-3)"
                  fill="var(--chart-3)"
                  fillOpacity={0.85}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="activity"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.85}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stackId="activity"
                  stroke="var(--chart-5)"
                  fill="var(--chart-5)"
                  fillOpacity={0.9}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

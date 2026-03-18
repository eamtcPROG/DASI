export const AUTH_COOKIE_NAME = "messenger_session"
export const SESSION_MAX_AGE = 60 * 60

export type MessageDto = {
  message: string
  type?: string
}

export type ResultObjectDto<T> = {
  error: boolean
  htmlcode: number
  object: T | null
  messages: MessageDto[]
}

export type UserDto = {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
}

export type AuthDto = {
  access_token: string
  user: UserDto
}

export type SignInDto = {
  email: string
  password: string
}

export type CreateUserDto = {
  email: string
  password: string
  firstName: string | null
  lastName: string | null
}

export function getResultMessage(
  result: { messages?: MessageDto[] } | null | undefined,
  fallback = "Something went wrong.",
) {
  const message = result?.messages?.find(
    (item) => typeof item.message === "string" && item.message.trim().length > 0,
  )?.message

  return message ?? fallback
}

export function getUserDisplayName(user: UserDto) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || user.email
}

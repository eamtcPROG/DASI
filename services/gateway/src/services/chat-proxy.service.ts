import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { TimeoutError, firstValueFrom, timeout } from "rxjs";
import { ResultObjectDto } from "../dto/resultobject.dto";

export type ChatType =
  | "messages"
  | "users"
  | "general"
  | "rooms"
  | "leave"
  | "members"
  | "stats"
  | "message_times";

@Injectable()
export class ChatProxyService {
  constructor(
    @Inject("CHAT_SERVICE") private readonly chatClient: ClientProxy,
  ) {}

  getChat(type: ChatType, payload?: unknown) {
    return this.request<ResultObjectDto<unknown>>("get_chat", {
      type,
      payload,
    });
  }

  sendChatEvent(event: string, payload: unknown) {
    return this.request<ResultObjectDto<unknown>>("chat_event", {
      event,
      payload,
    });
  }

  private async request<T>(pattern: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.chatClient.send<T, unknown>(pattern, payload).pipe(timeout(5000)),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableException("Chat service timeout");
      }

      if (error instanceof Error) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new ServiceUnavailableException("Chat service unavailable");
    }
  }
}

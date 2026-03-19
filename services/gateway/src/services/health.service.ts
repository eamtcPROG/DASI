import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RealtimeService } from "../realtime/realtime.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getHealth() {
    return {
      status: "ok",
      service: "gateway",
      version: this.configService.get<string>("version") ?? "unknown",
      realtime: this.realtimeService.getStatus(),
    };
  }
}

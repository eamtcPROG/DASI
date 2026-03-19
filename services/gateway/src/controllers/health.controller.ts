import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/public.decorator";
import { HealthService } from "../services/health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get gateway health status" })
  @ApiOkResponse({ description: "Gateway health response" })
  getHealth() {
    return this.healthService.getHealth();
  }
}

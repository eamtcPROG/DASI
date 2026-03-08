import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { ResultObjectDto } from '../dto/resultobject.dto';
import {
  MessageAnalyticsResponseDto,
  UserAnalyticsResponseDto,
  GeneralAnalyticsResponseDto,
} from '../dto/analytics-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get message analytics' })
  @ApiOkResponse({
    type: MessageAnalyticsResponseDto,
    description: 'Message analytics (totals, per day, average length)',
  })
  async getMessageAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getMessageAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiOkResponse({
    type: UserAnalyticsResponseDto,
    description: 'User analytics (totals, active, new this month)',
  })
  async getUserAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getUserAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }

  @Get('general')
  @ApiOperation({ summary: 'Get general platform analytics' })
  @ApiOkResponse({
    type: GeneralAnalyticsResponseDto,
    description: 'General platform analytics (messages, users, uptime)',
  })
  async getGeneralAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getGeneralAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }
}



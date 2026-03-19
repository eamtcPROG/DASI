import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsStatsDto } from '../dto/analytics-stats.dto';
import { AnalyticsActivityDto } from '../dto/analytics-activity.dto';

@ApiTags('Analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOkResponse({ type: AnalyticsStatsDto })
  async getStats(): Promise<AnalyticsStatsDto> {
    return this.analyticsService.getStats();
  }

  @Get('stats/activity')
  @ApiOkResponse({ type: [AnalyticsActivityDto] })
  async getActivity(
    @Query('range') range?: '1m' | '1h' | '1d' | '7d' | '30d',
  ): Promise<AnalyticsActivityDto[]> {
    return this.analyticsService.getActivity(range ?? '1d');
  }

  @Get('stats/message-times')
  @ApiOkResponse({ type: [String] })
  async getMessageTimes(
    @Query('range') range?: '1m' | '1h' | '1d' | '7d' | '30d',
  ): Promise<string[]> {
    return this.analyticsService.getMessageTimes(range ?? '1d');
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { ResultObjectDto } from '../dto/resultobject.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get message analytics' })
  @ApiResponse({
    status: 200,
    description: 'Message analytics retrieved successfully',
  })
  async getMessageAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getMessageAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({
    status: 200,
    description: 'User analytics retrieved successfully',
  })
  async getUserAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getUserAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }

  @Get('general')
  @ApiOperation({ summary: 'Get general platform analytics' })
  @ApiResponse({
    status: 200,
    description: 'General analytics retrieved successfully',
  })
  async getGeneralAnalytics(): Promise<ResultObjectDto<unknown>> {
    const analytics = await this.analyticsService.getGeneralAnalytics();
    return new ResultObjectDto(analytics, false, 200);
  }
}


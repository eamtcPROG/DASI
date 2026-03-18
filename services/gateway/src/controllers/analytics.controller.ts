import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { AnalyticsProxyService } from '../services/analytics-proxy.service';

@ApiTags('Analytics')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({
  type: ResultObjectDto<null>,
  description: 'Invalid or missing token',
})
@UseGuards(JwtGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsProxyService: AnalyticsProxyService,
  ) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get message analytics' })
  @ApiOkResponse({
    type: ResultObjectDto<unknown>,
    description: 'Message analytics response',
  })
  getMessageAnalytics() {
    return this.analyticsProxyService.getAnalytics('messages');
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiOkResponse({
    type: ResultObjectDto<unknown>,
    description: 'User analytics response',
  })
  getUserAnalytics() {
    return this.analyticsProxyService.getAnalytics('users');
  }

  @Get('general')
  @ApiOperation({ summary: 'Get general platform analytics' })
  @ApiOkResponse({
    type: ResultObjectDto<unknown>,
    description: 'General analytics response',
  })
  getGeneralAnalytics() {
    return this.analyticsProxyService.getAnalytics('general');
  }
}

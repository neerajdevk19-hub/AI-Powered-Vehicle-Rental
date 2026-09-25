import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI Assistant')
@Controller('ai')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('confirm-reservation')
  @ApiOperation({ summary: 'Explicitly confirm a server-issued AI booking review' })
  confirm(@Body() dto: ConfirmBookingDto) { return this.aiAgentService.confirmBooking(dto.token); }

  @Post('chat')
  @ApiOperation({ summary: 'Send message to AI assistant with tool calling capabilities' })
  @ApiResponse({ status: 200, description: 'AI assistant natural language response with structured result cards' })
  chat(@Body() dto: ChatRequestDto) {
    return this.aiAgentService.processChat(dto);
  }
}

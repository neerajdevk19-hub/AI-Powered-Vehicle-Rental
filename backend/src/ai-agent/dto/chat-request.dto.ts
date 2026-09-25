import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsIn, ValidateNested, ArrayMaxSize, MaxLength, IsLatitude, IsLongitude } from 'class-validator';

export class ChatMessage {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(12000)
  content: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'Find me an automatic SUV near me for tomorrow under INR 3000 per day', description: 'User message text' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ description: 'Conversation turn history' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  conversationHistory?: ChatMessage[];

  @IsOptional() @IsString() @MaxLength(100)
  selectedVehicleId?: string;

  @ApiPropertyOptional({ example: 'usr-demo-001', description: 'Authenticated User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 22.7196, description: 'User current latitude' })
  @IsOptional()
  @IsLatitude()
  userLat?: number;

  @ApiPropertyOptional({ example: 75.8577, description: 'User current longitude' })
  @IsOptional()
  @IsLongitude()
  userLng?: number;
}

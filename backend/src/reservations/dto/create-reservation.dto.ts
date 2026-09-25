import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'veh-001', description: 'Vehicle ID to reserve' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'usr-demo-001', description: 'User ID (defaults to demo user)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: '2026-09-25T10:00:00Z', description: 'Rental start ISO string' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-09-27T10:00:00Z', description: 'Rental end ISO string' })
  @IsNotEmpty()
  @IsString()
  endDate: string;
}

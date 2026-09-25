import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ example: 'veh-001', description: 'Vehicle ID' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: '2026-09-25T10:00:00Z', description: 'Rental start ISO string' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-09-27T10:00:00Z', description: 'Rental end ISO string' })
  @IsNotEmpty()
  @IsString()
  endDate: string;
}

export class CalculatePriceDto {
  @ApiProperty({ example: 'veh-001', description: 'Vehicle ID' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: '2026-09-25T10:00:00Z', description: 'Rental start ISO string' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-09-27T10:00:00Z', description: 'Rental end ISO string' })
  @IsNotEmpty()
  @IsString()
  endDate: string;
}

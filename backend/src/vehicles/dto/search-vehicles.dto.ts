import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min, Max, IsISO8601 } from 'class-validator';

export class SearchVehiclesDto {
  @ApiPropertyOptional({ example: 22.7196, description: 'Latitude coordinate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: 75.8577, description: 'Longitude coordinate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: 20, description: 'Search radius in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({ example: 'SUV', description: 'Vehicle type: SUV, Sedan, Hatchback, Bike' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Automatic', description: 'Transmission: Automatic or Manual' })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 3000, description: 'Maximum daily rental price in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: '2026-09-25T10:00:00Z', description: 'Rental start date' })
  @IsOptional()
  @IsString()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-27T10:00:00Z', description: 'Rental end date' })
  @IsOptional()
  @IsString()
  @IsISO8601()
  endDate?: string;
}

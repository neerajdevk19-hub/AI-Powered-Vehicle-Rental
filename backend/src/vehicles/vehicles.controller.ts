import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { CheckAvailabilityDto, CalculatePriceDto } from './dto/calculate-price.dto';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search and rank vehicles by GPS location, type, price, transmission, availability' })
  @ApiResponse({ status: 200, description: 'Matching vehicles sorted by AI recommendation score' })
  search(@Query() query: SearchVehiclesDto) {
    return this.vehiclesService.search(query);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed vehicle info by ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check vehicle availability for date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  checkAvailabilityGet(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vehiclesService.checkAvailability(id, startDate, endDate);
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check vehicle availability (POST body)' })
  checkAvailabilityPost(@Body() dto: CheckAvailabilityDto) {
    return this.vehiclesService.checkAvailability(dto.vehicleId, dto.startDate, dto.endDate);
  }

  @Post('calculate-price')
  @ApiOperation({ summary: 'Calculate total rental price including GST and security deposit' })
  calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.vehiclesService.calculatePriceById(dto.vehicleId, dto.startDate, dto.endDate);
  }
}

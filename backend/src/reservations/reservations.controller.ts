import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Vehicle already reserved for dates' })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations for user' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID filter' })
  findAll(@Query('userId') userId?: string) {
    return this.reservationsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation details by ID' })
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }
}

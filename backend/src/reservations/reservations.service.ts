import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(dto: CreateReservationDto, expectedTotal?: number) {
    const userId = 'usr-demo-001';
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for startDate or endDate');
    }

    if (end <= start) {
      throw new BadRequestException('endDate must be strictly greater than startDate');
    }

    const now = new Date();
    if (start < now) {
      throw new BadRequestException('Reservation start date cannot be in the past');
    }

    await this.prisma.user.upsert({
      where: { id: userId }, update: {},
      create: { id: userId, name: 'Alex Sharma', email: 'alex.sharma@example.com' },
    });

    // Check vehicle existence
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle '${dto.vehicleId}' not found`);
    }

    if (vehicle.status !== 'available') throw new ConflictException('Vehicle is not available for rental');

    // Atomic transaction for overlap prevention
    return await this.prisma.$transaction(async (tx) => {
      // Serialize bookings for this vehicle before checking overlap (PostgreSQL row lock).
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${dto.vehicleId} FOR UPDATE`;
      const lockedVehicle = await tx.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!lockedVehicle || lockedVehicle.status !== 'available') throw new ConflictException('Vehicle is unavailable');
      // Check overlap
      const overlap = await tx.reservation.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: 'CONFIRMED',
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (overlap) {
        throw new ConflictException(
          `Vehicle '${vehicle.name}' is already reserved between ${overlap.startTime.toISOString()} and ${overlap.endTime.toISOString()}`,
        );
      }

      // Calculate total price on server
      const priceDetails = this.vehiclesService.calculatePrice(
        vehicle.id,
        lockedVehicle.pricePerDay,
        lockedVehicle.securityDeposit,
        start.toISOString(),
        end.toISOString(),
      );

      if (expectedTotal !== undefined && priceDetails.totalPrice !== expectedTotal) throw new ConflictException('Price changed. Please request a new booking review.');

      const reservation = await tx.reservation.create({
        data: {
          userId,
          vehicleId: dto.vehicleId,
          startTime: start,
          endTime: end,
          totalPrice: priceDetails.totalPrice,
          status: 'CONFIRMED',
        },
        include: {
          vehicle: true,
          user: true,
        },
      });

      return {
        message: 'Reservation created successfully!',
        reservationId: reservation.id,
        status: reservation.status,
        pricing: priceDetails,
        reservation,
      };
    });
  }

  async findAll(userId?: string) {
    const targetUserId = 'usr-demo-001';
    return this.prisma.reservation.findMany({
      where: { userId: targetUserId },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { vehicle: true, user: true },
    });

    if (!reservation || reservation.userId !== 'usr-demo-001') {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }
}

import { rentalPeriod } from '../common/utils/rental-period.util';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { calculateHaversineDistance } from '../common/utils/haversine.util';
import { PythonClientService } from '../python-client/python-client.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pythonClientService: PythonClientService,
  ) {}

  async search(query: SearchVehiclesDto) {
    const userLat = query.lat !== undefined ? Number(query.lat) : 22.7196; // Default Indore City Center
    const userLng = query.lng !== undefined ? Number(query.lng) : 75.8577;
    const radiusKm = query.radiusKm !== undefined ? Number(query.radiusKm) : 50;

    if ((query.lat === undefined) !== (query.lng === undefined)) throw new BadRequestException('Provide both lat and lng');
    if (query.startDate && query.endDate) rentalPeriod(query.startDate, query.endDate);
    if (!!query.startDate !== !!query.endDate) throw new BadRequestException('Provide both startDate and endDate');

    // 1. Fetch raw candidate vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        status: 'available',
        ...(query.type && { type: { equals: query.type, mode: 'insensitive' } }),
        ...(query.transmission && {
          transmission: { equals: query.transmission, mode: 'insensitive' },
        }),
        ...(query.maxPrice !== undefined && { pricePerDay: { lte: Number(query.maxPrice) } }),
      },
    });

    // 2. Filter out vehicles with overlapping reservations for dates
    let availableVehicles = vehicles;
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid startDate or endDate ISO string format');
      }

      if (end <= start) {
        throw new BadRequestException('endDate must be strictly after startDate');
      }

      // Find vehicles that have overlapping active reservations
      const overlappingReservations = await this.prisma.reservation.findMany({
        where: {
          status: 'CONFIRMED',
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
        select: { vehicleId: true },
      });

      const unavailableVehicleIds = new Set(overlappingReservations.map((r) => r.vehicleId));
      availableVehicles = vehicles.filter((v) => !unavailableVehicleIds.has(v.id));
    }

    // 3. Calculate distance from user coordinates & filter by radiusKm
    const candidatesWithDistance = availableVehicles
      .map((v) => {
        const distance = calculateHaversineDistance(userLat, userLng, v.latitude, v.longitude);
        return {
          ...v,
          distanceFromUser: distance,
          isAvailable: true,
        };
      })
      .filter((v) => v.distanceFromUser <= radiusKm);

    if (candidatesWithDistance.length === 0) {
      return [];
    }

    // 4. Send candidate vehicles to Python microservice for AI ranking
    const pythonPayload = {
      preferredType: query.type,
      preferredTransmission: query.transmission,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      userLat,
      userLng,
      candidates: candidatesWithDistance.map((v) => ({
        id: v.id,
        pricePerDay: v.pricePerDay,
        rating: v.rating,
        distanceFromUser: v.distanceFromUser,
        type: v.type,
        transmission: v.transmission,
      })),
    };

    const rankResult = await this.pythonClientService.rankVehicles(pythonPayload);

    // Map scores to results & sort by ranked order
    const scoreMap = rankResult.scores || {};
    const rankedMap = new Map<string, number>();
    rankResult.rankedVehicleIds.forEach((id, index) => {
      rankedMap.set(id, index);
    });

    const finalVehicles = candidatesWithDistance.map((v) => ({
      ...v,
      recommendationScore: scoreMap[v.id] || 0,
    }));

    finalVehicles.sort((a, b) => {
      const rankA = rankedMap.has(a.id) ? rankedMap.get(a.id)! : 999;
      const rankB = rankedMap.has(b.id) ? rankedMap.get(b.id)! : 999;
      return rankA - rankB;
    });

    return finalVehicles;
  }

  async findAll() {
    const userLat = 22.7196;
    const userLng = 75.8577;
    const vehicles = await this.prisma.vehicle.findMany();
    return vehicles.map((v) => ({
      ...v,
      distanceFromUser: calculateHaversineDistance(userLat, userLng, v.latitude, v.longitude),
    }));
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const distanceFromUser = calculateHaversineDistance(22.7196, 75.8577, vehicle.latitude, vehicle.longitude);
    return {
      ...vehicle,
      distanceFromUser,
    };
  }

  async checkAvailability(vehicleId: string, startDateStr: string, endDateStr: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const { start, end } = rentalPeriod(startDateStr, endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    const overlap = await this.prisma.reservation.findFirst({
      where: {
        vehicleId,
        status: 'CONFIRMED',
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });

    return {
      vehicleId,
      vehicleName: vehicle.name,
      isAvailable: !overlap && vehicle.status === 'available',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      message: !overlap && vehicle.status === 'available'
        ? `Vehicle '${vehicle.name}' is AVAILABLE for the requested dates.`
        : `Vehicle '${vehicle.name}' is NOT AVAILABLE for the requested dates due to existing reservation.`,
    };
  }

  calculatePrice(vehicleId: string, vehiclePricePerDay: number, securityDeposit: number, startDateStr: string, endDateStr: string) {
    const { start, end } = rentalPeriod(startDateStr, endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const basePrice = days * vehiclePricePerDay;
    const gstTaxes = Math.round(basePrice * 0.18); // 18% GST
    const totalPayable = basePrice + gstTaxes + securityDeposit;

    return {
      vehicleId,
      days,
      pricePerDay: vehiclePricePerDay,
      basePrice,
      gstTaxes,
      securityDeposit,
      totalPrice: totalPayable,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async calculatePriceById(vehicleId: string, startDateStr: string, endDateStr: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }
    return this.calculatePrice(vehicle.id, vehicle.pricePerDay, vehicle.securityDeposit, startDateStr, endDateStr);
  }
}

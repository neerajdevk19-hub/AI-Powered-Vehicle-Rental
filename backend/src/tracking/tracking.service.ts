import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from './tracking.gateway';

// Closed route offsets around each vehicle's initial pickup point; no cumulative drift.
const ROUTE = [[0, 0], [0.0003, 0.0001], [0.0005, 0.0004], [0.0003, 0.0007], [0, 0.0006], [-0.0002, 0.0003]];
@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private step = 0;
  private origins = new Map<string, { lat: number; lng: number }>();
  constructor(private readonly prisma: PrismaService, private readonly gateway: TrackingGateway) {}
  onModuleInit() {
    if (process.env.GPS_SIMULATION === 'false') return;
    this.timer = setInterval(() => void this.tick(), 3000);
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const vehicles = await this.prisma.vehicle.findMany({ take: 20, orderBy: { id: 'asc' } });
      const shouldSaveToDb = this.step % 100 === 0; // Save DB history snapshot once every 5 minutes (100 ticks x 3s)

      for (const [index, vehicle] of vehicles.entries()) {
        if (!this.origins.has(vehicle.id)) this.origins.set(vehicle.id, { lat: vehicle.latitude, lng: vehicle.longitude });
        const origin = this.origins.get(vehicle.id)!;
        const offset = ROUTE[(this.step + index) % ROUTE.length];
        const lat = Number((origin.lat + offset[0]).toFixed(6));
        const lng = Number((origin.lng + offset[1]).toFixed(6));
        
        // 1. Always broadcast real-time location over WebSockets (every 3s) for smooth map animation
        this.gateway.broadcastLocationUpdate(vehicle.id, lat, lng);

        // 2. Save DB history snapshot only once every 5 minutes
        if (shouldSaveToDb) {
          await this.prisma.$transaction([
            this.prisma.vehicle.update({ where: { id: vehicle.id }, data: { latitude: lat, longitude: lng } }),
            this.prisma.gpsLocation.create({ data: { vehicleId: vehicle.id, latitude: lat, longitude: lng } }),
          ]);
        }
      }

      if (shouldSaveToDb && this.step > 0) {
        this.logger.log(`[GPS Snapshot] Recorded 5-minute DB location history checkpoint for ${vehicles.length} vehicles.`);
      }

      this.step++;
    } catch { this.logger.warn('GPS simulator update failed; retrying next interval'); }
    finally { this.running = false; }
  }
}

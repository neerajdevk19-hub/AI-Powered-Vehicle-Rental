import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { RagModule } from './rag/rag.module';
import { TrackingModule } from './tracking/tracking.module';
import { PythonClientModule } from './python-client/python-client.module';

@Module({
  imports: [
    PrismaModule,
    VehiclesModule,
    ReservationsModule,
    AiAgentModule,
    RagModule,
    TrackingModule,
    PythonClientModule,
  ],
})
export class AppModule {}

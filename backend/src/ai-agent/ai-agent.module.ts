import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [VehiclesModule, ReservationsModule, RagModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}

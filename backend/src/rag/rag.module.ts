import { RagController } from './rag.controller';
import { Module } from '@nestjs/common';
import { RagService } from './rag.service';

@Module({
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}

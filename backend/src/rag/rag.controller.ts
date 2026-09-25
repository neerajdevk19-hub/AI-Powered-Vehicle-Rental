import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { RagService } from './rag.service';

class PolicyQueryDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  query: string;
}

@ApiTags('Rental policies')
@Controller('policies')
export class RagController {
  constructor(private readonly rag: RagService) {}
  @Post('ingest')
  @ApiOperation({ summary: 'Index seeded policies with real sentence embeddings in Qdrant (demo setup)' })
  ingest() { return this.rag.ingestPolicies(); }
  @Post('search')
  @ApiOperation({ summary: 'Retrieve semantic policy sources; the chat agent generates the grounded answer' })
  search(@Body() dto: PolicyQueryDto) { return this.rag.searchRentalPolicy(dto.query); }
}

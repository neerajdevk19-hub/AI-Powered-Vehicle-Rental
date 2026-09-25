import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface PolicyChunkResult {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  chunkIndex: number;
  score: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8002';
  private indexedHash = '';
  private corpusId = '';
  constructor(private readonly prisma: PrismaService) {}

  async ingestPolicies() {
    const policies = await this.prisma.rentalPolicy.findMany({ orderBy: { id: 'asc' } });
    if (!policies.length) throw new ServiceUnavailableException('No rental policies have been loaded.');
    const documents = policies.map(({ id, title, category, content }) => ({ id, title, category, content }));
    const hash = createHash('sha256').update(JSON.stringify(documents)).digest('hex');
    if (hash === this.indexedHash && this.corpusId) return { corpusId: this.corpusId };
    const { data } = await axios.post(`${this.pythonUrl}/rag/ingest`, { documents }, { timeout: 120000 });
    if (typeof data.corpusId !== 'string') throw new Error('Invalid ingestion response');
    this.indexedHash = hash;
    this.corpusId = data.corpusId;
    return data;
  }

  async searchRentalPolicy(query: string): Promise<PolicyChunkResult[]> {
    try {
      const { corpusId } = await this.ingestPolicies();
      const { data } = await axios.post(`${this.pythonUrl}/rag/search`, { query, corpusId }, { timeout: 15000 });
      if (!Array.isArray(data.sources)) throw new Error('Invalid retrieval response');
      return data.sources;
    } catch {
      this.indexedHash = '';
      this.logger.warn('Policy vector retrieval unavailable; no keyword fallback is used.');
      throw new ServiceUnavailableException('Rental policy could not be verified. Please try again later.');
    }
  }
}

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
  private get pythonUrl(): string {
    const raw = process.env.PYTHON_SERVICE_URL || 'http://localhost:8002';
    let url = raw.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    if (!url.includes('.') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = `${url}.onrender.com`;
    }
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
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
    } catch (error) {
      this.indexedHash = '';
      this.logger.warn(`Policy vector retrieval unavailable (${error instanceof Error ? error.message : error}); using database keyword search fallback.`);
      return this.fallbackDbSearch(query);
    }
  }

  private async fallbackDbSearch(query: string): Promise<PolicyChunkResult[]> {
    const policies = await this.prisma.rentalPolicy.findMany();
    if (!policies.length) {
      throw new ServiceUnavailableException('Rental policy could not be verified. Please try again later.');
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 2);

    const scored = policies
      .map((p) => {
        let score = 0;
        const lowerTitle = p.title.toLowerCase();
        const lowerCategory = p.category.toLowerCase();
        const lowerContent = p.content.toLowerCase();

        for (const term of terms) {
          if (lowerCategory.includes(term)) score += 5;
          if (lowerTitle.includes(term)) score += 3;
          if (lowerContent.includes(term)) score += 1;
        }

        return {
          id: p.id,
          category: p.category,
          title: p.title,
          content: p.content,
          source: `rental-policy:${p.id}`,
          chunkIndex: 0,
          score: Math.min(1.0, score / 10),
        };
      })
      .filter((p) => p.score > 0);

    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return scored.slice(0, 3);
    }

    // Fallback: return top policies if query is broad or keyword didn't match exact text
    return policies.slice(0, 2).map((p) => ({
      id: p.id,
      category: p.category,
      title: p.title,
      content: p.content,
      source: `rental-policy:${p.id}`,
      chunkIndex: 0,
      score: 0.5,
    }));
  }
}

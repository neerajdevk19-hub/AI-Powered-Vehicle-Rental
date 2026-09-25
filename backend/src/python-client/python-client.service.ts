import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface RecommendCandidate {
  id: string;
  pricePerDay: number;
  rating: number;
  distanceFromUser: number;
  type: string;
  transmission: string;
}

export interface RecommendRequest {
  preferredType?: string;
  preferredTransmission?: string;
  maxPrice?: number;
  userLat?: number;
  userLng?: number;
  candidates: RecommendCandidate[];
}

export interface RecommendResponse {
  rankedVehicleIds: string[];
  scores: Record<string, number>;
}

@Injectable()
export class PythonClientService {
  private readonly logger = new Logger(PythonClientService.name);
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

  async rankVehicles(payload: RecommendRequest): Promise<{ rankedVehicleIds: string[]; scores: Record<string, number> }> {
    try {
      const response = await axios.post<RecommendResponse>(
        `${this.pythonUrl}/recommend`,
        payload,
        { timeout: 3000 },
      );
      return response.data;
    } catch (error) {
      this.logger.warn(
        `Python recommendation service unavailable at ${this.pythonUrl}. Falling back to default distance-based ranking. Error: ${error.message}`,
      );

      // Fallback scoring logic inside NestJS
      const fallbackScores: Record<string, number> = {};
      const sorted = [...payload.candidates].sort((a, b) => {
        // Simple score formula: rating * 2 - (distance * 0.1) - (price * 0.001)
        const scoreA = a.rating * 2 - a.distanceFromUser * 0.1 - a.pricePerDay * 0.001;
        const scoreB = b.rating * 2 - b.distanceFromUser * 0.1 - b.pricePerDay * 0.001;
        fallbackScores[a.id] = Math.round(scoreA * 100) / 100;
        fallbackScores[b.id] = Math.round(scoreB * 100) / 100;
        return scoreB - scoreA;
      });

      return {
        rankedVehicleIds: sorted.map((v) => v.id),
        scores: fallbackScores,
      };
    }
  }
}

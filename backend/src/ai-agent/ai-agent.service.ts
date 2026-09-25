import { randomUUID } from 'node:crypto';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { SearchVehiclesDto } from '../vehicles/dto/search-vehicles.dto';
import { CheckAvailabilityDto } from '../vehicles/dto/calculate-price.dto';
import { Injectable, Logger, ServiceUnavailableException, BadRequestException, ConflictException } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ReservationsService } from '../reservations/reservations.service';
import { RagService } from '../rag/rag.service';
import { ChatRequestDto } from './dto/chat-request.dto';

const searchVehiclesDeclaration: FunctionDeclaration = {
  name: 'searchVehicles',
  description: 'Search available vehicles by location radius, type (SUV/Sedan/Hatchback/Bike), transmission (Automatic/Manual), max price per day, and rental date range.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      radiusKm: { type: SchemaType.NUMBER, description: 'Search radius in km, default 20' },
      type: { type: SchemaType.STRING, description: 'Vehicle category: SUV, Sedan, Hatchback, Bike' },
      transmission: { type: SchemaType.STRING, description: 'Transmission type: Automatic or Manual' },
      maxPrice: { type: SchemaType.NUMBER, description: 'Maximum price per day in INR' },
      startDate: { type: SchemaType.STRING, description: 'Rental start date ISO string e.g. 2026-09-25T10:00:00Z' },
      endDate: { type: SchemaType.STRING, description: 'Rental end date ISO string e.g. 2026-09-27T10:00:00Z' },
    },
  },
};

const getVehicleDetailsDeclaration: FunctionDeclaration = {
  name: 'getVehicleDetails',
  description: 'Get full details and specifications for a specific vehicle by ID.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vehicleId: { type: SchemaType.STRING, description: 'The unique vehicle ID e.g. veh-001' },
    },
    required: ['vehicleId'],
  },
};

const checkAvailabilityDeclaration: FunctionDeclaration = {
  name: 'checkAvailability',
  description: 'Check if a specific vehicle is available for requested start and end dates.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vehicleId: { type: SchemaType.STRING, description: 'Vehicle ID e.g. veh-001' },
      startDate: { type: SchemaType.STRING, description: 'Rental start date ISO string' },
      endDate: { type: SchemaType.STRING, description: 'Rental end date ISO string' },
    },
    required: ['vehicleId', 'startDate', 'endDate'],
  },
};

const calculateRentalPriceDeclaration: FunctionDeclaration = {
  name: 'calculateRentalPrice',
  description: 'Calculate itemized rental price breakdown including base price, GST, and security deposit.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vehicleId: { type: SchemaType.STRING, description: 'Vehicle ID e.g. veh-001' },
      startDate: { type: SchemaType.STRING, description: 'Rental start date ISO string' },
      endDate: { type: SchemaType.STRING, description: 'Rental end date ISO string' },
    },
    required: ['vehicleId', 'startDate', 'endDate'],
  },
};

const createReservationDeclaration: FunctionDeclaration = {
  name: 'createReservation',
  description: 'Prepare a vehicle booking review. Returns a priced booking review for explicit confirmation. The confirmation action executes reservation creation. Never claim success before confirmation.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      vehicleId: { type: SchemaType.STRING, description: 'Vehicle ID e.g. veh-001' },
      startDate: { type: SchemaType.STRING, description: 'Rental start date ISO string' },
      endDate: { type: SchemaType.STRING, description: 'Rental end date ISO string' },
    },
    required: ['vehicleId', 'startDate', 'endDate'],
  },
};

const searchRentalPolicyDeclaration: FunctionDeclaration = {
  name: 'searchRentalPolicy',
  description: 'Query rental policy knowledge base for Cancellation, Late Return, Insurance, Security Deposit, or Fuel Policy.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: 'Policy question query string' },
    },
    required: ['query'],
  },
};

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly bookingDrafts = new Map<string, { args: any; expiresAt: number; total: number; execution?: Promise<any> }>();

  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly reservationsService: ReservationsService,
    private readonly ragService: RagService,
  ) {}

  async processChat(dto: ChatRequestDto) {
    if ((dto.userLat === undefined) !== (dto.userLng === undefined)) throw new BadRequestException('Provide both location coordinates.');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new ServiceUnavailableException('AI is not configured. Set GEMINI_API_KEY in backend/.env and restart the backend.');
    }
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const history = (dto.conversationHistory || []).slice(-20);
    // The greeting is UI copy, not a previous provider turn. Gemini history starts with a user.
    while (history.length && history[0].role !== 'user') history.shift();
    const contents: any[] = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }],
    }));
    contents.push({ role: 'user', parts: [{ text: dto.message }] });
    const vehicles = new Map<string, any>();
    let policySources: any[] = [];
    let bookingDraft: any = null;
    const toolsCalled: string[] = [];
    const deadline = Date.now() + 90000;
    try {
      for (let turn = 0; turn < 6; turn++) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new ServiceUnavailableException('AI request timed out. Please try again.');
        const { data } = await this.callProvider(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            systemInstruction: { parts: [{ text: `You are DriveAI, a smart vehicle rental assistant.
Use tools for vehicle facts, availability, prices, distance search, and policies. Never fabricate results.
Current time: ${new Date().toISOString()}. Resolve relative dates in Asia/Kolkata (UTC+05:30).
User's active GPS location coordinates: latitude ${dto.userLat ?? 22.7196}, longitude ${dto.userLng ?? 75.8577}.
When the user asks for cars near me, vehicles nearby, closest vehicles, or searches for cars, ALWAYS call the searchVehicles tool immediately using the user's GPS location coordinates. Never say no location was supplied.
If no specific rental dates are mentioned, call searchVehicles without dates to return nearby available vehicles.
Selected vehicle ID (if any): ${dto.selectedVehicleId || "none"}.
Write plain readable text without Markdown formatting.
For every question about cancellation, refunds, late returns, insurance, deposits, or fuel policy, you MUST call searchRentalPolicy before answering. Do not answer policy questions from memory or conversation history. Use only the returned policy sources, cite their titles, and if retrieval fails or returns no sources say the policy could not be verified.
When asked to book a specific vehicle and dates are known, call createReservation. It returns a bookingDraft; ask the user to review its dates and itemized price and press Confirm booking. Do not infer confirmation from conversation text. Never claim a booking exists without a reservation ID.` }] },
            contents,
            generationConfig: { maxOutputTokens: 4096, ...(model.startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING_LEVEL || (model === 'gemini-3.6-flash' ? 'minimal' : 'low') } } : {}) },
            tools: [{ functionDeclarations: [searchVehiclesDeclaration, getVehicleDetailsDeclaration,
              checkAvailabilityDeclaration, calculateRentalPriceDeclaration,
              createReservationDeclaration, searchRentalPolicyDeclaration] }],
          },
          apiKey, deadline,
        );
        const content = data.candidates?.[0]?.content;
        if (!content?.parts?.length) throw new ServiceUnavailableException('AI returned no answer. Please rephrase your request.');
        contents.push(content); // Preserve provider metadata and thought signatures.
        const calls = content.parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
        if (!calls.length) {
          return { reply: content.parts.filter((p: any) => p.text && !p.thought).map((p: any) => p.text).join('\n'),
            vehicles: [...vehicles.values()], policySources, bookingDraft, reservation: null,
            toolCalled: toolsCalled.at(-1) || null, toolsCalled };
        }
        if (calls.length > 8) throw new ServiceUnavailableException('AI requested too many operations. Please simplify your request.');
        const parts: any[] = [];
        for (const call of calls) {
          let result: any;
          try {
            result = await this.executeTool(call.name, call.args || {}, 'usr-demo-001', dto.userLat ?? 22.7196, dto.userLng ?? 75.8577);
            toolsCalled.push(call.name);
            for (const vehicle of result.vehicles || (result.id && result.brand ? [result] : [])) vehicles.set(vehicle.id, vehicle);
            if (result.policySources) policySources = result.policySources;
            if (result.bookingDraft) bookingDraft = result.bookingDraft;
          } catch (error) {
            result = { error: error instanceof BadRequestException ? error.message : 'The requested operation failed. Ask the user to check the inputs or try again. Do not invent a result.' };
          }
          parts.push({ functionResponse: { name: call.name, ...(call.id ? { id: call.id } : {}), response: result } });
        }
        contents.push({ role: 'user', parts });
      }
      throw new ServiceUnavailableException('AI reached its operation limit. Please narrow your request.');
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      this.logger.warn(`Gemini request failed (status ${status || 'network/timeout'}).`);
      throw new ServiceUnavailableException(status === 401 || status === 403 || status === 400
        ? 'Gemini rejected the request. Check the server API key, project access, and model configuration.'
        : status === 429 ? 'Gemini quota is currently exceeded. Please retry later or check the project quota.'
        : status === 404 ? 'The configured Gemini model is unavailable. Update GEMINI_MODEL on the server.'
        : 'Gemini is temporarily unavailable or timed out. Please retry. You can still browse and reserve vehicles.');
    }
  }

  private async callProvider(url: string, payload: unknown, key: string, deadline: number) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await axios.post(url, payload, { headers: { 'x-goog-api-key': key }, timeout: Math.min(35000, Math.max(1, deadline - Date.now())) });
      } catch (error) {
        const retryable = axios.isAxiosError(error) && (!error.response || [429, 500, 502, 503, 504].includes(error.response.status));
        if (!retryable || attempt >= 1 || deadline - Date.now() < 3000) throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  async confirmBooking(token: string) {
    const draft = this.bookingDrafts.get(token);
    if (!draft || draft.expiresAt < Date.now()) throw new BadRequestException('Booking review expired. Ask the assistant for a new review.');
    // Concurrent/repeated button presses share one creation attempt.
    if (!draft.execution) {
      draft.execution = this.executeTool('createReservation', draft.args, 'usr-demo-001', 22.7196, 75.8577, draft.total);
      draft.execution.catch(() => this.bookingDrafts.delete(token));
    }
    return draft.execution;
  }

  private async executeTool(toolName: string, args: any, userId: string, userLat: number, userLng: number, confirmedTotal?: number) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new BadRequestException('Invalid tool arguments');
    const validate = async (dto: object) => {
      try { await validateOrReject(dto, { whitelist: true, forbidNonWhitelisted: true }); }
      catch { throw new BadRequestException('Invalid tool arguments'); }
    };
    if (['checkAvailability', 'calculateRentalPrice', 'createReservation'].includes(toolName)) {
      await validate(plainToInstance(CheckAvailabilityDto, args));
    }
    if (toolName === 'getVehicleDetails' && (typeof args.vehicleId !== 'string' || !args.vehicleId.trim())) throw new BadRequestException('vehicleId is required');
    if (toolName === 'searchRentalPolicy' && (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 2000)) throw new BadRequestException('Policy query is required');
    switch (toolName) {
      case 'searchVehicles': {
        const query = plainToInstance(SearchVehiclesDto, {
          lat: userLat,
          lng: userLng,
          radiusKm: args.radiusKm ?? 30,
          type: args.type,
          transmission: args.transmission,
          maxPrice: args.maxPrice,
          startDate: args.startDate,
          endDate: args.endDate,
        });
        await validate(query);
        const vehicles = await this.vehiclesService.search(query);
        return { count: vehicles.length, vehicles, searchArea: 'Indore demo area unless user coordinates provided' };
      }
      case 'getVehicleDetails': {
        const vehicle = await this.vehiclesService.findOne(args.vehicleId);
        return vehicle;
      }
      case 'checkAvailability': {
        const result = await this.vehiclesService.checkAvailability(args.vehicleId, args.startDate, args.endDate);
        return result;
      }
      case 'calculateRentalPrice': {
        const price = await this.vehiclesService.calculatePriceById(args.vehicleId, args.startDate, args.endDate);
        return price;
      }
      case 'createReservation': {
        // Only the explicit confirmation endpoint can supply confirmedTotal.
        if (confirmedTotal !== undefined) return this.reservationsService.create(args, confirmedTotal);
        const vehicle = await this.vehiclesService.findOne(args.vehicleId);
        const availability = await this.vehiclesService.checkAvailability(args.vehicleId, args.startDate, args.endDate);
        if (!availability.isAvailable) throw new BadRequestException('Vehicle is unavailable for these dates.');
        const pricing = await this.vehiclesService.calculatePriceById(args.vehicleId, args.startDate, args.endDate);
        for (const [token, draft] of this.bookingDrafts) if (draft.expiresAt < Date.now()) this.bookingDrafts.delete(token);
        if (this.bookingDrafts.size >= 1000) throw new BadRequestException('Too many booking reviews. Please try later.');
        const token = randomUUID();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        this.bookingDrafts.set(token, { args: { ...args }, expiresAt, total: pricing.totalPrice });
        return { requiresConfirmation: true, vehicles: [vehicle], bookingDraft: {
          token, expiresAt: new Date(expiresAt).toISOString(), vehicle, pricing,
          startDate: args.startDate, endDate: args.endDate,
        }, message: 'No reservation created yet. Ask the user to review and press Confirm booking.' };
      }
      case 'searchRentalPolicy': {
        const policies = await this.ragService.searchRentalPolicy(args.query);
        return { count: policies.length, policySources: policies };
      }
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

}

import axios from 'axios';
import { AiAgentService } from './ai-agent.service';

jest.mock('axios');
const post = axios.post as jest.Mock;
const response = (parts: any[]) => ({ data: { candidates: [{ content: { role: 'model', parts } }] } });

describe('Gemini agent', () => {
  const vehicles = { search: jest.fn(), findOne: jest.fn(), calculatePriceById: jest.fn(), checkAvailability: jest.fn() };
  const reservations = { create: jest.fn() };
  const rag = { searchRentalPolicy: jest.fn() };
  let service: AiAgentService;
  const oldKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    service = new AiAgentService(vehicles as any, reservations as any, rag as any);
  });
  afterAll(() => {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  });

  it('removes the UI greeting, executes real service tools, and returns vehicle cards', async () => {
    vehicles.search.mockResolvedValue([{ id: 'veh-001', brand: 'Tata', name: 'Nexon' }]);
    post.mockResolvedValueOnce(response([{ functionCall: { name: 'searchVehicles', args: { type: 'SUV' } } }]))
      .mockResolvedValueOnce(response([{ text: 'Found a Nexon.' }]));
    const result = await service.processChat({ message: 'Find an SUV', conversationHistory: [{ role: 'assistant', content: 'Welcome' }] });
    expect(post.mock.calls[0][1].contents[0].role).toBe('user');
    expect(post.mock.calls[0][2].headers['x-goog-api-key']).toBe('test-key');
    expect(vehicles.search).toHaveBeenCalledWith(expect.objectContaining({ type: 'SUV' }));
    expect(result.vehicles[0].id).toBe('veh-001');
  });

  it('rejects invalid tool coordinates/radius without executing a search', async () => {
    post.mockResolvedValueOnce(response([{ functionCall: { name: 'searchVehicles', args: { radiusKm: -10 } } }]))
      .mockResolvedValueOnce(response([{ text: 'Please choose a valid radius.' }]));
    await service.processChat({ message: 'Search' });
    expect(vehicles.search).not.toHaveBeenCalled();
    expect(post.mock.calls[1][1].contents[2].parts[0].functionResponse.response.error).toBe('Invalid tool arguments');
  });

  it('never creates a booking from an LLM tool call', async () => {
    vehicles.checkAvailability.mockResolvedValue({ isAvailable: true });
    vehicles.findOne.mockResolvedValue({ id: 'veh-001' });
    vehicles.calculatePriceById.mockResolvedValue({ totalPrice: 5000 });
    post.mockResolvedValueOnce(response([{ functionCall: { name: 'createReservation', args: {
      vehicleId: 'veh-001', startDate: '2030-01-01T10:00:00Z', endDate: '2030-01-02T10:00:00Z',
    } } }])).mockResolvedValueOnce(response([{ text: 'Review and confirm your booking.' }]));
    const result = await service.processChat({ message: 'Book a car' });
    expect(reservations.create).not.toHaveBeenCalled();
    expect(result.reservation).toBeNull();
    expect(result.vehicles).toEqual([{ id: 'veh-001' }]);
  });

  it('reports provider failure without running keyword fallback or creating a booking', async () => {
    post.mockRejectedValue(new Error('provider unavailable'));
    await expect(service.processChat({ message: 'Book any SUV' })).rejects.toThrow('Gemini is temporarily unavailable');
    expect(vehicles.search).not.toHaveBeenCalled();
    expect(reservations.create).not.toHaveBeenCalled();
  });

  it('caps tool loops', async () => {
    vehicles.search.mockResolvedValue([]);
    post.mockImplementation(async () => response([{ functionCall: { name: 'searchVehicles', args: {} } }]));
    await expect(service.processChat({ message: 'Search' })).rejects.toThrow('operation limit');
    expect(post).toHaveBeenCalledTimes(6);
  });

  it('returns a structured tool error when policy retrieval fails', async () => {
    rag.searchRentalPolicy.mockRejectedValue(new Error('database unavailable'));
    post.mockResolvedValueOnce(response([{ functionCall: { name: 'searchRentalPolicy', args: { query: 'Insurance?' } } }]))
      .mockResolvedValueOnce(response([{ text: 'The policy could not be verified.' }]));
    const result = await service.processChat({ message: 'Insurance?' });
    expect(result.policySources).toEqual([]);
    expect(result.reply).toContain('could not be verified');
  });
  it('creates exactly once only after explicit token confirmation', async () => {
    vehicles.findOne.mockResolvedValue({ id: 'veh-001' });
    vehicles.checkAvailability.mockResolvedValue({ isAvailable: true });
    vehicles.calculatePriceById.mockResolvedValue({ totalPrice: 5000 });
    reservations.create.mockResolvedValue({ reservationId: 'res-1' });
    post.mockResolvedValueOnce(response([{ functionCall: { name: 'createReservation', args: {
      vehicleId: 'veh-001', startDate: '2030-01-01T10:00:00Z', endDate: '2030-01-02T10:00:00Z',
    } } }])).mockResolvedValueOnce(response([{ text: 'Review your booking.' }]));
    const chat = await service.processChat({ message: 'Book veh-001 for those dates' });
    expect(reservations.create).not.toHaveBeenCalled();
    const [a, b] = await Promise.all([service.confirmBooking(chat.bookingDraft.token), service.confirmBooking(chat.bookingDraft.token)]);
    expect(a.reservationId).toBe('res-1'); expect(a).toEqual(b);
    expect(reservations.create).toHaveBeenCalledTimes(1);
    expect(reservations.create.mock.calls[0][1]).toBe(5000);
    await expect(service.confirmBooking('unknown')).rejects.toThrow('expired');
  });

});

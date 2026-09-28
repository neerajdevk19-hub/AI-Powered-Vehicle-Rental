import axios from 'axios';
import { RagService } from './rag.service';
jest.mock('axios');
const post = axios.post as jest.Mock;
describe('Policy RAG client', () => {
  const prisma = { rentalPolicy: { findMany: jest.fn() } };
  beforeEach(() => { jest.resetAllMocks(); prisma.rentalPolicy.findMany.mockResolvedValue([{ id: 'p', title: 'Fuel', category: 'Fuel', content: 'Return full.' }]); });
  it('ingests actual documents and queries the vector corpus; returns metadata', async () => {
    post.mockResolvedValueOnce({ data: { corpusId: 'corpus' } })
      .mockResolvedValueOnce({ data: { sources: [{ id: 'p', source: 'rental-policy:p', score: .8 }] } })
      .mockResolvedValueOnce({ data: { sources: [] } });
    const service = new RagService(prisma as any);
    expect((await service.searchRentalPolicy('Fuel?'))[0].source).toBe('rental-policy:p');
    expect(await service.searchRentalPolicy('Unknown?')).toEqual([]);
    expect(post).toHaveBeenCalledTimes(3);
    expect(post.mock.calls[1][1]).toEqual({ query: 'Fuel?', corpusId: 'corpus' });
  });
  it('falls back to database search when vector store is offline', async () => {
    post.mockRejectedValue(new Error('vector store offline'));
    const service = new RagService(prisma as any);
    const results = await service.searchRentalPolicy('Fuel?');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Fuel');
  });

  it('fails when database has no policies', async () => {
    post.mockRejectedValue(new Error('vector store offline'));
    const emptyPrisma = { rentalPolicy: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new RagService(emptyPrisma as any);
    await expect(service.searchRentalPolicy('Insurance?')).rejects.toThrow('could not be verified');
  });
});

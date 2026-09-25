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
  it('fails closed rather than inventing policy content', async () => {
    post.mockRejectedValue(new Error('vector store offline'));
    await expect(new RagService(prisma as any).searchRentalPolicy('Insurance?')).rejects.toThrow('could not be verified');
  });
});

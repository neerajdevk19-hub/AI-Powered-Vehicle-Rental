import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AiAgentController } from '../src/ai-agent/ai-agent.controller';
import { AiAgentService } from '../src/ai-agent/ai-agent.service';

describe('AI HTTP request validation (provider mocked)', () => {
  let app: INestApplication;
  const ai = { processChat: jest.fn().mockResolvedValue({ reply: 'Checked', vehicles: [] }), confirmBooking: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [AiAgentController], providers: [{ provide: AiAgentService, useValue: ai }] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(async () => app.close());
  it('rejects invalid coordinates before provider execution', async () => {
    await request(app.getHttpServer()).post('/ai/chat').send({ message: 'Search', userLat: 200, userLng: 75 }).expect(400);
    expect(ai.processChat).not.toHaveBeenCalled();
  });
  it('rejects fabricated confirmation tokens', async () => {
    await request(app.getHttpServer()).post('/ai/confirm-reservation').send({ token: 'yes' }).expect(400);
    expect(ai.confirmBooking).not.toHaveBeenCalled();
  });
  it('accepts well-formed chat history', async () => {
    await request(app.getHttpServer()).post('/ai/chat').send({ message: 'Search', conversationHistory: [{ role: 'user', content: 'SUV' }] }).expect(201);
    expect(ai.processChat).toHaveBeenCalledTimes(1);
  });
});

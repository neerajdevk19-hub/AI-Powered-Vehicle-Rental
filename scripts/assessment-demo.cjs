/* Live assessment: real Gemini, PostgreSQL, Python embeddings/Qdrant and Socket.IO.
   Creates only an isolated test vehicle and removes its own records in finally. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
process.loadEnvFile(resolve(__dirname, '../backend/.env'));
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const { io } = require('../frontend/node_modules/socket.io-client');
const prisma = new PrismaClient();
const base = process.env.DEMO_API_URL || 'http://localhost:3000';
const id = 'assessment-' + randomUUID();
const report = [];
const step = (name, data = {}) => { report.push({ name, ...data }); console.log(JSON.stringify({ name, ...data })); };
async function api(path, body, expected = 201) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(150000) });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
  return data;
}
(async () => {
  try {
    await prisma.vehicle.create({ data: { id, name: 'Assessment automatic SUV', brand: 'Demo', type: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', seatingCapacity: 5,
      pricePerDay: 2500, securityDeposit: 2000, status: 'available', latitude: 22.7196, longitude: 75.8577, location: 'Indore demo center', rating: 4.8 } });
    const start = new Date(Date.now() + 7 * 86400000); start.setUTCHours(4, 30, 0, 0);
    const end = new Date(start.getTime() + 86400000);
    const dates = { vehicleId: id, startDate: start.toISOString(), endDate: end.toISOString() };
    const chat = await api('/ai/chat', { message: `Find automatic SUVs near me under INR 3000 per day for ${dates.startDate} to ${dates.endDate}.`, userLat: 22.7196, userLng: 75.8577 });
    assert(chat.toolsCalled.includes('searchVehicles'));
    assert(chat.vehicles.some(v => v.id === id));
    assert(chat.vehicles.every(v => v.transmission === 'Automatic' && v.pricePerDay <= 3000 && v.distanceFromUser <= 30));
    step('Natural-language GPS search', { vehicles: chat.vehicles.length, tools: chat.toolsCalled });
    const vehicle = await api(`/vehicles/${id}`, undefined, 200);
    assert.equal(vehicle.id, id);
    const availability = await api('/vehicles/check-availability', dates);
    assert(availability.isAvailable);
    const price = await api('/vehicles/calculate-price', dates);
    assert.equal(price.totalPrice, 4950);
    step('Details, availability and server pricing', { total: price.totalPrice });
    const booking = await api('/ai/chat', { message: `Book vehicle ${id} for ${dates.startDate} to ${dates.endDate}. Prepare the confirmation review.`, selectedVehicleId: id });
    assert(booking.bookingDraft?.token, 'LLM must prepare a booking review');
    assert.equal(await prisma.reservation.count({ where: { vehicleId: id } }), 0);
    const confirmed = await api('/ai/confirm-reservation', { token: booking.bookingDraft.token });
    assert.equal(confirmed.reservation.vehicleId, id);
    const repeated = await api('/ai/confirm-reservation', { token: booking.bookingDraft.token });
    assert.equal(repeated.reservationId, confirmed.reservationId);
    step('LLM booking review and explicit confirmation', { reservationId: confirmed.reservationId });
    await api('/reservations', dates, 409);
    const concurrentDates = { ...dates, startDate: new Date(end.getTime() + 86400000).toISOString(), endDate: new Date(end.getTime() + 2 * 86400000).toISOString() };
    const attempts = await Promise.all([0, 1].map(() => fetch(base + '/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(concurrentDates) })));
    assert.deepEqual(attempts.map(r => r.status).sort(), [201, 409]);
    const filtered = await api(`/vehicles/search?lat=22.7196&lng=75.8577&startDate=${dates.startDate}&endDate=${dates.endDate}`, undefined, 200);
    assert(!filtered.some(v => v.id === id));
    step('Overlap and simultaneous booking protection', { statuses: attempts.map(r => r.status) });
    const policy = await api('/ai/chat', { message: 'If I cancel my rental more than 24 hours before pickup, do I get my money back? Use the rental policy knowledge base.' });
    assert(policy.toolsCalled.includes('searchRentalPolicy'));
    assert(policy.policySources.length > 0);
    assert(policy.policySources.some(p => p.category === 'Cancellation'));
    step('Embedding + Qdrant + grounded Gemini policy answer', { answer: policy.reply, sources: policy.policySources.map(p => ({ source: p.source, score: p.score })) });
    await new Promise((resolve, reject) => {
      const socket = io(base, { transports: ['websocket'] });
      let previous;
      const timer = setTimeout(() => { socket.disconnect(); reject(new Error('No moving GPS events')); }, 15000);
      socket.on('vehicleLocationUpdate', update => {
        if (update.vehicleId !== id) return;
        if (previous && (previous.lat !== update.lat || previous.lng !== update.lng)) {
          clearTimeout(timer); socket.disconnect(); step('Live Socket.IO location movement', { from: previous, to: update }); resolve();
        }
        previous = update;
      });
    });
    require('node:fs').writeFileSync(resolve(__dirname, '../docs/assessment-evidence.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), report }, null, 2));
    step('PASS: all live assessment stages');
  } finally {
    await prisma.gpsLocation.deleteMany({ where: { vehicleId: id } });
    await prisma.reservation.deleteMany({ where: { vehicleId: id } });
    await prisma.vehicle.deleteMany({ where: { id } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

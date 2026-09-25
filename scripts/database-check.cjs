const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
process.loadEnvFile(resolve(__dirname, '../backend/.env'));
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const id = 'assessment-db-' + randomUUID();
const base = process.env.DEMO_API_URL || 'http://localhost:3000';
async function post(path, body) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  return { status: response.status, data: await response.json() };
}
(async () => {
  try {
    await prisma.vehicle.create({ data: { id, name: 'Concurrency test SUV', brand: 'Demo', type: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', pricePerDay: 2500, securityDeposit: 2000, latitude: 22.7196, longitude: 75.8577, location: 'Indore', status: 'available' } });
    const start = new Date(Date.now() + 50 * 86400000).toISOString();
    const end = new Date(Date.parse(start) + 86400000).toISOString();
    const input = { vehicleId: id, startDate: start, endDate: end };
    assert.equal((await post('/vehicles/calculate-price', input)).data.totalPrice, 4950);
    const results = await Promise.all([post('/reservations', input), post('/reservations', input)]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(await prisma.reservation.count({ where: { vehicleId: id } }), 1);
    assert.equal((await post('/vehicles/check-availability', input)).data.isAvailable, false);
    assert.equal((await post('/reservations', { ...input, startDate: '2000-01-01T00:00:00Z', endDate: '2000-01-02T00:00:00Z' })).status, 400);
    const query = new URLSearchParams({ lat: '22.7196', lng: '75.8577', radiusKm: '5', startDate: start, endDate: end });
    const vehicles = await (await fetch(base + '/vehicles/search?' + query)).json();
    assert(!vehicles.some(v => v.id === id));
    const far = await (await fetch(base + '/vehicles/search?lat=0&lng=0&radiusKm=1')).json();
    assert.equal(far.length, 0);
    assert.equal((await fetch(base + '/vehicles/search?lat=95&lng=75')).status, 400);
    console.log('PASS: real PostgreSQL concurrent bookings [201,409], overlap exclusion, past dates, pricing, GPS radius, coordinate validation');
  } finally {
    await prisma.gpsLocation.deleteMany({ where: { vehicleId: id } });
    await prisma.reservation.deleteMany({ where: { vehicleId: id } });
    await prisma.vehicle.deleteMany({ where: { id } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

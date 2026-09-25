import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
process.loadEnvFile(resolve('../backend/.env'));
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const db = new PrismaClient();
let id: string;
test.beforeEach(async () => {
  id = '0-browser-' + randomUUID();
  await db.vehicle.create({ data: { id, name: 'Browser assessment SUV', brand: 'Demo', type: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', seatingCapacity: 5,
    pricePerDay: 2500, securityDeposit: 2000, latitude: 22.7196, longitude: 75.8577, location: 'Indore demo center', status: 'available', rating: 4.8 } });
});
test.afterEach(async () => {
  await db.gpsLocation.deleteMany({ where: { vehicleId: id } });
  await db.reservation.deleteMany({ where: { vehicleId: id } });
  await db.vehicle.deleteMany({ where: { id } });
});
test.afterAll(async () => db.$disconnect());

test('chat cards → actual availability/price/booking → live map movement', async ({ page, request }) => {
  // Only the external LLM response is mocked. Vehicle data, booking and GPS are real.
  const vehicle = await (await request.get(`http://localhost:3000/vehicles/${id}`)).json();
  await page.route('**/ai/chat', route => route.fulfill({ json: { reply: 'Here is an actual database vehicle for your trip.', vehicles: [vehicle], toolsCalled: ['searchVehicles'], toolCalled: 'searchVehicles' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'AI Assistant', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message the AI assistant' }).fill('Find automatic SUVs near me under 3000');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Here is an actual database vehicle for your trip.')).toBeVisible();
  await page.getByRole('button', { name: 'Reserve', exact: true }).click();
  const start = new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10) + 'T10:00';
  const end = new Date(Date.now() + 36 * 86400000).toISOString().slice(0, 10) + 'T10:00';
  await page.getByLabel('Pickup date and time').fill(start);
  await page.getByLabel('Return date and time').fill(end);
  await page.getByRole('button', { name: 'Check Dates' }).click();
  await expect(page.getByText(/is AVAILABLE for the requested dates/)).toBeVisible();
  const confirm = page.getByRole('button', { name: 'Confirm Reservation (₹4950)' });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible();
  expect(await db.reservation.count({ where: { vehicleId: id } })).toBe(1);
  await page.getByRole('button', { name: 'Track Vehicle Live' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  const latitude = page.getByText(/^Latitude:/);
  await expect(latitude).toBeVisible();
  const before = await latitude.textContent();
  await expect.poll(() => latitude.textContent(), { timeout: 15000 }).not.toBe(before);
  await page.screenshot({ path: '../docs/assessment-tracking.png', fullPage: true });
});

test('mobile location control and navigation remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Pickup area').selectOption('Palasia, Indore');
  await expect(page.getByText(/22.7244, 75.8839/)).toBeVisible();
  await page.getByRole('button', { name: 'Vehicles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'All Rental Vehicles' })).toBeVisible();
  await expect(page.getByLabel('Filter pickup time')).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
  await page.screenshot({ path: '../docs/assessment-mobile.png', fullPage: true });
});

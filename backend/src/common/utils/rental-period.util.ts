import { BadRequestException } from '@nestjs/common';
export function rentalPeriod(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new BadRequestException('Invalid rental date');
  if (end <= start) throw new BadRequestException('Return time must be after pickup time');
  if (start.getTime() < Date.now()) throw new BadRequestException('Pickup time must be in the future');
  return { start, end };
}

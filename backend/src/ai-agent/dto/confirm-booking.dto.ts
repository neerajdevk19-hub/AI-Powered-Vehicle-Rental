import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ConfirmBookingDto {
  @ApiProperty({ description: 'One-time review token returned by the createReservation tool' })
  @IsUUID() token: string;
}

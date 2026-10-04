import { IsIn } from 'class-validator';

export const RIDER_ORDER_STATUS_UPDATES = ['picked_up', 'delivered'] as const;
export type RiderOrderStatusUpdate =
  (typeof RIDER_ORDER_STATUS_UPDATES)[number];

export class UpdateOrderStatusDto {
  @IsIn(RIDER_ORDER_STATUS_UPDATES)
  status!: RiderOrderStatusUpdate;
}

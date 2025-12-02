import { IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  buildingId: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(2020)
  year: number;

  @IsNumber()
  @Min(0)
  priceSnapshot: number;

  @IsOptional()
  @IsString()
  observations?: string;
}

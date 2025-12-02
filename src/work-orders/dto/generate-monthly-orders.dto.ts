import { IsNumber, Min, Max } from 'class-validator';

export class GenerateMonthlyOrdersDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(2020)
  year: number;
}

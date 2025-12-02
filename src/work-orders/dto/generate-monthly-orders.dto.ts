import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateMonthlyOrdersDto {
  @ApiProperty({
    description: 'Month to generate work orders for (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Year to generate work orders for',
    example: 2024,
    minimum: 2020,
  })
  @IsNumber()
  @Min(2020)
  year: number;
}

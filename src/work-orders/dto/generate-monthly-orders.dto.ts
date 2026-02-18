import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateMonthlyOrdersDto {
  @ApiProperty({
    description: 'Mes para generar órdenes de trabajo (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Año para generar órdenes de trabajo',
    example: 2024,
    minimum: 2020,
  })
  @IsNumber()
  @Min(2020)
  year: number;
}

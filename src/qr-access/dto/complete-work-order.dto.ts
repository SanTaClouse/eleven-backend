import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteWorkOrderDto {
  @ApiPropertyOptional({
    description: 'Observaciones del trabajo realizado',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}

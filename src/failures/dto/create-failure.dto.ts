import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFailureDto {
  @ApiProperty({ description: 'Descripción de la falla' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: 'Nombre del reportante (opcional para anónimos)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reporterName?: string;
}

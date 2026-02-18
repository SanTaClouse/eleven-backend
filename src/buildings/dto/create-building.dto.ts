import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBuildingDto {
  @ApiProperty({
    description: 'Nombre del edificio',
    example: 'CAM2',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Dirección del edificio',
    example: 'Av. Corrientes 1234, Piso 5',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'Precio mensual de mantenimiento',
    example: 1500.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Número de paradas del edificio',
    example: 12,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stops: number;

  @ApiProperty({
    description: 'Cantidad de ascensores en el edificio',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  elevatorsCount: number;

  @ApiPropertyOptional({
    description: 'Cantidad de montacoches',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carLifts?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de portones',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gates?: number;

  @ApiPropertyOptional({
    description: 'Notas u observaciones adicionales',
    example: 'El edificio requiere acceso especial los fines de semana',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Si el edificio está activo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'UUID del cliente propietario de este edificio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  clientId: string;
}

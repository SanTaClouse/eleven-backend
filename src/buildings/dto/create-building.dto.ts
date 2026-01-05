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
    description: 'Building name',
    example: 'CAM2',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Building address',
    example: '456 Oak Avenue, Building 5, Floor 12',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'Monthly maintenance price',
    example: 1500.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Number of stops (paradas) in the building',
    example: 12,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stops: number;

  @ApiProperty({
    description: 'Number of elevators in the building',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  elevatorsCount: number;

  @ApiPropertyOptional({
    description: 'Number of car lifts (montacoches)',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carLifts?: number;

  @ApiPropertyOptional({
    description: 'Number of gates (portones)',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gates?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Building requires special access on weekends',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the client is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Client UUID that owns this building',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  clientId: string;
}

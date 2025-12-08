import {
  IsString,
  IsEmail,
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
    description: 'Building address',
    example: '456 Oak Avenue, Building 5, Floor 12',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({
    description: 'Building contact phone',
    example: '+1234567890',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Building contact email',
    example: 'admin@building456.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Monthly maintenance price',
    example: 1500.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Number of floors in the building',
    example: 12,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  floorsCount?: number;

  @ApiPropertyOptional({
    description: 'Number of elevators in the building',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  elevatorsCount?: number;

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

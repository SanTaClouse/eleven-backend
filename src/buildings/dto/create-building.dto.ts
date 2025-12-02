import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  @MaxLength(255)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  floorsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  elevatorsCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  clientId: string;
}

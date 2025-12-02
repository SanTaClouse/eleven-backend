import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;
}

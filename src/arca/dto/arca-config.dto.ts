import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveArcaConfigDto {
  @ApiProperty({ description: 'CUIT de ELEVEN sin guiones (11 dígitos)', example: '20123456789' })
  @IsString()
  @Length(11, 11, { message: 'El CUIT debe tener exactamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'El CUIT debe contener solo números' })
  cuit: string;

  @ApiProperty({ description: 'Razón social de ELEVEN', example: 'Juan Pérez' })
  @IsString()
  razonSocial: string;

  @ApiPropertyOptional({ description: 'Domicilio fiscal de ELEVEN' })
  @IsOptional()
  @IsString()
  domicilioFiscal?: string;

  @ApiProperty({ description: 'Número de punto de venta habilitado en ARCA', example: 1 })
  @IsInt()
  @Min(1)
  puntoVenta: number;

  @ApiProperty({ description: 'Certificado X.509 en formato PEM' })
  @IsString()
  certificado: string;

  @ApiProperty({ description: 'Clave privada en formato PEM' })
  @IsString()
  clavePrivada: string;

  @ApiPropertyOptional({ description: 'true = producción, false = homologación', default: false })
  @IsOptional()
  @IsBoolean()
  produccion?: boolean;
}

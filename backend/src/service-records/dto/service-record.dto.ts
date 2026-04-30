import {
  IsEnum, IsNotEmpty, IsOptional, IsString,
  IsUUID, IsDateString, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ServiceType } from '../enums/service-type.enum';

export class CreateServiceRecordDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  tipo_servicio: ServiceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 250.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costo: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  fecha_servicio: string;

  @ApiPropertyOptional({ example: '2024-04-15' })
  @IsOptional()
  @IsDateString()
  proximo_servicio_estimado?: string;
}

export class UpdateServiceRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  costo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proximo_servicio_estimado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  recordatorio_enviado?: boolean;
}

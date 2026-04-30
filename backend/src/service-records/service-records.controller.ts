import {
  Controller, Get, Post, Patch, Body,
  Param, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiceRecordsService } from './service-records.service';
import { CreateServiceRecordDto, UpdateServiceRecordDto } from './dto/service-record.dto';

@ApiTags('Servicios')
@Controller('service-records')
export class ServiceRecordsController {
  constructor(private readonly serviceRecordsService: ServiceRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar servicio realizado' })
  create(@Body() dto: CreateServiceRecordDto) {
    return this.serviceRecordsService.create(dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Estadísticas del dashboard' })
  getDashboard() {
    return this.serviceRecordsService.getDashboardStats();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Servicios próximos (30 días)' })
  getUpcoming() {
    return this.serviceRecordsService.findUpcoming();
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Historial de servicios de un vehículo' })
  findByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.serviceRecordsService.findByVehicle(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRecordsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceRecordDto) {
    return this.serviceRecordsService.update(id, dto);
  }
}

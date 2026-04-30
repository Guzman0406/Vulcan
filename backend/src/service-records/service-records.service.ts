import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { ServiceRecordEntity } from './service-record.entity';
import { CreateServiceRecordDto, UpdateServiceRecordDto } from './dto/service-record.dto';
import { VehiclesService } from '../vehicles/vehicles.service';

@Injectable()
export class ServiceRecordsService {
  constructor(
    @InjectRepository(ServiceRecordEntity)
    private readonly recordRepo: Repository<ServiceRecordEntity>,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(dto: CreateServiceRecordDto): Promise<ServiceRecordEntity> {
    const vehicle = await this.vehiclesService.findOne(dto.vehicleId);
    const record = this.recordRepo.create({
      tipo_servicio: dto.tipo_servicio,
      descripcion: dto.descripcion,
      costo: dto.costo,
      fecha_servicio: new Date(dto.fecha_servicio),
      proximo_servicio_estimado: dto.proximo_servicio_estimado
        ? new Date(dto.proximo_servicio_estimado)
        : null,
      vehicle,
    });
    return this.recordRepo.save(record);
  }

  async findByVehicle(vehicleId: string): Promise<ServiceRecordEntity[]> {
    return this.recordRepo.find({
      where: { vehicle: { id: vehicleId } },
      order: { fecha_servicio: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServiceRecordEntity> {
    const record = await this.recordRepo.findOne({
      where: { id },
      relations: ['vehicle', 'vehicle.customer'],
    });
    if (!record) throw new NotFoundException(`Registro ${id} no encontrado`);
    return record;
  }

  async findPendingReminders(): Promise<ServiceRecordEntity[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return this.recordRepo.find({
      where: {
        recordatorio_enviado: false,
        proximo_servicio_estimado: Between(today, nextWeek),
      },
      relations: ['vehicle', 'vehicle.customer'],
    });
  }

  async findUpcoming(): Promise<ServiceRecordEntity[]> {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    return this.recordRepo.find({
      where: {
        proximo_servicio_estimado: Between(today, nextMonth),
      },
      relations: ['vehicle', 'vehicle.customer'],
      order: { proximo_servicio_estimado: 'ASC' },
    });
  }

  async markReminderSent(id: string): Promise<void> {
    await this.recordRepo.update(id, {
      recordatorio_enviado: true,
      fecha_recordatorio_enviado: new Date(),
    });
  }

  async update(id: string, dto: UpdateServiceRecordDto): Promise<ServiceRecordEntity> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    if (dto.proximo_servicio_estimado) {
      record.proximo_servicio_estimado = new Date(dto.proximo_servicio_estimado);
    }
    return this.recordRepo.save(record);
  }

  async getDashboardStats() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalClientes, serviciosMes, pendientes, ingresosMes] = await Promise.all([
      this.recordRepo.manager.getRepository('customers').count(),
      this.recordRepo.count({
        where: { fecha_servicio: MoreThanOrEqual(startOfMonth) },
      }),
      this.findPendingReminders(),
      this.recordRepo
        .createQueryBuilder('sr')
        .select('SUM(sr.costo)', 'total')
        .where('sr.fecha_servicio >= :start', { start: startOfMonth })
        .getRawOne(),
    ]);

    return {
      totalClientes,
      serviciosMes,
      recordatoriosPendientes: pendientes.length,
      ingresosMes: parseFloat(ingresosMes?.total || '0'),
    };
  }
}

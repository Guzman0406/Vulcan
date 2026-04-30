import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,
    private readonly customersService: CustomersService,
  ) {}

  async create(dto: CreateVehicleDto): Promise<VehicleEntity> {
    const customer = await this.customersService.findOne(dto.customerId);
    const vehicle = this.vehicleRepo.create({
      marca: dto.marca,
      modelo: dto.modelo,
      año: dto.año,
      placa: dto.placa,
      color: dto.color,
      customer,
    });
    return this.vehicleRepo.save(vehicle);
  }

  async findByCustomer(customerId: string): Promise<VehicleEntity[]> {
    return this.vehicleRepo.find({
      where: { customer: { id: customerId } },
      relations: ['serviceRecords'],
      order: { fecha_registro: 'DESC' },
    });
  }

  async findOne(id: string): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id },
      relations: ['customer', 'serviceRecords'],
    });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleEntity> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepo.remove(vehicle);
  }
}

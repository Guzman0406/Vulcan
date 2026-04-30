import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CustomerEntity } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    const telefono = dto.telefono.replace(/\D/g, '');
    const exists = await this.customerRepo.findOne({ where: { telefono } });
    if (exists) {
      throw new ConflictException(
        `Ya existe un cliente con el teléfono ${telefono}`,
      );
    }
    const customer = this.customerRepo.create({ ...dto, telefono });
    return this.customerRepo.save(customer);
  }

  async findAll(): Promise<CustomerEntity[]> {
    return this.customerRepo.find({
      relations: ['vehicles'],
      order: { fecha_registro: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['vehicles', 'vehicles.serviceRecords'],
    });
    if (!customer) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return customer;
  }

  async findByTelefono(telefono: string): Promise<CustomerEntity> {
    const clean = telefono.replace(/\D/g, '');
    const customer = await this.customerRepo.findOne({
      where: { telefono: clean },
      relations: ['vehicles'],
    });
    if (!customer)
      throw new NotFoundException(`No existe cliente con teléfono ${telefono}`);
    return customer;
  }

  async search(query: string): Promise<CustomerEntity[]> {
    return this.customerRepo.find({
      where: [
        { nombre: ILike(`%${query}%`) },
        { telefono: ILike(`%${query}%`) },
      ],
      relations: ['vehicles'],
      take: 20,
    });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepo.remove(customer);
  }
}

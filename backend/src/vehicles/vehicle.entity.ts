import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { ServiceRecordEntity } from '../service-records/service-record.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  marca: string;

  @Column({ type: 'varchar', length: 50 })
  modelo: string;

  @Column({ type: 'int' })
  año: number;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  placa: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_registro: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.vehicles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;

  @OneToMany(() => ServiceRecordEntity, (record) => record.vehicle, {
    cascade: true,
  })
  serviceRecords: ServiceRecordEntity[];
}

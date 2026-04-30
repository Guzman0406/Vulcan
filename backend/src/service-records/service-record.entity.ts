import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { VehicleEntity } from '../vehicles/vehicle.entity';
import { ServiceType } from './enums/service-type.enum';

@Entity('service_records')
export class ServiceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ServiceType })
  tipo_servicio: ServiceType;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo: number;

  @Column({ type: 'date' })
  fecha_servicio: Date;

  @Column({ type: 'date', nullable: true })
  proximo_servicio_estimado: Date;

  @Column({ type: 'boolean', default: false })
  recordatorio_enviado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_recordatorio_enviado: Date;

  @CreateDateColumn({ type: 'timestamp' })
  fecha_creacion: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.serviceRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: VehicleEntity;
}

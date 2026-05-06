import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Twilio } from 'twilio';
import { ServiceRecordsService } from '../service-records/service-records.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioClient: Twilio;
  private readonly fromNumber: string;
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceRecordsService: ServiceRecordsService,
  ) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
    this.n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
    if (sid && token) {
      this.twilioClient = new Twilio(sid, token);
    }
  }

  @Cron('0 9 * * *')
  async sendDailyReminders() {
    const pendientes = await this.serviceRecordsService.findPendingReminders();
    this.logger.log(`Encontrados ${pendientes.length} recordatorios pendientes`);

    for (const record of pendientes) {
      const customer = record.vehicle?.customer;
      if (!customer?.telefono) continue;

      const payload = {
        serviceRecordId: record.id,
        nombre: customer.nombre,
        telefono: customer.telefono,
        marca: record.vehicle.marca,
        modelo: record.vehicle.modelo,
        tipo_servicio: record.tipo_servicio.replace(/_/g, ' '),
        proximo_servicio: new Date(record.proximo_servicio_estimado).toLocaleDateString('es-MX', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      };

      try {
        if (this.n8nWebhookUrl) {
          await fetch(this.n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          this.logger.log(`Enviado a N8n: ${customer.nombre}`);
        } else {
          await this.sendViaTwilio(customer.telefono, payload);
        }
        await this.serviceRecordsService.markReminderSent(record.id);
      } catch (error) {
        this.logger.error(`Error: ${error.message}`);
      }
    }
  }

  async sendManualReminder(serviceRecordId: string): Promise<{ success: boolean; message: string }> {
    const record = await this.serviceRecordsService.findOne(serviceRecordId);
    const customer = record.vehicle?.customer;
    if (!customer?.telefono) return { success: false, message: 'Sin teléfono' };

    const payload = {
      serviceRecordId: record.id,
      nombre: customer.nombre,
      telefono: customer.telefono,
      marca: record.vehicle.marca,
      modelo: record.vehicle.modelo,
      tipo_servicio: record.tipo_servicio.replace(/_/g, ' '),
      proximo_servicio: record.proximo_servicio_estimado
        ? new Date(record.proximo_servicio_estimado).toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : 'próximamente',
    };

    try {
      if (this.n8nWebhookUrl) {
        await fetch(this.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await this.serviceRecordsService.markReminderSent(record.id);
        return { success: true, message: `Recordatorio enviado a ${customer.nombre}` };
      } else {
        await this.sendViaTwilio(customer.telefono, payload);
        await this.serviceRecordsService.markReminderSent(record.id);
        return { success: true, message: `Recordatorio enviado a ${customer.nombre}` };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  private async sendViaTwilio(telefono: string, payload: any) {
    if (!this.twilioClient) return;
    const mensaje = `Hola ${payload.nombre} 👋\n\nTe recordamos que tu *${payload.marca} ${payload.modelo}* tiene programado un servicio de *${payload.tipo_servicio}* aproximadamente el *${payload.proximo_servicio}*.\n\n📍 Visítanos en nuestra vulcanizadora.\n\n_Mensaje automático._`;
    await this.twilioClient.messages.create({
      from: this.fromNumber,
      to: `whatsapp:+52${telefono}`,
      body: mensaje,
    });
  }
}
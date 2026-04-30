import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Twilio } from 'twilio';
import { ServiceRecordsService } from '../service-records/service-records.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioClient: Twilio;
  private readonly fromNumber: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceRecordsService: ServiceRecordsService,
  ) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_FROM');

    if (sid && token) {
      this.twilioClient = new Twilio(sid, token);
    } else {
      this.logger.warn('Twilio no configurado — recordatorios deshabilitados');
    }
  }

  @Cron('0 9 * * *')
  async sendDailyReminders() {
    this.logger.log('Ejecutando scheduler de recordatorios...');

    if (!this.twilioClient) {
      this.logger.warn('Twilio no configurado, saltando recordatorios');
      return;
    }

    const pendientes = await this.serviceRecordsService.findPendingReminders();
    this.logger.log(`Encontrados ${pendientes.length} recordatorios pendientes`);

    for (const record of pendientes) {
      const customer = record.vehicle?.customer;
      if (!customer?.telefono) continue;

      const mensaje = this.buildMessage(
        customer.nombre,
        record.vehicle.marca,
        record.vehicle.modelo,
        record.proximo_servicio_estimado,
        record.tipo_servicio,
      );

      try {
        await this.twilioClient.messages.create({
          from: this.fromNumber,
          to: `whatsapp:+52${customer.telefono}`,
          body: mensaje,
        });

        await this.serviceRecordsService.markReminderSent(record.id);
        this.logger.log(`Recordatorio enviado a ${customer.nombre} (${customer.telefono})`);
      } catch (error) {
        this.logger.error(
          `Error enviando a ${customer.telefono}: ${error.message}`,
        );
      }
    }
  }

  async sendManualReminder(serviceRecordId: string): Promise<{ success: boolean; message: string }> {
    if (!this.twilioClient) {
      return { success: false, message: 'Twilio no configurado' };
    }

    const record = await this.serviceRecordsService.findOne(serviceRecordId);
    const customer = record.vehicle?.customer;

    if (!customer?.telefono) {
      return { success: false, message: 'Cliente sin teléfono registrado' };
    }

    const mensaje = this.buildMessage(
      customer.nombre,
      record.vehicle.marca,
      record.vehicle.modelo,
      record.proximo_servicio_estimado,
      record.tipo_servicio,
    );

    try {
      await this.twilioClient.messages.create({
        from: this.fromNumber,
        to: `whatsapp:+52${customer.telefono}`,
        body: mensaje,
      });

      await this.serviceRecordsService.markReminderSent(record.id);
      return { success: true, message: `Recordatorio enviado a ${customer.nombre}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  private buildMessage(
    nombre: string,
    marca: string,
    modelo: string,
    fecha: Date,
    tipo: string,
  ): string {
    const fechaStr = new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const tipoLabel = tipo.replace(/_/g, ' ');

    return (
      `Hola ${nombre} 👋\n\n` +
      `Te recordamos que tu *${marca} ${modelo}* tiene programado un servicio de *${tipoLabel}* ` +
      `aproximadamente el *${fechaStr}*.\n\n` +
      `📍 Visítanos en nuestra vulcanizadora. Con gusto te atendemos.\n\n` +
      `_Este es un mensaje automático. Responde este mensaje si deseas agendar._`
    );
  }
}

import { Controller, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send/:serviceRecordId')
  @ApiOperation({ summary: 'Enviar recordatorio manual por WhatsApp' })
  sendManual(@Param('serviceRecordId', ParseUUIDPipe) id: string) {
    return this.notificationsService.sendManualReminder(id);
  }

  @Post('run-scheduler')
  @ApiOperation({ summary: 'Ejecutar scheduler manualmente' })
  runScheduler() {
    return this.notificationsService.sendDailyReminders();
  }
}

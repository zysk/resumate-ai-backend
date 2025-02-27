import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
@Module({
  controllers: [],
  providers: [EmailService],
})
export class EmailServiceModule {}

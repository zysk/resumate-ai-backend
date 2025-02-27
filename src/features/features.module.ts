import { Module } from '@nestjs/common';
import { PdfExtractionModule } from './pdf-extraction/pdf-extraction.module';
import { MulterModule } from '@nestjs/platform-express';
import { EmailServiceModule } from './email-service/email-service.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports:[    MulterModule.register({
    dest: './uploads',
  }),
  PdfExtractionModule,
  EmailServiceModule,
  AuthModule,],
  controllers: [],
  providers: [],
})
export class FeaturesModule {}

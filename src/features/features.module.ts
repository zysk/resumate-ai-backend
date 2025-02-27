import { Module } from '@nestjs/common';
import { PdfExtractionModule } from './pdf-extraction/pdf-extraction.module';
import { MulterModule } from '@nestjs/platform-express';
import { EmailServiceModule } from './email-service/email-service.module';

@Module({
  imports:[    MulterModule.register({
    dest: './uploads',
  }),
  PdfExtractionModule,
  EmailServiceModule,],
  controllers: [],
  providers: [],
})
export class FeaturesModule {}

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfExtractionModule } from './pdf-extraction/pdf-extraction.module';
import { EmailServiceModule } from './email-service/email-service.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads' }), // File upload config
    PdfExtractionModule, 
    EmailServiceModule, 
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class FeaturesModule {}

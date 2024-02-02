import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfExtractionModule } from './pdf-extraction/pdf-extraction.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    PdfExtractionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

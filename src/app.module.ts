import { Module } from '@nestjs/common';
import { FeaturesModule } from './features/features.module';

@Module({
  imports: [
    FeaturesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

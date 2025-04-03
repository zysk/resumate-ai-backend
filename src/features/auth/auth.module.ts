import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ExtractDataSchema } from '../pdf-extraction/schema/extract_data';
import { AdminModelSchema } from '../pdf-extraction/schema/admin_register';
import { UserSchema } from '../pdf-extraction/schema/user';
import { ExtractDataModel } from '../pdf-extraction/schema/extract_data';
import { AdminModel } from '../pdf-extraction/schema/admin_register';
import { User } from '../pdf-extraction/schema/user';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ExtractDataModel.name, schema: ExtractDataSchema },
      { name: AdminModel.name, schema: AdminModelSchema }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

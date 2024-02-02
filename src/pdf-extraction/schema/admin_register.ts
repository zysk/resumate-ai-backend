import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AdminModel extends Document {


  @Prop()
  firstName:string

@Prop()
lastName:string
  @Prop()
  email: string;

  @Prop()
  password:string;



  @Prop({default:null})
  phone:string


  @Prop({ type: Date, default: Date.now })
  createdAt: Date;



  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const AdminModelSchema = SchemaFactory.createForClass(AdminModel);

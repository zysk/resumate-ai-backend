import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum UserStatus {

    New = "New",
    InProgress = "InProgress",
    Shortlisted = "Shortlisted",
    OnHold = "OnHold",
    Selected = "Selected",
    Rejected = "Rejected",
    InterviewScheduled = "InterviewScheduled"
}

@Schema()
export class User extends Document {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  place: string;

  @Prop()
  skills: Array<string>;

  @Prop()
  score: string;

  @Prop()
  suitable_role: string;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.New })
  status: UserStatus;

  @Prop({default:null})
  comments: string;


  @Prop({type:Object,default:null})
  wordCloud:any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: object;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

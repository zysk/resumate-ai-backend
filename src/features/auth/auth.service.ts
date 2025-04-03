import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AdminModel } from '../pdf-extraction/schema/admin_register';
import { Model } from "mongoose";
import { User, UserStatus } from "../pdf-extraction/schema/user";
import * as jwt from "jsonwebtoken"; 



@Injectable()
export class AuthService {
  constructor(

      @InjectModel(User.name) private userModel: Model<User>,
      @InjectModel(AdminModel.name) private adminModel: Model<AdminModel>,
  ){}
  async signUp(body) {
    const { firstName, lastName, email, password } = body;

    try {
      // Create a new instance of AdminModel using the provided body data
      const admin = new this.adminModel({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      });

      // Save the new admin user to the database
      const result = await admin.save();

      // Return the saved admin user or a success message
      return result;
    } catch (error) {
      // Handle any errors that may occur during signup
      console.error("Error during sign-up:", error.message);
      throw new Error("Sign-up failed.");
    }
  }
  async login(email: string, password: string) {
    try {
        const user = await this.adminModel.findOne({ email, password }).exec();
        if (user) {
          // Generate a JWT token upon successful login
          const token = jwt.sign({ userId: user._id }, "your-secret-key", {
            expiresIn: "100h", // Set the token expiration time as per your requirement
          });
    
          return { token };
        } else {
          return null;
        }
      
    } catch (error) {
      console.error('Login Service Error:', error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



}

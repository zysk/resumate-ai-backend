import { Injectable, NotFoundException } from "@nestjs/common";
import * as pdf from "pdf-parse";
import * as AWS from "aws-sdk";
import OpenAI from "openai";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ExtractDataModel } from "./schema/extract_data";
import { User, UserStatus } from "./schema/user";
import { AdminModel } from "./schema/admin_register";
import * as jwt from "jsonwebtoken"; 
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import { listenerCount } from "process";
import { retry } from "rxjs";
import { error } from "console";
import {StatusDto} from '../pdf-extraction/dto/create-pdf-extraction.dto'
import { json } from "stream/consumers";
import { Cron } from '@nestjs/schedule';
import { MailService } from "./email.service";

@Injectable()
export class PdfExtractionService {
  private s3: AWS.S3;

  private openAi: OpenAI;

  constructor(
    @InjectModel(ExtractDataModel.name)
    private extractDataModel: Model<ExtractDataModel>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(AdminModel.name) private adminModel: Model<AdminModel>,
    private mailService: MailService
  ) { 
    this.s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

    
    this.openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }


  async extractTextFromPdf(buffer: Buffer, originalname: string): Promise<any> {
    const data = await pdf(buffer);
    const resumeText = data.text;
    
    // Extract email using a regular expression
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
    const emailMatch = resumeText.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : null;

    // Generate a unique key for the S3 object
    const key = `ai/${Date.now()}-${originalname}`;

    // Upload the file to S3 using the generated key
    const s3UploadResponse: ManagedUpload.SendData = await this.uploadToS3(buffer, key);

    // Store the data in your database
    const store = new this.extractDataModel({
      email,
      data: resumeText,
      s3Url: s3UploadResponse.Location,
      createdAt: new Date(),
      deletedAt: null,
    });

    const result = await store.save();

    return result;
  }

  async uploadToS3(file: Buffer, key: string): Promise<ManagedUpload.SendData> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: 'pushai-test-bucket',
      Key: key, // Use the generated key
      Body: file,
    };

    return this.s3.upload(params).promise();
  }



  async gptReview(email: string): Promise<any> {
    try {

      console.log(email);
      

      const data = await this.extractDataModel.findOne({ email: email });

      const resumeText = data.data;

      type Message = {
        role: "system" | "user" | "assistant" | "function";
        content: string;
    };
      const messages: Message[] = [
        {
            role: "system",
            content:
            "You are a sophisticated AI capable of evaluating resumes. Please review the given resume thoroughly, taking into account skills, work experience, projects, and other significant factors. Provide a score out of 100. Additionally, extract key details such as name, email, phone number, and place. When detailing skills, list each skill as a separate object within the 'skills' array, using the format: 'skills': [{ skill: 'HTML', score: 85 }, { skill: 'CSS', score: 80 }, ...]. Determine the most suitable_role for the candidate. Also, generate a word cloud object representing skills and their respective scores. Compile all the information in a structured JSON format, using keys such as 'suitable_role'.",
          },
        {
            role: "user",
            content: `Here's the resume: ${resumeText}. I rely on your expertise to give a comprehensive review.`,
        },
        {
            role: "system",
            content:
                "Understood. I will review and analyze the resume based on the mentioned criteria and provide a detailed evaluation.",
        },
    ];

      const completion = await this.openAi.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo-16k-0613",
        temperature: 0.5,
      });

      const assistantResponse = completion.choices[0].message.content;

      // console.log("------------------>", assistantResponse);

      const saveResponse = await this.storeGptResponseInDb(assistantResponse);

      console.log("content-1-score");
      return "saved the score successfully"
    } catch (error) {
      console.error("An error occurred while reviewing the resume:", error);
      // You can also throw the error or handle it differently if required.
    }
  }

  async storeGptResponseInDb(assistantResponse): Promise<any> {
    // Parse and structure the GPT response
    const data = JSON.parse(assistantResponse);

    // Use the userModel to save the data in MongoDB
    const saveInDb = new this.userModel({
      name: data.name,
      email: data.email,
      phone: data.phone,
      place: data.place,
      skills: data.skills,
      score: data.score,
      suitable_role: data.suitable_role,
      // wordCloud:data.word_cloud,
      // data: data,
    });
console.log("saveInDb---------------",saveInDb);

    const result = await saveInDb.save();
    return result;
  }






async listOfDataScores(){
  try {
    const dataScores = await this.userModel.find({ isDeleted: false });
    return dataScores;
  } catch (error) {
    console.error("Error fetching data scores:", error);
  throw error; 
  }
}



  async fetchEmails() {
    try {
      const emails = await this.extractDataModel.find({}, "email");
      return emails;
    } catch (error) {
      return error;
    }
  }



  async fetchS3Link(email:string) {
    try {
      const emailsAndUrls = await this.extractDataModel.findOne({email:email}, { email: 1, s3Url: 1, _id: 0 });
      return emailsAndUrls;
    } catch (error) {
      return error;
    }
}


async deleteScoreData(email: string) {
  try {
      const result = await this.userModel.deleteMany({ email: email });

      if (result.deletedCount === 0) {
          return { message: "User not found" };
      }

      return {
          statusCode: "204",
          message: "Deleted Successfully"
      };

  } catch (error) {
      console.error(error); // Log the error for debugging
      return { message: "An error occurred", error: error.message };
  }
}



async fetchAdminData(){
  try{


    const AdminData = await this.adminModel.find()


  }catch(error){
    return error
  }
}


async updateStatusAndComment({ email: userEmail, status: userStatus, comments }: StatusDto) {
  try {
    const updated = await this.userModel.findOneAndUpdate(
      { email: userEmail },
      { status: userStatus, comments },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    const { name, email, status, suitable_role } = updated;
    await this.mailService.sendEmail(name, email, status, suitable_role);

    return { message: `Mail sent to ${name}` };
  } catch (error) {
    console.error("Error updating status and comment:", error);
    throw error;
  }
}


  // const candidatesData = await this.userModel.find()



//! Aanatha
//   async  chatBot(question) {
//     const { days, skills } = question;

//     type Message = {
//         role: "system" | "user" | "assistant" | "function";
//         content: string;
//     };

//     const messages: Message[] = [
//         {
//             role: "system",
//             content: "You are an AI skilled at planning learning tasks. I'll provide you with a number of days and a set of skills. For each day, generate a task in the format of an array of objects. Each object should have a 'day' field and a 'content to cover' field, which represents what to learn on that day. give the response in the json , that will be array of objects"
//         },
//         {
//             role: "user",
//             content: `I have ${days} days to learn the following skills: ${skills.join(', ')}. Please provide a schedule for me in the specified format. The format should look like this: [{day: 'Day 1', 'content to cover': 'Skill topic'}]`
//         },
//         {
//             role: "system",
//             content: "Understood. I'll generate a schedule based on the provided days and skills in the format you mentioned."
//         },
//     ];

//     const completion = await this.openAi.chat.completions.create({
//         messages,
//         model: "gpt-3.5-turbo-16k-0613",
//         temperature: 0.5,
//     });

//     const assistantResponse = completion.choices[0].message.content;

// console.log(assistantResponse);


//     return assistantResponse
    
//     // If the assistant response is a string representation of a JSON, parse it
//     try {
//         // return JSON.parse(assistantResponse);
//     } catch (error) {
//         // If there's an error parsing, return the original response
//         return assistantResponse;
//     }
// }


async chatBot(question) {
  try {
      type Message = {
          role: "system" | "user" | "assistant" | "function";
          content: string;
      };

      const candidatesData = await this.userModel.find();

      if (!candidatesData) {
          throw new Error("Failed to fetch candidates data.");
      }


      const messages: Message[] = [
        {
            role: "system",
            content: "You are a sophisticated AI capable of matching data according to the given query. Please review the given query thoroughly and compile all the information in a structured JSON format.and match the prompt question with the suitable role in the give  candidatesData",
        },
        {
            role: "user",
            content: `Here's the question: ${question}. This is the data of the candidate: ${JSON.stringify(candidatesData)}`,
        },
    ];

    
      const completion = await this.openAi.chat.completions.create({
          messages,
          model: "gpt-3.5-turbo-16k-0613",
          temperature: 0.5,
      });

      const assistantResponse = completion.choices[0].message.content;
      console.log(assistantResponse);

      return assistantResponse;

  } catch (error) {
      console.error(error);
      return error.message;
  }
}


@Cron('0 9 * * *') // This will run every day at 9 AM
async checkAndNotifyHR() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const usersToNotify = await this.userModel.find({
    status: UserStatus.New,
    createdAt: { $lt: twoDaysAgo },
    isDeleted: false
  }).exec();

  for (const user of usersToNotify) {
    // Send notification to HR for each user
    this.notifyHR(user);
  }
}

notifyHR(user: User) {
  // Logic to send a notification to HR.
  // This could be an email, SMS, or any other form of notification.
}










  async testMyApi() {
    return "Hello World! from resumer ai";
  }

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
    const user = await this.adminModel.findOne({ email, password }).exec();
    if (user) {
      // Generate a JWT token upon successful login
      const token = jwt.sign({ userId: user._id }, "your-secret-key", {
        expiresIn: "1h", // Set the token expiration time as per your requirement
      });

      return { token };
    } else {
      return null;
    }
  }
}

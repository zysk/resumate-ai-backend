// pdf.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfExtractionService } from './pdf-extraction.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';
import {StatusDto} from "../pdf-extraction/dto/create-pdf-extraction.dto"
@Controller('pdf')
export class PdfController {
  private s3: AWS.S3;

  constructor(private readonly pdfExtractionService: PdfExtractionService) {
   
  }




//! SIGN-UP
@Post('sign-up')
  async signUp(@Body() body: any): Promise<any> {
    return await this.pdfExtractionService.signUp(body);
  
}


//! LOGIN
@Post('login') 
  async login(@Body() body: any): Promise<any> {
    try {
      const user = await this.pdfExtractionService.login(body.email, body.password);

      if (user) {
        return user;
      } else {
        throw new Error('Authentication failed. Invalid credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      throw new Error('Login failed.');
    }
  }


//! Using this Apis
@Post('extract-texts')
  @UseInterceptors(FilesInterceptor('files'))
  async extractTexts(
    @UploadedFiles() files,
  ): Promise<{ filename: string; text: string; s3Url: string }[]> {

console.log(files);


    const extractedData = await Promise.all(
      files.map(async (file) => {
        // Generate a unique key for the S3 object
        const key = `ai/${Date.now()}-${file.originalname}`;

        // Extract text from the PDF file
        const text = await this.pdfExtractionService.extractTextFromPdf(file.buffer, file.originalname);

        // Upload the file to S3 using the generated key
        const s3UploadResponse: ManagedUpload.SendData = await this.pdfExtractionService.uploadToS3(
          file.buffer,
          key,
        );
console.log(file.originalname);

        return {
          filename: file.originalname,
          text,
          s3Url: s3UploadResponse.Location, // Store the S3 URL in the response
        };
      }),
    );
    return extractedData;
  }






//!- list of emails
@Get('fetch-emails')
async fetchEmails(): Promise<any> {
  
    return  await this.pdfExtractionService.fetchEmails();
  
}

//! final apis
@Post('generate-score')
async testResponse(@Query('email')email:string): Promise<any> {
console.log(email);

  return  await this.pdfExtractionService.gptReview(email);

}

@Get('list-scores')
async listOfDataScores(){
  return await this.pdfExtractionService.listOfDataScores()
}




@Get('list-S3')
async fetchS3Link(@Query('email')email:string){
  return await this.pdfExtractionService.fetchS3Link(email)
}


@Delete('delete-user-score')
async deleteScoreData(@Query('email')email:string){
  return await this.pdfExtractionService.deleteScoreData(email)
}


@Put('update-status/comments')
async updateStatusAndComment(@Body()statusDto:StatusDto){
  
  return await this.pdfExtractionService.updateStatusAndComment(statusDto)

}



@Post('chat-bot')
async chatBot(@Body()question:string): Promise<any> {
  
    return  await this.pdfExtractionService.chatBot(question);
  
}



@Get('health-check')
async testMyApi(): Promise<any> {
  
    return  await this.pdfExtractionService.testMyApi();
  
}





}






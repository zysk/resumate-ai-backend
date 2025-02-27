import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { UserStatus } from '../pdf-extraction/schema/user';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            // use your email service provider's SMTP configuration
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: process.env.SMTP_USER,
              pass:process.env.SMTP_PASSWORD
            }
        });
    }

    async sendEmail(name: string, email: string, status: UserStatus, role: string) {
        let subject, text;

        if (status === UserStatus.Shortlisted) {
            subject = 'You have been shortlisted';
            text = `Hi ${name}, congratulations! You have been shortlisted for the role of ${role}.`;
        } else if (status === UserStatus.InterviewScheduled) {  // Use correct enum value
            subject = 'Interview Scheduled';
            text = `Hi ${name}, congratulations! Your interview has been scheduled for the role of ${role}.`;
        } else {
            // Other statuses or default behavior can be added here
            return;  // Don't send email for other statuses
        }

        const mailOptions = {
            from: '"Your Name" <pujakumari@zysk.tech>',
            to: email,
            subject,
            text
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
}

export const sendEmail = async (
    to: SendEmailOptions["to"],
    subject: SendEmailOptions["subject"],
    text: SendEmailOptions["text"]
): Promise<void> => {
    const mailOptions: {
        from: string | undefined;
        to: string;
        subject: string;
        text: string;
    } = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    await transporter.sendMail(mailOptions);
    
};


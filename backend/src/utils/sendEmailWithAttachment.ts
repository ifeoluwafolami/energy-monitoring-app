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

interface SendEmailWithAttachmentOptions {
  to: string | string[]; // Accept single or multiple emails
  subject: string;
  text: string;
  attachmentBuffer: Buffer | ArrayBufferLike;
  filename: string;
}

export const sendEmailWithAttachment = async ({
  to,
  subject,
  text,
  attachmentBuffer,
  filename,
}: SendEmailWithAttachmentOptions): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: Array.isArray(to) ? to.join(", ") : to, // Convert array to comma-separated string
    subject,
    text,
    attachments: [
      {
        filename,
        content: Buffer.isBuffer(attachmentBuffer)
          ? attachmentBuffer
          : Buffer.from(attachmentBuffer as ArrayBufferLike),
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

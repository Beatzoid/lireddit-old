import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        to,
        subject,
        html
    });
}

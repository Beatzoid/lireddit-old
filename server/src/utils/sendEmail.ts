import nodemailer from "nodemailer";
import { EMAIL, EMAIL_PASSWORD } from "../privateConstants";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: EMAIL,
            pass: EMAIL_PASSWORD
        }
    });

    let info = await transporter.sendMail({
        from: '"LiReddit" <lireddit7@gmail.com>',
        to: to,
        subject: "Change password",
        html
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

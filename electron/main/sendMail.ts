import { ipcMain } from "electron";
import nodemailer from "nodemailer";

const mailConfigArray = [
  {
    key: "1",
    host: "smtp.gmail.com",
    port: 587,
  },
  {
    key: "2",
    host: "smtp-mail.outlook.com",
    port: 587,
  },
  {
    key: "3",
    host: "smtp-mail.outlook.com",
    port: 587,
  },
];

function main(
  type: string,
  user: string,
  pass: string,
  to: string,
  subject: string,
  html: string
) {
  return new Promise((resolve, reject) => {
    const mailConfig = mailConfigArray.find((item) => item.key === type);

    if (!mailConfig) {
      throw Error("doNotSupportThisMailbox");
    }

    let transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      requireTLS: true,
      auth: {
        user,
        pass,
      },
    });

    let mailOptions = {
      from: user,
      to,
      subject,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info.response);
      }
    });
  });
}

ipcMain.handle(
  "sendMail",
  async (
    _event,
    type: string,
    user: string,
    pass: string,
    to: string,
    subject: string,
    html: string
  ) => {
    try {
      const res = await main(type, user, pass, to, subject, html);
      return res;
    } catch (error) {
      return JSON.stringify(error);
    }
  }
);

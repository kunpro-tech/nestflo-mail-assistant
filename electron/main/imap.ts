import { ipcMain } from "electron";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const mailConfigArray = [
  {
    key: "1",
    host: "imap.gmail.com",
    port: 993,
  },
  {
    key: "2",
    host: "outlook.office365.com",
    port: 993,
  },
  {
    key: "3",
    host: "outlook.office365.com",
    port: 993,
  },
];

// 获取新邮件
async function main(
  type: string,
  user: string,
  pass: string,
  count: number,
  totalCount: number
) {
  const mailConfig = mailConfigArray.find((item) => item.key === type);

  if (!mailConfig) {
    throw Error("doNotSupportThisMailbox");
  }

  const client = new ImapFlow({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: true,
    auth: {
      user,
      pass,
    },
    logger: false,
  });

  client.on("error", (err) => {
    console.log(`imap Error occurred: ${err.message}`);
  });

  await client.connect();

  let lock = await client.getMailboxLock("INBOX");

  const messageArray = [];
  try {
    for await (let message of client.fetch(
      `${totalCount}:${totalCount - count}`,
      { envelope: true, source: true }
    )) {
      const res = await simpleParser(message.source);
      messageArray.push({
        ...message,
        analyticalResults: res,
      });
    }
  } finally {
    lock.release();
  }
  await client.logout();

  return messageArray;
}

// 获取邮件总数量
async function getEmailCount(type: string, user: string, pass: string) {
  const mailConfig = mailConfigArray.find((item) => item.key === type);

  if (!mailConfig) {
    throw Error("doNotSupportThisMailbox");
  }

  const client = new ImapFlow({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: true,
    auth: {
      user,
      pass,
    },
    logger: false,
  });

  client.on("error", (err) => {
    console.log(`imap Error occurred: ${err.message}`);
  });

  await client.connect();

  let lock = await client.getMailboxLock("INBOX");

  let length = typeof client.mailbox === "boolean" ? 0 : client.mailbox.exists;

  lock.release();

  await client.logout();

  return length;
}

ipcMain.handle(
  "getTheLatestEmail",
  async (
    _event,
    type: string,
    user: string,
    pass: string,
    count: number,
    totalCount: number
  ) => {
    try {
      const res = await main(type, user, pass, count, totalCount);
      return res;
    } catch (error) {
      return JSON.stringify(error);
    }
  }
);

ipcMain.handle(
  "totalNumberOfEmails",
  async (_event, type: string, user: string, pass: string) => {
    try {
      const res = await getEmailCount(type, user, pass);
      return res;
    } catch (error) {
      return JSON.stringify(error);
    }
  }
);

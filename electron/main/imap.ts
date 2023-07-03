import { ipcMain } from "electron";
import { FetchMessageObject, ImapFlow } from "imapflow";
import { ParsedMail, simpleParser } from "mailparser";
import log from "electron-log";
import { gql } from "@apollo/client";
import { sendMail } from "./sendMail";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import Store from "electron-store";

const store = new Store();

const client = new ApolloClient({
  uri: import.meta.env.VITE_BASE_URL,
  cache: new InMemoryCache(),
});

const ADD_MAIL = gql`
  mutation CreateLeadsForApp($input: NewEmailLeadsInput!) {
    createLeadsForApp(input: $input) {
      email_id
      replies {
        body
        subject
      }
      to
    }
  }
`;

type TMailItem = FetchMessageObject & {
  analyticalResults: ParsedMail;
};

let Timer: NodeJS.Timer | null = null;

let emailTypeGlobal: string;

let emailGlobal: string;

let passGlobal: string;

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

const addMailPromise = (item: TMailItem) => {
  return new Promise<void>((resolve) => {
    const kunproKey = store.get("kunproKey") || "";

    client
      .mutate({
        variables: {
          input: {
            email_id: item.emailId,
            html_body: item.analyticalResults.html,
            subject: item.envelope.subject,
            text_body: item.analyticalResults.text,
            date: item.envelope.date.getTime().toString(),
            from_email: item.envelope.from[0].address,
            token: kunproKey,
          },
        },
        mutation: ADD_MAIL,
      })
      .then(async (data) => {
        try {
          const {
            createLeadsForApp: { to, replies },
          } = data.data;

          for (const item of replies) {
            const { body, subject } = item;
            await sendMail(
              emailTypeGlobal,
              emailGlobal,
              passGlobal,
              to,
              subject,
              body
            );
          }

          resolve();
        } catch (error) {
          console.log(error);
          log.error(JSON.stringify(error));

          resolve();
        }
      })
      .catch((error) => {
        console.log(error);

        log.error(JSON.stringify(error));

        resolve();
      });
  });
};

const delayPromise = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

// 初始检查前50封邮件
async function initialInspection() {
  try {
    const numberOfCacheMail = Number(store.get("numberOfCacheMail"));

    const newMailArray: TMailItem[] = await main(
      emailTypeGlobal,
      emailGlobal,
      passGlobal,
      49,
      numberOfCacheMail
    );

    for (const item of newMailArray) {
      if (
        ["no-reply@expert.onthemarket.com", "members@zoopla.co.uk"].includes(
          item.envelope.from[0].address || ""
        )
      ) {
        await addMailPromise(item);
        await delayPromise(2000);
      }
    }
    store.set("InitiallyChecked", "yes");
  } catch (error) {
    log.error(JSON.stringify(error));
  }
}

// 每十分钟检查一次邮件数量
async function checkTheNewMail() {
  try {
    const numberOfCacheMail = Number(store.get("numberOfCacheMail"));

    const res = await getEmailCount(emailTypeGlobal, emailGlobal, passGlobal);

    store.set("numberOfCacheMail", String(res));

    // 对比出新邮件
    if (res > numberOfCacheMail) {
      const newMailArray: TMailItem[] = await main(
        emailTypeGlobal,
        emailGlobal,
        passGlobal,
        res - numberOfCacheMail - 1,
        res
      );

      for (const item of newMailArray) {
        if (
          ["no-reply@expert.onthemarket.com", "members@zoopla.co.uk"].includes(
            item.envelope.from[0].address || ""
          )
        ) {
          await addMailPromise(item);
          await delayPromise(2000);
        }
      }
    }
  } catch (error) {
    log.error(JSON.stringify(error));
  }
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

ipcMain.handle(
  "startTask",
  async (
    _event,
    emailType: string,
    email: string,
    pass: string,
    kunproKey: string
  ) => {
    try {
      emailTypeGlobal = emailType;
      emailGlobal = email;
      passGlobal = pass;

      store.set("kunproKey", String(kunproKey));

      const res = await getEmailCount(emailType, email, pass);

      store.set("numberOfCacheMail", String(res));

      if (!(store.get("InitiallyChecked") === "yes")) {
        initialInspection();
      }

      if (!Timer) {
        Timer = setInterval(() => {
          checkTheNewMail();
        }, 1 * 60 * 1000);
      }
    } catch (error) {
      console.log(error);

      log.error(JSON.stringify(error));
    }
  }
);

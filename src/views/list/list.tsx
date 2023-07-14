import React, { useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import { message } from "antd";
import { gql, useMutation } from "@apollo/client";
import { FetchMessageObject } from "imapflow";
import log from "electron-log";

import { ParsedMail } from "mailparser";

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

function List() {
  const emailType = localStorage.getItem("emailType") || "";

  const email = localStorage.getItem("email") || "";

  const pass = localStorage.getItem("pass") || "";

  const kunproKey = localStorage.getItem("kunproKey") || "";

  const [Timer, setTimer] = useState<NodeJS.Timer | null>(null);

  const [messageApi, contextHolder] = message.useMessage();

  const [addMail] = useMutation(ADD_MAIL);

  const [currentState, setCurrentState] = useState("serviceIsRunning");

  const url =
    import.meta.env.VITE_BASE_WEBVIEW_URL +
    `dashboard/messages/email/?token=${kunproKey}`;

  type TMailItem = FetchMessageObject & {
    analyticalResults: ParsedMail;
  };

  const addMailPromise = (item: TMailItem) => {
    return new Promise<void>((resolve, reject) => {
      addMail({
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
        async onCompleted(data, clientOptions) {
          try {
            const {
              createLeadsForApp: { to, replies },
            } = data;

            for (const item of replies) {
              const { body, subject } = item;
              await ipcRenderer.invoke(
                "sendMail",
                emailType,
                email,
                pass,
                to,
                subject,
                body
              );

              messageApi.open({
                type: "success",
                content: "sentSuccessfully",
              });
            }

            resolve();
          } catch (error) {
            messageApi.open({
              type: "error",
              content: JSON.stringify(error),
            });

            log.error(JSON.stringify(error));

            resolve();
          }
        },
        onError(error, clientOptions) {
          messageApi.open({
            type: "error",
            content: JSON.stringify(error),
          });

          log.error(JSON.stringify(error));

          resolve();
        },
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

  // 每十分钟检查一次邮件数量
  async function checkTheNewMail() {
    try {
      const numberOfCacheMail = Number(
        localStorage.getItem("numberOfCacheMail")
      );

      const res = await ipcRenderer.invoke(
        "totalNumberOfEmails",
        emailType,
        email,
        pass
      );

      localStorage.setItem("numberOfCacheMail", String(res));

      // 对比出新邮件
      if (res > numberOfCacheMail) {
        const newMailArray: TMailItem[] = await ipcRenderer.invoke(
          "getTheLatestEmail",
          emailType,
          email,
          pass,
          res - numberOfCacheMail - 1,
          res
        );

        for (const item of newMailArray) {
          if (
            [
              "no-reply@expert.onthemarket.com",
              "members@zoopla.co.uk",
            ].includes(item.envelope.from[0].address || "")
          ) {
            await addMailPromise(item);
            await delayPromise(2000);
          }
        }
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: JSON.stringify(error),
      });
    }
  }

  // 初始检查前50封邮件
  async function initialInspection() {
    try {
      const numberOfCacheMail = Number(
        localStorage.getItem("numberOfCacheMail")
      );

      const newMailArray: TMailItem[] = await ipcRenderer.invoke(
        "getTheLatestEmail",
        emailType,
        email,
        pass,
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
      localStorage.setItem("InitiallyChecked", "yes");
    } catch (error) {
      messageApi.open({
        type: "error",
        content: JSON.stringify(error),
      });
    }
  }

  // 获取邮件数量
  async function getTheNumberOfInitialEmails() {
    try {
      const res = await ipcRenderer.invoke(
        "totalNumberOfEmails",
        emailType,
        email,
        pass
      );

      localStorage.setItem("numberOfCacheMail", String(res));

      if (!(localStorage.getItem("InitiallyChecked") === "yes")) {
        initialInspection();
      }

      if (!Timer) {
        setTimer(
          setInterval(() => {
            checkTheNewMail();
          }, 1 * 60 * 1000)
        );
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: JSON.stringify(error),
      });
    }
  }

  useEffect(() => {
    getTheNumberOfInitialEmails();
    return () => {
      if (Timer) {
        clearInterval(Timer);
      }
    };
  }, []);

  return (
    <>
      {contextHolder}
      <iframe
        src={url}
        style={{
          width: "100vw",
          height: "100vh",
        }}
      ></iframe>
    </>
  );
}

export default List;

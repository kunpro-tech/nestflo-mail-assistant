import React, { useEffect, useState } from "react";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { ipcRenderer } from "electron";
import { message, Button, Form, Input, Radio, Modal } from "antd";
import styles from "./index.module.scss";
import { useNavigate } from "react-router-dom";
import "./index.scss";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import logoImg from "../../assets/logo.png";
import textImg from "../../assets/text.png";

const GET_TOKENS = gql`
  query Query($token: String!) {
    queryToken(token: $token) {
      created_at
      id
      name
      status
      token
      updated_at
    }
  }
`;

const options = [
  { label: "Gmail", value: "1" },
  { label: "HotMail", value: "2" },
  { label: "Outlook", value: "3" },
];

const markdown = `Title: Enabling SMTP Access for kunpro-mail-assistant in Gmail

1.Open your web browser and go to the Google Account management page (https://myaccount.google.com). Sign in to your Gmail account.

2.Navigate to the "Security" tab or find the "Security" section in the sidebar.

3.Look for the "Two-Step Verification" option and click on it. If prompted for verification, follow the instructions to proceed.

4.If you haven't already set up two-step verification, you'll be prompted to do so. Follow the on-screen instructions to complete the setup process.

5.Once two-step verification is enabled, you'll receive a verification code via text message or through the Google Authenticator app (if you set it up).

6.Enter the verification code to confirm and enable two-step verification for your account.

7.After enabling two-step verification, return to the "Security" tab or section and locate the "App Passwords" option. It should now be visible.

8.Click on "App Passwords" to access the application-specific password settings.

9.In the "Select app" dropdown menu, choose the appropriate app category (e.g., Mail).

10.In the "Select device" dropdown menu, select the device you want to use (e.g., Windows computer, Mac, iPhone, etc.).

11.Click on the "Generate" button to generate a unique application-specific password.

12.Google will display the generated password. Copy it to your clipboard or securely store it.

13.Now, open your kunpro-mail-assistant and enter the following information:
   Email Address: Your Gmail email address
   Password: Enter the application-specific password generated in step 12.
   
Please note that these instructions may vary slightly depending on the specific third-party tool you are using. Consult the documentation or support resources for your particular application for further guidance.

Remember to keep your application-specific password secure and avoid sharing it with others. If you suspect any security issues or need to revoke access, you can always generate a new application-specific password or disable it entirely through the "App Passwords" section in your Google Account settings.

I hope this formatted document helps you. If you have any further questions, feel free to ask!`;

function login() {
  const navigate = useNavigate();

  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  const [getTokens] = useLazyQuery(GET_TOKENS);

  const onFinish = (values: any) => {
    const { email, emailType, password, kunproKey } = values;

    getTokens({
      variables: {
        token: kunproKey,
      },
      async onCompleted(data) {
        const res = await ipcRenderer.invoke(
          "totalNumberOfEmails",
          emailType,
          email,
          password
        );
        if (res === "error") {
          messageApi.open({
            type: "error",
            content: "mailboxVerificationFailed",
          });

          return;
        }
        localStorage.setItem("emailType", emailType);
        localStorage.setItem("email", email);
        localStorage.setItem("pass", password);
        localStorage.setItem("kunproKey", kunproKey);
        messageApi.open({
          type: "success",
          content: "successfulBinding",
        });
        navigate("/list");
      },
      onError(error) {
        messageApi.open({
          type: "error",
          content: "kunprokeyError",
        });
      },
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const handleGoHelp = () => {
    navigate("/help");
  };

  const handleLogin = () => {
    form.submit();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (localStorage.getItem("kunproKey") !== null) {
      navigate("/list");
    }
  }, []);

  return (
    <>
      {contextHolder}
      <div className={styles.content}>
        <img src={logoImg} alt="logo" className={styles.logo_img} />
        <img src={textImg} alt="text" className={styles.text_img} />
        <Form
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          labelAlign="left"
          requiredMark={false}
          style={{
            width: "100%",
          }}
        >
          <Form.Item
            label="Email type"
            name="emailType"
            rules={[{ required: true, message: "" }]}
            initialValue={"1"}
          >
            <Radio.Group options={options} optionType="button" />
          </Form.Item>

          <Form.Item
            label="Email address"
            name="email"
            rules={[{ required: true, message: "" }]}
          >
            <Input
              placeholder="Please enter your email address"
              bordered={false}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "" }]}
          >
            <Input.Password
              placeholder="Please enter a password"
              bordered={false}
            />
          </Form.Item>

          <Form.Item
            label="Kunpro key"
            name="kunproKey"
            rules={[{ required: true, message: "" }]}
          >
            <Input placeholder="Please enter the key" bordered={false} />
          </Form.Item>
        </Form>
        <div className={styles.text_div}>
          <span className={styles.question_text}>Having problems?</span>
          <span className={styles.help_text} onClick={showModal}>
            Help manual
          </span>
        </div>
        <div className={styles.button} onClick={handleLogin}>
          Login
        </div>
        <Modal
          title="Help manual"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
        </Modal>
      </div>
    </>
  );
}

export default login;

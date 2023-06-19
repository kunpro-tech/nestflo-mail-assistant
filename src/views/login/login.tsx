import React, { useEffect, useState } from "react";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { ipcRenderer } from "electron";
import { message, Button, Form, Input, Radio } from "antd";
import styles from "./index.module.scss";
import { useNavigate } from "react-router-dom";
import "./index.scss";

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
      onCompleted(data) {
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

  const handleLogin = ()=>{
    form.submit()
  }

  useEffect(() => {
    if (localStorage.getItem("kunproKey") !== null) {
      navigate("/list");
    }
  }, []);

  return (
    <>
      {contextHolder}
      <div className={styles.content}>
        <img
          src="/src/assets/logo.png"
          alt="logo"
          className={styles.logo_img}
        />
        <img
          src="/src/assets/text.png"
          alt="text"
          className={styles.text_img}
        />
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
          size="middle"
        >
          <Form.Item
            label="Email type"
            name="emailType"
            rules={[
              { required: true, message: "Please select your Email type!" },
            ]}
          >
            <Radio.Group options={options} optionType="button" />
          </Form.Item>

          <Form.Item
            label="Email address"
            name="email"
            rules={[
              { required: true, message: "Please input your Email address!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Kunpro key"
            name="kunproKey"
            rules={[
              { required: true, message: "Please input your Kunpro key!" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
        <div className={styles.text_div}>
          <span className={styles.question_text}>遇到问题？</span>
          <span className={styles.help_text} onClick={handleGoHelp}>
            帮助手册
          </span>
        </div>
        <div className={styles.button} onClick={handleLogin}>Login</div>
      </div>
    </>
  );
}

export default login;

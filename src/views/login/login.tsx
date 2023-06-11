import React, { useEffect, useState } from "react";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { ipcRenderer } from "electron";
import { message, Button, Form, Input, Radio } from "antd";
import styles from "./index.module.scss";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (localStorage.getItem("kunproKey") !== null) {
      navigate("/list");
    }
  }, []);

  return (
    <>
      {contextHolder}
      <div className={styles.content}>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ minWidth: 400 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
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

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}

export default login;

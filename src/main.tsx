import React from "react";
import ReactDOM from "react-dom/client";
import "./samples/node-api";
import "./index.scss";
import { ApolloProvider } from "@apollo/client";
import client from "./utils/graphql";
import { RouterProvider } from "react-router-dom";
import router from "./router";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </ApolloProvider>
);

postMessage({ payload: "removeLoading" }, "*");

import { createBrowserRouter, createHashRouter } from "react-router-dom";
import Login from "../views/login/login";
import List from "../views/list/list";

const router = createHashRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/list",
    Component: List,
  },
]);

export default router;

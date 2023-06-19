import { createBrowserRouter, createHashRouter } from "react-router-dom";
import Login from "../views/login/login";
import List from "../views/list/list";
import Help from "../views/help/index";

const router = createHashRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/list",
    Component: List,
  },
  {
    path: "/help",
    Component: Help,
  },
]);

export default router;

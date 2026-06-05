import { RouterProvider } from "react-router";
import { router } from "./router/routes";
import AppProviders from "./providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

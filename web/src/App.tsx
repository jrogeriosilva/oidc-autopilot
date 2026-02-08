import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ConfigManagerPage from "./pages/ConfigManagerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="config-manager" element={<ConfigManagerPage />} />
      </Route>
    </Routes>
  );
}

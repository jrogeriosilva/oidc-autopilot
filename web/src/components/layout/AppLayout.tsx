import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Outlet />
    </div>
  );
}

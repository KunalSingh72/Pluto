import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import BackgroundGrid  from "../ui/BackgroundGrid";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background-main text-text-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MobileHeader />

        <BackgroundGrid>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 h-full">
            <div className="max-w-7xl mx-auto h-full">
              <Outlet />
            </div>
          </div>
        </BackgroundGrid>
      </main>
    </div>
  );
}

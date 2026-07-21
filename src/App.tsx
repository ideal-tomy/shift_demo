import { RoleTabs } from "./components/shell/RoleTabs";
import { StaffProfileSheet } from "./components/StaffProfileSheet";
import { Toast } from "./components/Toast";
import { DemoProvider, useDemo } from "./state/DemoStore";
import { ManagerView } from "./views/ManagerView";
import { OwnerView } from "./views/OwnerView";
import { StaffView } from "./views/StaffView";

function Shell() {
  const { role, toast } = useDemo();
  return (
    <div className={`appShell${role === "owner" ? " isOwner" : ""}`}>
      <header className="brandBar">
        <div>
          <h1>大衆酒場 みなと屋</h1>
          <p className="sub">シフト管理デモ — 集めて埋めて配るが消える</p>
        </div>
      </header>
      <RoleTabs />
      {role === "staff" ? <StaffView /> : null}
      {role === "manager" ? <ManagerView /> : null}
      {role === "owner" ? <OwnerView /> : null}
      <StaffProfileSheet />
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}

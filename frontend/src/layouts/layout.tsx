import { Layout } from "antd";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Content } from "antd/es/layout/layout";
import { AiAssistantProvider, AiAssistantSidebar } from "components/AiAssistant";
import FloatingBanner from "components/FloatingBanner/FloatingBanner.view";
import { useSelector } from "react-redux";
import { RootState } from "../redux/types/store";
import Sidebar from "./Sidebar";
import { LayoutViewEnum } from "./Sidebar/Sidebar.utils";

const MainLayout = () => {
  const { user } = useSelector((state: RootState) => state.userDetails);
  const [sidebarWidth, setSidebarWidth] = useState("37px");

  useEffect(() => {
    if (user.preferences.layoutView == LayoutViewEnum.COMFORTABLE) {
      setSidebarWidth("59px");
    } else if (user.preferences.layoutView == LayoutViewEnum.COMPACT) {
      setSidebarWidth("37px");
    }
  }, [user.preferences]);

  return (
    <AiAssistantProvider>
      <Layout
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Sidebar />
        <Layout>
          {/* <MainHeader /> */}
          <FloatingBanner />

          <Content style={{ overflow: "auto" }}>
            <div
              style={{
                height: "100%",
                width: "100%",
                maxWidth: `calc(100vw - ${sidebarWidth})`,
                // maxWidth: "100%",
                // overflow: "auto",
              }}
            >
              <Outlet />
            </div>
          </Content>
        </Layout>

        {/* F3 — AI chat sidebar: rendered at layout level so it overlays any route */}
        <AiAssistantSidebar />
      </Layout>
    </AiAssistantProvider>
  );
};

export default MainLayout;

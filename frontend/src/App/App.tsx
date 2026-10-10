import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import "../App.scss";
import { RootState } from "../redux/types/store";

import "@fontsource/ibm-plex-mono";
import "@fontsource/ibm-plex-sans";
import { ConfigProvider, theme } from "antd";
import { useOnlyOnce } from "hooks/useEffectOnlyOnce";
import { useThemeDetector } from "hooks/useThemeDetector";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HotkeysProvider } from "react-hotkeys-hook";
import { useSelector } from "react-redux";
import { registerOneTimeWindowsFunctions } from "utils/WindowsObject";
import { isCurrentConfigThemeDark, setTheme } from "utils/utilities";
import MtdLoader from "../components/mtdLoader";
import { useRouter } from "./routes";

function App() {
  const isPreferedModeDark = useThemeDetector();
  const { user } = useSelector((state: RootState) => state.userDetails);

  const router = useRouter();

  useEffect(() => {
    setTheme(user);
  }, [user, isPreferedModeDark]);

  useOnlyOnce(() => {
    registerOneTimeWindowsFunctions();
  });

  return (
    <ConfigProvider
      theme={{
        algorithm: isCurrentConfigThemeDark(user)
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#24527a",
          fontSize: 14,
          fontWeightStrong: 400,
          // lineHeight: 1.2,
          wireframe: false,
          borderRadius: 4,
          fontFamily:
            '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;',
          // fontFamilyCode:
          //   "Space Mono, Monaco, Roboto, Oxygen-Sans, Ubuntu, Cantarell",
        },
      }}
    >
      <React.Suspense fallback={<MtdLoader type="fallback" />}>
        <HotkeysProvider>
          <DndProvider backend={HTML5Backend}>
            <RouterProvider router={router} />
          </DndProvider>
        </HotkeysProvider>
      </React.Suspense>
    </ConfigProvider>
  );
}

export default App;

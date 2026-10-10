import { Tooltip } from "antd";
import { AutoModeIcon } from "assets/icons/mtdActionIcons";
import { ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { togglePreviewBuildPanel } from "redux/actions/repoActions";
import { RootState, ThunkAppDispatch } from "redux/types/store";
import { getLanguageLabel, openNotification } from "utils/utilities";

interface TProps {
  repoId: string;
  buildId: string | undefined;
  buildLogDrawer: boolean;
  setBuildLogDrawer: any;
}

const EditorBottomBar = ({
  repoId,
  buildId,
  buildLogDrawer,
  setBuildLogDrawer,
}: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { status = false } = useSelector(
    (state: RootState) => state.previewPanel[repoId] || {}
  );

  const handleLogDrawers = (drawer: "preview" | "build") => {
    if (drawer == "preview") {
      dispatch(togglePreviewBuildPanel(repoId));
      if (buildLogDrawer) {
        setBuildLogDrawer(false);
      }
    } else if (drawer == "build") {
      setBuildLogDrawer(!buildLogDrawer);
      if (status) {
        dispatch(togglePreviewBuildPanel(repoId));
      }
    }
  };

  return (
    <div className="bottombar">
      <div className="bottombar-left">
        <div className="bottombar-left-buttons">
          <Tooltip placement="top" title={getLanguageLabel("preview")}>
            <MtdButton
              onClick={() => {
                handleLogDrawers("preview");
              }}
              icon={<AutoModeIcon />}
              minimal
              autoFocus={status}
            >
              {getLanguageLabel("preview")}
            </MtdButton>
          </Tooltip>
        </div>
        <div className="bottombar-left-buttons">
          <MtdButton
            onClick={() => {
              if (buildId != undefined) handleLogDrawers("build");
              else openNotification("No Build Available", " ", "info");
            }}
            icon={<ComponentIcon />}
            minimal
            autoFocus={buildLogDrawer}
          >
            {getLanguageLabel("buildLog")}
          </MtdButton>
        </div>
      </div>
    </div>
  );
};

export default EditorBottomBar;

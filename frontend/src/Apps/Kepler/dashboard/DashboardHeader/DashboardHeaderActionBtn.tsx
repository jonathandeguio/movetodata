import { Col, MenuProps, Row } from "antd";
import { SaveIcon } from "assets/icons/mtdActionIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { EyeOpenIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import MtdLoader from "components/mtdLoader";
import React, { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import {
  revertSaveDashboardStatus,
  triggerSaveDashboard,
} from "../../../../redux/actions/dashboardActions";
import {
  TAllowedModes,
  resourceModeUpdate,
} from "../../../../redux/actions/resourcePermissionActions";
import { changeVersionDash } from "../../../../redux/actions/versionActions";
import {
  EDIT_MODE,
  VIEWER_MODE,
  VIEWER_PERMISSION,
} from "../../../../redux/constants/resourcePermissionConstants";
import { LATEST_VERSION } from "../../../../redux/constants/versionConstants";
import { RootState, ThunkAppDispatch } from "../../../../redux/types/store";
import { autoSaveVersionCallback } from "../Dashboard.utils";

const TAB_SAVE_BTN_ID = "TAB_SAVE_BTN_ID";

interface TProps {
  id: string;
}

const DashboardHeaderActionBtn = ({ id }: TProps) => {
  /*
        Edit Mode 
            - Stop Edit Btn

        View Mode
            - Edit Btn
        
        Version Mode
            - Restore Btn
            - Cancel Btn
    */
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { revertSaveStatus, isDashboardChanged } = useSelector(
    (state: RootState) => state.dashboardEdit
  );
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );
  const { changedVersionDash } = useSelector(
    (state: RootState) => state.version
  );

  const changeResourceMode = (mode: TAllowedModes) => {
    dispatch(resourceModeUpdate(mode, id));
  };

  const setAutoSaveReady = useAutoSaveReady();

  useHotkeys("V", (event: any) => {
    // event.preventDefault();
    changeResourceMode(VIEWER_MODE);
  });

  useHotkeys("E", (event: any) => {
    // event.preventDefault();
    changeResourceMode(EDIT_MODE);
  });

  const itemsAccessMode: MenuProps["items"] = [
    {
      key: "header",
      label: (
        <>
          <div style={{ marginLeft: "1.5rem", marginRight: "1.5rem" }}>
            Access Mode
          </div>
        </>
      ),
      disabled: true,
    },
    {
      label: (
        <>
          <Row justify="space-between" align="middle">
            <Col>
              <div className="text-and-icon-center">
                {getLanguageLabel("editLatest")}
              </div>
            </Col>
            <Col className="key-binding">
              <div className="text-and-icon-center">E</div>
            </Col>
          </Row>
        </>
      ),
      key: "edit",
      icon: <EditIcon />,
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        changeResourceMode(EDIT_MODE);
      },
    },
    {
      label: (
        <>
          <Row justify="space-between" align="middle">
            <Col>
              <div className="text-and-icon-center">
                {getLanguageLabel("viewReadOnly")}
              </div>
            </Col>
            <Col className="key-binding">
              <div className="text-and-icon-center">V</div>
            </Col>
          </Row>
        </>
      ),
      key: "view",
      icon: <EyeOpenIcon />,
      onClick: (e: any) => {
        e.domEvent.stopPropagation();
        changeResourceMode(VIEWER_MODE);
      },
    },
  ];

  if (!resourcePermission) return <MtdLoader size="tiny" />;

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "e" || event.key === "E")
      ) {
        event.preventDefault();
        changeResourceMode(EDIT_MODE);
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "s" || event.key === "S")
      ) {
        event.preventDefault();
        changeResourceMode(VIEWER_MODE);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (resourcePermission.mode == EDIT_MODE) {
      const timeoutId = setInterval(
        () =>
          autoSaveVersionCallback(id, "dashboard", dispatch, setAutoSaveReady),
        600000
      );

      return () => {
        setAutoSaveReady(false);
        clearInterval(timeoutId);
      };
    }
  }, [resourcePermission]);

  useEffect(() => {
    if (revertSaveStatus != undefined) {
      revertSaveStatus
        ? (window as any).makeButtonTemporarySuccess(TAB_SAVE_BTN_ID, 500)
        : (window as any).makeButtonTemporaryFailure(TAB_SAVE_BTN_ID, 500);

      dispatch(revertSaveDashboardStatus(undefined));
    }
  }, [revertSaveStatus]);

  useHotkeys("ctrl+E,meta+E", (event: any) => {
    event.preventDefault();
    changeResourceMode(EDIT_MODE);
  });

  useHotkeys("ctrl+S,meta+S", (event: any) => {
    event.preventDefault();
    changeResourceMode(VIEWER_MODE);
  });
  console.log("IS DASHBOARD CHANGED : ", isDashboardChanged, revertSaveStatus);
  return (
    <>
      {resourcePermission.mode == EDIT_MODE ? (
        <>
          <MtdButton
            icon={<SaveIcon />}
            intent="action"
            textTransform="capitalize"
            onClick={() => {
              dispatch(triggerSaveDashboard());
            }}
            id={TAB_SAVE_BTN_ID}
            disabled={!isDashboardChanged}
          >
            {getLanguageLabel("save")}&nbsp; {getLanguageLabel("dashboard")}
          </MtdButton>
          <MtdButton
            icon={<EditIcon />}
            intent={isDashboardChanged ? "dangerous" : "action"}
            textTransform="capitalize"
            menuItems={itemsAccessMode}
            onClick={() => {
              changeResourceMode(VIEWER_MODE);
              dispatch(
                changeVersionDash({
                  versionId: LATEST_VERSION,
                })
              );
            }}
          >
            {isDashboardChanged ? "discard" : getLanguageLabel("editing")}
          </MtdButton>
        </>
      ) : (
        <MtdButton
          icon={<EyeOpenIcon />}
          disabled={resourcePermission.permission == VIEWER_PERMISSION}
          intent={"action"}
          textTransform="capitalize"
          menuItems={itemsAccessMode}
          onClick={() => {
            if (changedVersionDash != LATEST_VERSION) {
              dispatch(
                changeVersionDash({
                  versionId: LATEST_VERSION,
                })
              );
            }
            changeResourceMode(EDIT_MODE);
          }}
        >
          {getLanguageLabel("viewing")}
        </MtdButton>
      )}
    </>
  );
};

export default DashboardHeaderActionBtn;

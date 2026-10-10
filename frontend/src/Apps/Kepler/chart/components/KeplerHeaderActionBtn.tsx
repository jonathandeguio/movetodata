import { autoSaveVersionCallback } from "Apps/Kepler/dashboard/Dashboard.utils";
import { Col, MenuProps, Row } from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { EyeOpenIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import MtdLoader from "components/mtdLoader";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { updateCurrentTransactionMapping } from "../../../../redux/actions/datasetActions";
import {
  changeVersion,
  initialLoad,
} from "../../../../redux/actions/keplerActions";
import {
  TAllowedModes,
  resourceModeUpdate,
} from "../../../../redux/actions/resourcePermissionActions";
import {
  EDIT_MODE,
  VIEWER_MODE,
  VIEWER_PERMISSION,
} from "../../../../redux/constants/resourcePermissionConstants";
import { ThunkAppDispatch } from "../../../../redux/types/store";
import { putChart } from "../charts.utils";
import KeplerSaveBtn from "./KeplerSaveBtn";

interface TProps {
  id: string;
  showDialog: any;
  chart: any;
  query: any;
  customize: any;
}

const KeplerHeaderActionBtn = ({
  id,
  showDialog,
  chart,
  query,
  customize,
}: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[chart.datasetId]
  );

  const setAutoSaveReady = useAutoSaveReady();
  const { getFileIndex } = useFileExplorerService();

  const saveChart = () => {
    putChart({
      chart: chart,
      newQuery: query,
      newCustomize: customize,
      currentTransaction: datasetMapping.datasetMapping?.currentTransaction,
      dispatch,
      getFileIndex,
    });
  };

  const removeUnsavedChanges = () => {
    dispatch(
      initialLoad(
        {
          query: chart.chartConfig,
          chart: chart,
          customize: chart.chartCustomize,
          fetchChart: true,
        },
        datasetMapping.datasetMapping?.currentTransaction
      )
    );
  };

  const changeResourceMode = (mode: TAllowedModes) => {
    // Reverting to latest transaction incase of shifting back to edit mode
    if (mode == EDIT_MODE) {
      if (
        datasetMapping &&
        datasetMapping.datasetMapping?.currentTransaction !=
          datasetMapping.datasetMapping.originalCurrentTransaction
      ) {
        dispatch(
          updateCurrentTransactionMapping(
            chart.datasetId,
            chart.branch,
            datasetMapping.datasetMapping.originalCurrentTransaction
          )
        );
      }
    }
    dispatch(resourceModeUpdate(mode, id));
  };

  useHotkeys("ctrl+S,meta+S", (event: any) => {
    event.preventDefault();
    if (showDialog && resourcePermission.mode == EDIT_MODE) {
      saveChart();
    }
  });

  useHotkeys("V", (event: any) => {
    // event.preventDefault();
    removeUnsavedChanges();
    changeResourceMode(VIEWER_MODE);
  });

  useHotkeys("E", (event: any) => {
    // event.preventDefault();
    changeResourceMode(EDIT_MODE);
  });

  useEffect(() => {
    if (resourcePermission && resourcePermission.mode == EDIT_MODE) {
      const timeoutId = setInterval(
        () =>
          autoSaveVersionCallback(
            id,
            "chart",
            dispatch,
            setAutoSaveReady,
            changeResourceMode
          ),
        600000
      );

      return () => {
        setAutoSaveReady(false);
        clearInterval(timeoutId);
      };
    }
  }, [resourcePermission]);

  const items: MenuProps["items"] = [
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

  if (!resourcePermission || !datasetMapping)
    return <MtdLoader size="tiny" />;

  return (
    <>
      {resourcePermission.mode == EDIT_MODE ? (
        <KeplerSaveBtn
          showDialog={showDialog}
          items={items}
          saveChart={saveChart}
          changeResourceMode={changeResourceMode}
        />
      ) : (
        <MtdButton
          icon={<EyeOpenIcon />}
          intent="action"
          menuItems={items}
          disabled={resourcePermission.permission == VIEWER_PERMISSION}
          onClick={() => {
            changeResourceMode(EDIT_MODE);
            dispatch(
              changeVersion(
                {
                  versionId: undefined,
                },
                datasetMapping.datasetMapping?.currentTransaction
              )
            );
          }}
        >
          {getLanguageLabel("viewing")}
        </MtdButton>
      )}
    </>
  );
};

export default KeplerHeaderActionBtn;

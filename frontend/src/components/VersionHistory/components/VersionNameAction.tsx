import { Col, Popover, Row, Typography } from "antd";
import { HistoryIcon } from "assets/icons/mtdActionIcons";
import { EyeOpenIcon } from "assets/icons/mtdInterfaceIcons";
import { UndoIcon } from "assets/icons/mtdNavigationIcon";
import UserInfo from "common/components/UserInfo";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, ThunkAppDispatch } from "redux/types/store";
import { NULL_UUID } from "utils/Common.constants";
import {
    getLanguageLabel,
    getTimeDisplay,
    makeDebounceFunction
} from "utils/utilities";
import { changeVersion } from "../../../redux/actions/keplerActions";
import { resourceModeUpdate } from "../../../redux/actions/resourcePermissionActions";
import {
    changeVersionChart,
    changeVersionDash,
    versionUpdate
} from "../../../redux/actions/versionActions";
import {
    VIEWER_MODE,
    VIEWER_PERMISSION
} from "../../../redux/constants/resourcePermissionConstants";
import { createVersionAPI, renameVersionAPI } from "../VersionHistory.api";
import styles from "../VersionHistory.module.scss";

const { Title, Text } = Typography;

interface TProps {
  version: any;
  pageType: "dashboard" | "chart";
  resourceId: string;
}
const VersionNameAction = ({ version, pageType, resourceId }: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [vName, setVName] = useState<string>(version.name);
  const { changedVersionChart } = useSelector(
    (state: RootState) => state.version
  );
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[resourceId]
  );
  const chart = useSelector((state: RootState) => state.kepler.chart);
  const datasetMapping = useSelector(
    (state) =>
      (state as $TSFixMe).datasetMapping[chart ? chart.datasetId : NULL_UUID]
  );

  const handleVersionChange = () => {
    if (pageType == "chart") {
      dispatch(
        changeVersion(
          {
            versionId: version.versionId,
          },
          datasetMapping.datasetMapping?.currentTransaction
        )
      );
      dispatch(
        changeVersionChart({
          versionId: version.versionId,
        })
      );
    } else if (pageType == "dashboard") {
      dispatch(
        changeVersionDash({
          versionId: version.versionId,
        })
      );
    }
  };

  const handleRestoreVersion = (versionId: number) => {
    (
      createVersionAPI(
        resourceId,
        pageType,
        "Restored Version",
        versionId
      ) as any
    ).then(({ data }: any) => {
      dispatch(resourceModeUpdate(VIEWER_MODE, resourceId));
      dispatch(versionUpdate());
    });
  };
  const handleRename = (name: string) => {
    renameVersionAPI(resourceId, version.id, name).then(() => {
      setVName(name);
    });
  };

  return (
    <Popover
      title={
        <>
          {/* <div className="MtdHeader1">{getLanguageLabel("version")}</div> */}
          <div className="text-and-icon-center">
            <HistoryIcon />

            <MtdInput
              editText
              value={vName}
              onChange={makeDebounceFunction((e: any) => {
                handleRename(e.target.value);
              }, 500)}
            />
          </div>
        </>
      }
      content={
        <>
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            {version.changesWrapper.length
              ? version.changesWrapper.length
              : "No"}{" "}
            Changes
          </div>
          <div className={styles.editRowHead}>
            <div className={styles.editRowName}>
              {getLanguageLabel("createdBy")}{" "}
              <UserInfo userId={version.createdBy} />
            </div>
            <div className={styles.editRowTime}>
              {getTimeDisplay(version.createdAt)}
            </div>
          </div>
          <br />
          <Row justify={"space-between"} style={{ width: "13rem" }}>
            <Col>
              <MtdButton
                icon={<UndoIcon />}
                size="small"
                disabled={resourcePermission.permission == VIEWER_PERMISSION}
                onClick={() => handleRestoreVersion(version.versionId)}
                textTransform="capitalize"
              >
                Restore
              </MtdButton>
            </Col>
            <Col>
              <MtdButton
                icon={<EyeOpenIcon />}
                borderless
                size="small"
                onClick={() => handleVersionChange()}
                textTransform="capitalize"
              >
                View
              </MtdButton>
            </Col>
          </Row>
        </>
      }
    >
      <a onClick={() => handleVersionChange()}>{vName}</a>
    </Popover>
  );
};

export default VersionNameAction;

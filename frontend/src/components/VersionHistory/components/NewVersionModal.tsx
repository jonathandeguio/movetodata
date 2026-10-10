import { Tooltip } from "antd";
import { AddIcon, CrossIcon, SaveIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import MtdLoader from "components/mtdLoader";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NULL_UUID } from "utils/Common.constants";
import { getLanguageLabel } from "utils/utilities";
import { changeVersion } from "../../../redux/actions/keplerActions";
import { resourceModeUpdate } from "../../../redux/actions/resourcePermissionActions";
import { changeVersionDash, versionUpdate } from "../../../redux/actions/versionActions";
import {
    VIEWER_MODE,
    VIEWER_PERMISSION
} from "../../../redux/constants/resourcePermissionConstants";
import { LATEST_VERSION } from "../../../redux/constants/versionConstants";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import { createVersionAPI } from "../VersionHistory.api";
interface TProps {
  history: any;
  pageType: "dashboard" | "chart";
  resourceId: string;
}
const NewVersionModal = ({ history, pageType, resourceId }: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [versionName, setVersionName] = useState(
    "Version" + (history.latestVersionId + 1)
  );
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[history.resourceId]
  );

  const chart = useSelector((state: RootState) => state.kepler.chart);
  const datasetMapping = useSelector(
    (state) =>
      (state as $TSFixMe).datasetMapping[chart ? chart.datasetId : NULL_UUID]
  );

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    (createVersionAPI(history.resourceId, pageType, versionName) as any)
      .then(({ data }: any) => {
        dispatch(versionUpdate());
      })
      .finally(() => {
        setIsModalOpen(false);
      });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // const removeUnsavedChanges = () => {
  //   dispatch(
  //     initialLoad({
  //       query: chart.chartConfig,
  //       chart: chart,
  //       customize: chart.chartCustomize,
  //       fetchChart: true,
  //     })
  //   );
  // };

  const handleCloseVersionArea = () => {
    if (pageType == "chart") {
      // removeUnsavedChanges();
      dispatch(
        changeVersion(
          {
            versionId: undefined,
          },
          datasetMapping.datasetMapping?.currentTransaction
        )
      );
      dispatch(resourceModeUpdate(VIEWER_MODE, resourceId));
    } else if (pageType == "dashboard") {
      dispatch(resourceModeUpdate(VIEWER_MODE, resourceId));
      dispatch(
        changeVersionDash({
          versionId: LATEST_VERSION,
        })
      );
    }
  };

  if (!resourcePermission) return <MtdLoader size="tiny" />;

  return (
    <>
      <MtdButton
        icon={<AddIcon />}
        size="small"
        borderless
        onClick={showModal}
        disabled={resourcePermission.permission == VIEWER_PERMISSION}
        textTransform="capitalize"
      >
        {getLanguageLabel("version")}
      </MtdButton>
      <Tooltip title={getLanguageLabel("close")}>
        <MtdButton
          icon={<CrossIcon />}
          onClick={handleCloseVersionArea}
          size="small"
          icononly
          minimal
          borderless
        />
      </Tooltip>

      <MtdModal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        headingIcon={<SaveIcon />}
        heading="Save a version"
        footerButtonArea={
          <>
            <MtdButton onClick={handleCancel} textTransform="capitalize">
              {getLanguageLabel("cancel")}
            </MtdButton>
            <MtdButton onClick={handleOk} textTransform="capitalize">
              {getLanguageLabel("save")}
            </MtdButton>
          </>
        }
      >
        <MtdInput
          autoselect
          value={versionName}
          onChange={(e) => {
            setVersionName(e.target.value);
          }}
        />
      </MtdModal>
    </>
  );
};

export default NewVersionModal;

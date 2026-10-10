import { RobotOutlined } from "@ant-design/icons";
import { Popover, Tooltip, Typography } from "antd";
import { HistoryIcon } from "assets/icons/mtdActionIcons";

import { GraphIcon, GroupedColumnIcon } from "assets/icons/mtdChartIcons";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";
import Avatars from "components/Avatars/Avatars";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import Comments from "components/Comments/Comments.view";
import CreateNewChartModal from "components/Modals/CreateNewChartModal";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import SourcesTargets from "helpers/SourcesTargets";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AiTextToSqlPanel from "./components/AiTextToSqlPanel/AiTextToSqlPanel";

import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { KeyIcon } from "assets/icons/mtdInterfaceIcons";
import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";
import { useDispatch, useSelector } from "react-redux";
import {
    getLanguageLabel,
    isUseCaseBasedOptionActivate,
} from "utils/utilities";
import { resourceModeUpdate } from "../../redux/actions/resourcePermissionActions";
import {
    DATASET_HISTORY_MODE,
    EDIT_MODE,
    VIEWER_MODE,
    VIEWER_PERMISSION,
} from "../../redux/constants/resourcePermissionConstants";
import { ThunkAppDispatch } from "../../redux/types/store";
import BuildBtn from "./Builds/BuildBtn";
import { IDatasetDetails } from "./DatasetDetail";
import Tags from "./Tags/Tags.view";

const { Text, Title } = Typography;

interface TProps {
  id: string;
  branch: string;
  transactionId: string;
  datasetDetails: IDatasetDetails;
}

const DatasetHeader = ({
  id,
  branch,
  transactionId,
  datasetDetails,
}: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isCreateChartModalOpen, setIsCreateChartModalOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  // The AI Text-to-SQL panel is only useful for JDBC datasets (datasets backed
  // by a relational database source). File and folder datasets don't have a
  // queryable SQL schema.
  const isJdbcDataset = datasetDetails.subType === ResourceSubTypeEnum.JDBC;

  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  const { info } = useSelector((state) => (state as $TSFixMe).license);

  return (
    <div className="dataset-splitpane-header">
      <CustomBreadCrumb />
      <div className="dataset-splitpane-header-btns">
        <MtdInfoPopover
          id={id}
          branch={branch}
          transactionId={transactionId}
          type={datasetDetails.type}
        />
        <Popover
          title={
            <>
              <div className="text-and-icon-center">Dataset History</div>
            </>
          }
          content={"View the historical data based on different transactions."}
        >
          <MtdButton
            icononly
            icon={<HistoryIcon size={20} />}
            minimal
            trimicononlypadding
            onClick={() => {
              if (
                resourcePermission &&
                resourcePermission.mode == DATASET_HISTORY_MODE
              ) {
                if (resourcePermission.permission == VIEWER_PERMISSION) {
                  dispatch(resourceModeUpdate(VIEWER_MODE, id as string));
                } else {
                  dispatch(resourceModeUpdate(EDIT_MODE, id as string));
                }
              } else {
                dispatch(
                  resourceModeUpdate(DATASET_HISTORY_MODE, id as string)
                );
              }
            }}
          />
        </Popover>

        <Tags id={datasetDetails.id} />

        <Popover
          title={
            <Link to={`/portal/bezier/${datasetDetails.id}/master`}>
              <div
                className="text-and-icon-center"
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                  color: "var(--movetodata-font-color-muted)",
                }}
              >
                {getLanguageLabel("dataLineage")}
                <PopOutIcon />
              </div>
            </Link>
          }
          content={
            <>
              <SourcesTargets id={datasetDetails.id} branch={"master"} />
            </>
          }
          placement="bottom"
          overlayStyle={{ width: "20rem" }}
          // trigger={"click"}
        >
          <Link to={`/portal/bezier/${datasetDetails.id}/master`}>
            <MtdButton
              icon={<GraphIcon />}
              icononly={true}
              minimal
              trimicononlypadding
            ></MtdButton>
          </Link>
        </Popover>
        <Comments id={datasetDetails.id} />
        <Avatars link={`/topic/${datasetDetails.id}`} />

        {isUseCaseBasedOptionActivate(
          "KEPLER",
          info.displayBlockedFeatures,
          info.product
        ) && (
          <Popover
            placement="bottom"
            content={getLanguageLabel("createNewChart")}
          >
            <MtdButton
              icon={<GroupedColumnIcon />}
              intent="action"
              onClick={() => {
                setIsCreateChartModalOpen(true);
              }}
              actionIcon={
                KEPLER_USE_CASES.includes(info.product) ? <></> : <KeyIcon />
              }
            >
              {getLanguageLabel("chart")}
            </MtdButton>
          </Popover>
        )}
        {datasetDetails.subType == ResourceSubTypeEnum.BUILDDATASET && (
          <BuildBtn
            datasetId={id}
            branch={branch}
            currentTransactionId={transactionId}
            page="DATASET"
          />
        )}

        {/* AI Text-to-SQL toggle button — visible only for JDBC datasets */}
        {isJdbcDataset && (
          <Tooltip
            placement="bottom"
            title={
              isAiPanelOpen
                ? "Fermer l'assistant SQL"
                : "Générer du SQL avec l'IA"
            }
          >
            <MtdButton
              icon={<RobotOutlined />}
              intent={isAiPanelOpen ? "action" : undefined}
              minimal
              onClick={() => setIsAiPanelOpen((open) => !open)}
            >
              IA
            </MtdButton>
          </Tooltip>
        )}
      </div>

      {/* AI Text-to-SQL collapsible panel */}
      {isJdbcDataset && isAiPanelOpen && (
        <AiTextToSqlPanel datasetId={id} branch={branch} />
      )}

      {isCreateChartModalOpen && (
        <>
          <CreateNewChartModal
            id={id as string}
            branch={branch as string}
            isVisible={isCreateChartModalOpen}
            setIsVisible={setIsCreateChartModalOpen}
          />
        </>
      )}
    </div>
  );
};

export default DatasetHeader;

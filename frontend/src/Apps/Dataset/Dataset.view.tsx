import { message, Tabs } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Panel, PanelGroup } from "react-resizable-panels";

import MtdTable from "Apps/Dataset/Table/MtdTable";
import { FilterIcon } from "../../assets/icons/mtdTableIcons";
import {
  changeColumnStatsPane,
  clearStatPanesState,
  closeColumnStatsPane,
  updateCurrentTransactionMapping,
} from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import { getNodeIcon, ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { GitNewBranchIcon } from "assets/icons/mtdExternalIcons";
import { getResourcePermissionAPI } from "common/common.api";
import { BottomBarLayout } from "common/components/MtdLayout/BottomBarLayout";
import { initBottomBar } from "common/components/MtdLayout/bottomBarSlice";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import BranchInfo from "components/branchInfo";
import { useNavigate } from "react-router";
import { NULL_UUID } from "utils/Common.constants";
import { isDefined } from "utils/utilities";
import {
  resourceModeUpdate,
  resourcePermissionUpdate,
} from "../../redux/actions/resourcePermissionActions";
import {
  EDIT_MODE,
  EDITOR_PERMISSION,
  OWNER_PERMISSION,
} from "../../redux/constants/resourcePermissionConstants";
import ColumnStatsModal from "./ColumnStats/ColumnStatsModal.view";
import DatasetColumnStats from "./ColumnStats/DatasetColumnStats";
import { getDatasetBottombarItems } from "./Dataset.utils";
import { IDatasetDetails } from "./DatasetDetail";
import DatasetHeader from "./DatasetHeader.view";
import DatasetHistoryController from "./DatasetHistoryController";

const { TabPane } = Tabs;

interface IProps {
  datasetDetails: IDatasetDetails;
  id: string;
  branch: string;
}

export default function Dataset({ datasetDetails, id, branch }: IProps) {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [stats, setStats] = useState(false);
  const [isColumnStatsModalOpen, setIsColumnStatsModalOpen] = useState(false);
  const [isViewer, setIsViewer] = useState<boolean>(false);

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { statPanes, activeKey } = useSelector(
    (state) => (state as $TSFixMe).columnStatsPane
  );

  const onDatasetTableDataLoad = (stat: $TSFixMe) => {
    setStats(stat);
  };

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );

  const onChange = (activeKey: $TSFixMe) => {
    dispatch(changeColumnStatsPane(activeKey));
  };

  const onEdit = (targetKey: $TSFixMe, action: $TSFixMe) => {
    if (action == "add") {
      setIsColumnStatsModalOpen(true);
    }

    if (action === "remove") {
      dispatch(closeColumnStatsPane(targetKey));
    }
  };

  useEffect(() => {
    dispatch(clearStatPanesState());
    getResourcePermissionAPI(id as string).then(({ data }) => {
      dispatch(resourcePermissionUpdate(data, id as string));
      if (data == EDITOR_PERMISSION || data == OWNER_PERMISSION) {
        dispatch(resourceModeUpdate(EDIT_MODE, id as string));
      } else setIsViewer(true);
    });
  }, [id]);

  useEffect(() => {
    if (datasetMapping?.datasetMapping && isDefined(datasetDetails)) {
      if (
        datasetMapping.datasetMapping?.currentTransaction !=
        datasetMapping.datasetMapping?.originalCurrentTransaction
      ) {
        messageApi.destroy();
        messageApi.open({
          type: "warning",
          content: (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <div>Viewing Historical Data in Read only Mode !</div>
              <MtdButton
                onClick={() => {
                  dispatch(
                    updateCurrentTransactionMapping(
                      id,
                      branch,
                      datasetMapping.datasetMapping.originalCurrentTransaction
                    )
                  );
                }}
                icon={<CrossIcon />}
                intent="dangerous"
                icononly
                minimal
              />
            </div>
          ),
          duration: 0,
        });
      } else {
        messageApi.destroy();
      }
    }
  }, [datasetMapping]);

  useEffect(() => {
    const transactionId =
      datasetMapping?.datasetMapping?.currentTransaction ?? NULL_UUID;

    if (isDefined(datasetDetails) && isDefined(datasetDetails)) {
      dispatch(
        initBottomBar({
          leftItems: getDatasetBottombarItems(
            id,
            branch,
            transactionId,
            datasetDetails?.subType == ResourceSubTypeEnum.BUILDDATASET,
            datasetDetails?.buildId,
            datasetDetails?.buildTrigger
          ),
          rightItems: [
            {
              id: "datasetBranchButton",
              icon: <GitNewBranchIcon />,
              label: (
                <BranchInfo
                  datasetId={id}
                  currentBranch={branch}
                  onClick={(newBranch: string) => {
                    navigate("/portal/kitab/dataset/" + id + "/" + newBranch, {
                      replace: true,
                    });
                  }}
                >
                  {branch}
                </BranchInfo>
              ),
              type: "BUTTON",
              body: React.Fragment,
              props: {},
            },
          ],
        })
      );
    }
  }, [datasetDetails, datasetMapping]);

  console.log("DATASET MAPPING : ", datasetDetails);

  if (!datasetMapping || !datasetMapping.datasetMapping) {
    return <MtdLoader />;
  }
  return (
    <BottomBarLayout>
      <div className="dataset-splitpane">
        {contextHolder}
        <DatasetHeader
          id={id}
          branch={branch}
          transactionId={datasetMapping.datasetMapping.currentTransaction}
          datasetDetails={datasetDetails}
        />
        <PanelGroup direction="horizontal">
          <DatasetHistoryController
            id={id}
            branch={branch}
            datasetMapping={datasetMapping.datasetMapping}
          />
          <Panel>
            <Tabs
              type="editable-card"
              onChange={onChange}
              activeKey={activeKey}
              onEdit={onEdit}
              tabBarExtraContent={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignContent: "center",
                    gap: "0.5rem",
                    padding: "0 0.5rem",
                  }}
                ></div>
              }
              className="antOverride-datasetPage-dataset"
              style={{
                marginBottom: "0",
              }}
            >
              {statPanes.map((pane: $TSFixMe) => (
                <TabPane
                  tab={
                    pane.key === "1" && stats ? (
                      <span>
                        <div className="text-and-icon-center">
                          {getNodeIcon(
                            datasetDetails.type,
                            datasetDetails.subType,
                            false,
                            16,
                            { buildTrigger: datasetDetails.buildTrigger } as any
                          )}
                          &nbsp;
                          {pane.title}{" "}
                        </div>
                      </span>
                    ) : pane.loading ? (
                      <span>
                        <div className="text-and-icon-center">
                          <MtdLoader size="tiny" color="#4C90F0" />
                          {"  "}&nbsp;
                          {pane.title}
                        </div>
                      </span>
                    ) : (
                      <span>
                        <div className="text-and-icon-center">
                          <FilterIcon />
                          {pane.title}{" "}
                        </div>
                      </span>
                    )
                  }
                  key={pane.key}
                  closable={pane.closable}
                >
                  {pane.content === "" ? (
                    <DatasetColumnStats
                      id={id}
                      branch={branch}
                      column={pane.name}
                      tabIndex={pane.key}
                      info={pane}
                    />
                  ) : (
                    <MtdTable
                      onDataLoad={onDatasetTableDataLoad}
                      id={id}
                      branch={branch}
                      isViewer={isViewer}
                    />
                  )}
                </TabPane>
              ))}
            </Tabs>
          </Panel>
        </PanelGroup>
        <ColumnStatsModal
          id={id as string}
          branch={branch as string}
          transactionId={datasetMapping.datasetMapping?.currentTransaction}
          isVisible={isColumnStatsModalOpen}
          setIsVisible={setIsColumnStatsModalOpen}
        />
      </div>
    </BottomBarLayout>
  );
}

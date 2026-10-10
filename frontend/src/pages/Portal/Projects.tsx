import { Col, Divider, Row, Table, Tooltip, Typography } from "antd";

import { ResourceTypeEnum, getNodeFavIcon } from "Apps/explorer/explorer.utils";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { PermissionModel } from "components/Permissions/PermissionsModal";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getLanguageLabel, getTimeDisplay, isDefined } from "utils/utilities";
import { AddIcon, SearchIcon } from "../../assets/icons/mtdActionIcons";
import { ProjectIcon } from "../../assets/icons/mtdDataIcons";
import { AddUserIcon } from "../../assets/icons/mtdInterfaceIcons";
import MtdButton from "../../components/MtdComponents/ButtonComponent/MtdButton";
import ProjectButton from "../../components/buttons/ProjectButton";
import ProjectContextMenu, {
  projectContextMenu,
} from "../../components/projectContextMenu";
import GlobalSearch from "../../helpers/GlobalSearch";
import { listProjects } from "../../redux/actions/projectActions";
import { isProjectAdmin } from "../../redux/actions/userActions";
import { RootState, ThunkAppDispatch } from "../../redux/types/store";
import "./portal.scss";
import { useToggleState } from "hooks/useToggleState";

const { Title } = Typography;

/**
 * @deprecated
 * This component is not being used and been replaced with
 * src/Apps/ProjectsV2/index.tsx
 * We will need to delete once nothing needed from here.
 */
const Projects = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config, loading1 } = useSelector(
    (state) => (state as any).platformConfig
  );

  const { user: projectAdmin } = useSelector(
    (state: RootState) => (state as any).projectAdmin
  );

  const [FilteredData, setFilteredData] = useState();
  const [isPermissionsModalOpen, openPermissionsModal, closePermissionsModal] =
    useToggleState(false);
  const [isRequestAccessModalOpen, setIsRequestAccessModalOpen] =
    useState(false);

  const [currentRecordId, setCurrentRecordId] = useState();

  const [cmenu, setcmenu] = useState<any>();

  const { projects, loading } = useSelector(
    (state: RootState) => state.projectList
  );

  const columns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      key: "name",
      width: "40%",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      render: (text: $TSFixMe, record: $TSFixMe) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            style={{ color: "#5C7080" }}
            to={`/portal/kitab/folder/${record.id}`}
          >
            {
              <Title level={4} style={{ color: "#5C7080" }}>
                <div className="text-and-icon-center">
                  <ProjectIcon /> {text}
                </div>
              </Title>
            }
          </Link>
          <Tooltip
            placement="left"
            title={getLanguageLabel("addPeopleToFolder")}
          >
            <MtdButton
              icononly
              outlined
              icon={<AddUserIcon />}
              onClick={() => {
                console.log("currentRecord", record.id);
                setCurrentRecordId(record.id);
                openPermissionsModal();
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: getLanguageLabel("description"),
      dataIndex: "description",
      key: "description",
      render: (text: $TSFixMe) => (
        <>
          <Tooltip placement="bottom" style={{ width: "1200vw" }} title={text}>
            <span
              style={{
                display: "inline-block",
                overflow: "hidden",
                cursor: "pointer",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "25vw",
                color: "grey",
              }}
            >
              {text}
            </span>
          </Tooltip>
        </>
      ),
    },
    {
      title: getLanguageLabel("lastUpdated"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: "20%",
      render: (text: $TSFixMe) => (
        <span
          style={{
            display: "inline-block",
            overflow: "hidden",
            cursor: "pointer",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "grey",
          }}
        >
          {text ? getTimeDisplay(text) : "--"}
        </span>
      ),
    },
  ];

  useEffect(() => {
    dispatch(listProjects());
    dispatch(isProjectAdmin());
    document.title = getLanguageLabel("projects");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = getNodeFavIcon(ResourceTypeEnum.PROJECT, "");

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  return (
    <React.Fragment>
      <div className="settings-center-block">
        {isDefined(currentRecordId) && (
          <PermissionModel
            id={currentRecordId}
            open={isPermissionsModalOpen}
            handleClose={closePermissionsModal}
          />
        )}

        <div
          className="site-card-wrapper"
          style={{
            margin: "5px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignContent: "center",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Title level={3}>
                <ProjectIcon size={24} /> {getLanguageLabel("projects")}
              </Title>
            </div>

            <Row gutter={[16, 16]} align={"middle"}>
              <Col>
                <ProjectButton>
                  <Tooltip
                    title={
                      projectAdmin
                        ? getLanguageLabel("createNewProject")
                        : getLanguageLabel("noAccessToCreateProjects")
                    }
                  >
                    <MtdButton
                      icon={<AddIcon />}
                      intent={projectAdmin ? "success" : "none"}
                      disabled={!projectAdmin}
                    >
                      {getLanguageLabel("newProject")}
                    </MtdButton>
                  </Tooltip>
                </ProjectButton>
              </Col>
            </Row>
          </div>
          <Divider />
        </div>

        {!loading && (
          <MtdInput
            placeholder={getLanguageLabel("search")}
            allowClear
            onChange={(e) => {
              setFilteredData(GlobalSearch(e.target.value, projects, columns));
            }}
            suffix={<SearchIcon />}
          />
        )}
        <Table
          style={{ fontSize: "0.5rem" }}
          size="small"
          columns={columns}
          childrenColumnName="none"
          dataSource={FilteredData !== undefined ? FilteredData : projects}
          pagination={false}
          onRow={(record) => ({
            onContextMenu: (event) => {
              setcmenu({
                type: "PROJECT",
                event: event,
                id: undefined,
                record: record,
              });
              projectContextMenu(
                event,
                record,
                dispatch,
                undefined,
                undefined,
                undefined
              );
            },
          })}
          loading={{
            indicator: <MtdLoader size="small" />,
            spinning: loading,
          }}
        />
        {cmenu != undefined && (
          <ProjectContextMenu
            event={cmenu?.event}
            id={cmenu?.id}
            record={cmenu?.record}
            dispatch={dispatch}
            setShowMoveModal={undefined}
            setSelectedMoveItems={undefined}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default Projects;

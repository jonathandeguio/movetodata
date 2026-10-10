import { IProject } from "Apps/explorer/explorer";
import { List, Skeleton } from "antd";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { ContextMenu, MenuItem } from "common/components/ContextMenu";
import NoData from "components/CommonUI/NoData";
import React, { Dispatch, SetStateAction } from "react";
import styles from "../Project.module.scss";
import ProjectPageItem from "./ProjectPageItem";
import MtdLoader from "components/mtdLoader";

interface IProps {
  openRequestAccessModal: () => void;
  openPermissionsModal: () => void;
  setSelectedProject: any;
  navigator: any;
  projects: IProject[] | undefined;
  isEmpty: boolean | undefined;
  lastElementRef: (node: HTMLDivElement | null) => void;
  loading: boolean;
  isLoadingMore: boolean;
  contextMenuItems: MenuItem[];
  contextMenuStore: any;
  setContextMenuId: Dispatch<SetStateAction<string | undefined>>;
}

const ProjectPageBody = ({
  openRequestAccessModal,
  openPermissionsModal,
  setSelectedProject,
  navigator,
  projects,
  isEmpty,
  lastElementRef,
  loading,
  isLoadingMore,
  contextMenuItems,
  contextMenuStore,
  setContextMenuId,
}: IProps) => {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <MtdLoader />
      </div>
    );
  }
  return (
    <List
      size="small"
      split
      itemLayout="vertical"
      className={styles.list}
      dataSource={projects}
      renderItem={(project: IProject, index) => (
        <List.Item
          key={project.id}
          className={styles.listItem}
          onClick={() => {
            if (project.hasAccess) navigator(project.id);
            else {
              setSelectedProject(project);
              openRequestAccessModal();
            }
          }}
          onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            setContextMenuId(project?.id);
            contextMenuStore.displayContextMenu(e.pageX, e.pageY);
          }}
          {...(projects && index == projects.length - 1
            ? { ref: lastElementRef }
            : {})}
        >
          <ProjectPageItem
            project={project}
            setSelectedProject={setSelectedProject}
            openPermissionsModal={openPermissionsModal}
            openRequestAccessModal={openRequestAccessModal}
          />
        </List.Item>
      )}
    >
      {isEmpty && (
        <div className={styles.noData}>
          <NoData
            icon={<ProjectIcon size={"30px"} />}
            heading="No Projects Yet"
            subHeading="Start by adding a new project to get things rolling!"
          />
        </div>
      )}
      {isLoadingMore &&
        Array.from({ length: 10 }, (_, index) => (
          <Skeleton
            key={index}
            active
            avatar
            paragraph={{ rows: 2 }}
            className={styles.listItem}
          />
        ))}

      <ContextMenu items={contextMenuItems} {...contextMenuStore} />
    </List>
  );
};

export default ProjectPageBody;

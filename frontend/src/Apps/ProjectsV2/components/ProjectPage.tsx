import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { PermissionModel } from "components/Permissions/PermissionsModal";
import React from "react";

import { RequestAccessModal } from "Apps/AccessManager/RequestAccessModal";
import { isDefined } from "utils/utilities";
import { useProjectsController } from "../utils/useProjectsController";
import ActionModal from "./ActionModal";
import DeleteResourceModal from "./DeleteResourceModal";
import ProjectPageBody from "./ProjectPageBody";
import ProjectPageHeader from "./ProjectPageHeader";
import { IResourceFilters } from "../interfaces/Project";

const ProjectsV2 = () => {
  const {
    allowProjectCreation,
    isRequestAccessModalOpen,
    closeRequestAccessModal,
    isPermissionsModalOpen,
    closePermissionsModal,
    selectedProject,
    filters,
    resetFilters,
    resurfaceProjectsToPage0,
    isDeleteProjectModalOpen,
    closeDeleteProjectModal,
    handleDeleteProject,
    handleChangeName,
    handleChangeDesc,
    isChangeDescModalOpen,
    isChangeNameModalOpen,
    closeChangeDescModal,
    closeChangeNameModal,
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
    updateFilters,
  } = useProjectsController();

  return (
    <>
      <div className="--flex-col-start">
        <ProjectPageHeader
          resurfaceProjectsToPage0={resurfaceProjectsToPage0}
          allowProjectCreation={allowProjectCreation}
          filters={filters as IResourceFilters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
        />
        <ProjectPageBody
          openRequestAccessModal={openRequestAccessModal}
          openPermissionsModal={openPermissionsModal}
          setSelectedProject={setSelectedProject}
          navigator={navigator}
          projects={projects}
          isEmpty={isEmpty}
          lastElementRef={lastElementRef}
          loading={loading}
          isLoadingMore={isLoadingMore}
          contextMenuItems={contextMenuItems}
          contextMenuStore={contextMenuStore}
          setContextMenuId={setContextMenuId}
        />
      </div>

      {/** ---------MODALS------------ */}
      {isDefined(selectedProject) && isPermissionsModalOpen && (
        <PermissionModel
          id={selectedProject.id}
          open={isPermissionsModalOpen}
          handleClose={closePermissionsModal}
        />
      )}

      {isDefined(selectedProject) && isRequestAccessModalOpen && (
        <RequestAccessModal
          defaultProject={selectedProject}
          isOpen={isRequestAccessModalOpen}
          handleClose={closeRequestAccessModal}
        />
      )}

      {isDefined(selectedProject) && isDeleteProjectModalOpen && (
        <DeleteResourceModal
          resourceName={selectedProject.name}
          icon={<ProjectIcon />}
          isOpen={isDeleteProjectModalOpen}
          close={closeDeleteProjectModal}
          handleDelete={handleDeleteProject}
        />
      )}

      {isDefined(selectedProject) && isChangeDescModalOpen && (
        <ActionModal
          heading={"Change Description"}
          isOpen={isChangeDescModalOpen}
          handleAction={handleChangeDesc}
          prefilled={selectedProject.description || ""}
          close={closeChangeDescModal}
        />
      )}

      {isDefined(selectedProject) && isChangeNameModalOpen && (
        <ActionModal
          heading={"Change Name"}
          prefilled={selectedProject.name || ""}
          isOpen={isChangeNameModalOpen}
          handleAction={handleChangeName}
          close={closeChangeNameModal}
        />
      )}
    </>
  );
};

export default ProjectsV2;

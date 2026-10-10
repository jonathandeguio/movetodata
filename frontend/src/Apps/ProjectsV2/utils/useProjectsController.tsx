import { useTabMetaDataController } from "hooks/useTabIconController";
import { useToggleState } from "hooks/useToggleState";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { copyToClipboard, getLanguageLabel, isDefined } from "utils/utilities";

import { MenuItem, useContextMenuState } from "common/components/ContextMenu";

import {
  FILTER_TYPES,
  useHandleSearchParamsFilters,
} from "Apps/AccessManager/Hooks/useHandleSearchParamsFilters";
import { IProject, Resource } from "Apps/explorer/explorer";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import { Tooltip } from "antd";
import { CopyIcon, EditIcon } from "assets/icons/mtdEditorIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import { CardIcon, TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import useInfiniteScroll from "hooks/useInfiniteScroll";
import React from "react";
import { listProjects } from "../../../redux/actions/projectActions";
import { isProjectAdmin } from "../../../redux/actions/userActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import {
  changeDescProjectAPI,
  deleteProjectAPI,
  getAllProjectsAPI,
  renameProjectAPI,
} from "../Project.api";
import { IResourceFilters } from "../interfaces/Project";
import { getDefaultProjectFilters } from "./Projects.utils";

export const useProjectsController = () => {
  const pageSize = 10;
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { user: allowProjectCreation } = useSelector(
    (state: RootState) => (state as any).projectAdmin
  );
  const navigator = useNavigateHelper();
  const [projects, setProjects] = useState<IProject[]>();
  const [selectedProject, setSelectedProject] = useState<Resource>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMoreDataToShow, setHasMoreDataToShow] = useState(true);
  const [loading, setLoading] = useState(false);

  const { filters, setFilters } = useHandleSearchParamsFilters(
    FILTER_TYPES.RESOURCE
  );
  const [isPermissionsModalOpen, openPermissionsModal, closePermissionsModal] =
    useToggleState(false);

  const [
    isRequestAccessModalOpen,
    openRequestAccessModal,
    closeRequestAccessModal,
  ] = useToggleState(false);

  const [
    isDeleteProjectModalOpen,
    openDeleteProjectModal,
    closeDeleteProjectModal,
  ] = useToggleState(false);

  const [isChangeNameModalOpen, openChangeNameModal, closeChangeNameModal] =
    useToggleState(false);

  const [isChangeDescModalOpen, openChangeDescModal, closeChangeDescModal] =
    useToggleState(false);

  const isEmpty = projects && projects?.length == 0;

  const contextMenuStore = useContextMenuState();
  const [contextMenuId, setContextMenuId] = useState<string>();

  const contextMenuItems: MenuItem[] = [
    {
      icon: <FolderIcon />,
      label: getLanguageLabel("open"),
      onClick: () => contextMenuId && navigator(contextMenuId),
      extra: (
        <Tooltip placement="right" title={getLanguageLabel("openInNewTab")}>
          <div
            onClick={() =>
              contextMenuId && navigator(contextMenuId, {}, {}, true)
            }
          >
            <PopOutIcon />
          </div>
        </Tooltip>
      ),
      type: "PRIMARY",
    },
    {
      label: getLanguageLabel("rename"),
      icon: <EditIcon />,
      onClick: () => {
        setSelectedProject(
          projects?.find((project) => project.id == contextMenuId)
        );
        openChangeNameModal();
      },
      type: "PRIMARY",
    },
    {
      label: getLanguageLabel("changeDescription"),
      icon: <CardIcon />,
      onClick: () => {
        setSelectedProject(
          projects?.find((project) => project.id == contextMenuId)
        );
        openChangeDescModal();
      },
      type: "PRIMARY",
    },
    {
      label: getLanguageLabel("copyId"),
      icon: <CopyIcon />,
      onClick: () => copyToClipboard(contextMenuId),
      type: "PRIMARY",
    },
    {
      label: getLanguageLabel("delete"),
      icon: <TrashIcon color="var(--movetodata-intent-danger)" />,
      onClick: () => {
        setSelectedProject(
          projects?.find((project) => project.id == contextMenuId)
        );
        openDeleteProjectModal();
      },
      type: "PRIMARY",
    },
  ];

  const resurfaceProjects = useCallback(async () => {
    setIsLoadingMore(true);
    const { data } = await getAllProjectsAPI(
      page,
      pageSize,
      filters as IResourceFilters
    );
    if (data.content.length < pageSize) setHasMoreDataToShow(false);
    else setHasMoreDataToShow(true);
    setPage((prev) => prev + 1);
    setProjects((projects) => {
      const newProjects = isDefined(projects)
        ? projects.concat(data.content)
        : [].concat(data.content);

      return newProjects;
    });
    setLoading(false);
    setIsLoadingMore(false);
  }, [page, isLoadingMore, filters]);

  const { lastElementRef } = useInfiniteScroll({
    next: resurfaceProjects,
    isLoading: isLoadingMore,
    hasMore: hasMoreDataToShow,
  });

  const resetFilters = () => {
    setFilters(getDefaultProjectFilters());
  };

  const updateFilters = (key: string, value: string | []) =>
    setFilters((_filter) => {
      return { ..._filter, [key]: value };
    });

  const resurfaceProjectsToPage0 = async () => {
    setLoading(true);
    const { data } = await getAllProjectsAPI(
      0,
      pageSize,
      filters as IResourceFilters
    );
    if (data.content.length < pageSize) setHasMoreDataToShow(false);
    else setHasMoreDataToShow(true);
    setPage(1);
    setProjects(data.content);
    setLoading(false);
  };

  const handleDeleteProject = () => {
    if (selectedProject)
      deleteProjectAPI(selectedProject.id)
        .then(resurfaceProjectsToPage0)
        .catch((error) => console.log("error", error))
        .finally(closeDeleteProjectModal);
  };

  const handleChangeName = (newName: string) => {
    if (selectedProject && newName)
      renameProjectAPI(selectedProject.id, newName)
        .then(resurfaceProjectsToPage0)
        .catch((error) => console.log("error", error))
        .finally(closeChangeNameModal);
  };

  const handleChangeDesc = (newDesc: string) => {
    if (selectedProject && newDesc)
      changeDescProjectAPI(selectedProject.id, newDesc)
        .then(resurfaceProjectsToPage0)
        .catch((error) => console.log("error", error))
        .finally(closeChangeDescModal);
  };

  useEffect(() => {
    resurfaceProjects();
    /**
     * This call will be needed to replaced as its for explorer or
     * needed to be moved to explorer.
     */
    dispatch(listProjects());
    dispatch(isProjectAdmin());
  }, []);

  useEffectOnlyOnDependencyUpdate(() => {
    if (isDefined(projects)) resurfaceProjectsToPage0();
  }, [filters]);

  useTabMetaDataController("PROJECTS");

  return {
    allowProjectCreation,
    isRequestAccessModalOpen,
    openRequestAccessModal,
    closeRequestAccessModal,
    isPermissionsModalOpen,
    closePermissionsModal,
    openPermissionsModal,
    selectedProject,
    setSelectedProject,
    navigator,
    projects,
    isEmpty,
    filters,
    updateFilters,
    lastElementRef,
    loading,
    isLoadingMore,
    pageSize,
    hasMoreDataToShow,
    resurfaceProjects,
    resurfaceProjectsToPage0,
    resetFilters,
    contextMenuStore,
    contextMenuItems,
    setContextMenuId,
    handleDeleteProject,
    isDeleteProjectModalOpen,
    closeDeleteProjectModal,
    isChangeDescModalOpen,
    isChangeNameModalOpen,
    closeChangeDescModal,
    closeChangeNameModal,
    handleChangeName,
    handleChangeDesc,
  };
};

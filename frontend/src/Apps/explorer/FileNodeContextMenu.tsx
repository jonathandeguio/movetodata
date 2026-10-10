import AgentModal from "Apps/Connect/Agents/AgentModal.view";
import { ConnectBuildAPI } from "Apps/Connect/Connect.api";
import LinkModal from "Apps/Connect/Links/LinkModal.view";
import SourceModal from "Apps/Connect/Sources/SourceModal.view";
import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import CreateNewDashboardModal from "Apps/Kepler/utils/CreateNewDashboardModal";
import { Col, Form, Row } from "antd";
import {
  AddIcon,
  BuildIcon,
  CrossIcon,
  LinkIcon,
} from "assets/icons/mtdActionIcons";
import { GraphIcon, GroupedColumnIcon } from "assets/icons/mtdChartIcons";
import { DataAgentsIcon, DatabaseIcon } from "assets/icons/mtdDataIcons";
import {
  CodeCellIcon,
  CopyIcon,
  CutIcon,
  EditIcon,
  PasteIcon,
} from "assets/icons/mtdEditorIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import {
  ChangeLogIcon,
  KeyIcon,
  UploadIcon,
} from "assets/icons/mtdInterfaceIcons";
import {
  CardIcon,
  MonitorIcon,
  TrashIcon,
} from "assets/icons/mtdMiscellaneousIcons";
import { ArrowRightIcon, PopOutIcon } from "assets/icons/mtdNavigationIcon";
import { SortAscIcon, SortDescIcon } from "assets/icons/mtdSortIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";
import { ContextMenu, MenuItem } from "common/components/ContextMenu";
import { ContextMenuStore } from "common/components/ContextMenu/store";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import MtdModal from "components/CommonUI/MtdModalContainer";
import CreateNewChartModal from "components/Modals/CreateNewChartModal";
import CreateNewDatasetModal from "components/Modals/CreateNewDatasetModal";
import CreateNewFolderModal from "components/Modals/CreateNewFolderModal";
import CreateNewRepositoryModal from "components/Modals/CreateNewRepositoryModal";
import UploadNewFileModal from "components/Modals/UploadNewFileModal";
import { FRACTAL_USE_CASES } from "components/editor/editor.constants";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { NULL_UUID } from "utils/Common.constants";
import {
  copyToClipboard,
  getLanguageLabel,
  isEmpty,
  isUseCaseBasedOptionActivate,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { openFileExplorerModal } from "../../redux/ModalSlice";
import {
  setSelectedFileExplorer,
  sortFileExplorer,
} from "../../redux/fileExplorerSlice";
import { updateNameAndDesc, updateParent } from "../../redux/fileIndexSlice";
import { RootState } from "../../redux/types/store";
import { getBuildSpecAPI, moveResource, putResource } from "./explorer.api";
import { useNavigateHelper, usePath } from "./explorer.hooks";

interface TreeNodeContextMenuProps {
  id: string;
  selected: any[];
  setSelected: any;
  store: ContextMenuStore;
}

export const TreeNodeContextMenu: React.FC<TreeNodeContextMenuProps> = ({
  id,
  store,
  selected,
  setSelected,
}) => {
  const selectedState = useSelector(
    (state: RootState) => state.fileExplorer.selected
  );
  const multiSelect = useMemo(
    () => notEmpty(selected) && selected.length > 1,
    [selected]
  );
  const sorting = useSelector((state: RootState) => state.fileExplorer.sorting);
  const desc = useMemo(
    () => (sorting.length > 0 ? sorting[0].desc : false),
    [sorting]
  );
  const sortingId = useMemo(
    () => (sorting.length > 0 ? sorting[0].id : "name"),
    [sorting]
  );
  const [modalProps, setModalProps] = useState({
    open: false,
    heading: "Heading",
    headingIcon: <FolderIcon />,
    footerButtonArea: <></>,
    children: <></>,
  });
  const [searchParams, _] = useSearchParams();
  const queryActiveId = searchParams.get("activeId");

  const contextMenuId = useMemo(() => {
    if (notEmpty(id)) {
      return id;
    } else if (notEmpty(queryActiveId)) {
      return queryActiveId;
    } else {
      return "";
    }
  }, [store, queryActiveId, id]);

  const [resource, setResource] = useState<any>(null);
  const { addToRecycleBin, getFileIndex } = useFileExplorerService();

  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );

  const type = fileIndexes[contextMenuId]?.type;
  const deleted = fileIndexes[contextMenuId]?.status === "IN_TRASH";

  const [value, setValue] = useState<string | boolean>(false);
  const [build, setBuild] = useState<any>();
  const [buildId, setBuildId] = useState(false);
  const [buildLogVisible, setBuildLogVisible] = useState(false);

  const connectAdmin = useSelector(
    (state: RootState) => (state.connectAdmin as any).user
  );

  const { info } = useSelector((state) => (state as any).license);

  const dispatch = useDispatch();
  const navigator = useNavigateHelper();
  const [form] = Form.useForm();

  const cancelHandler = () => {
    setModalProps({
      open: false,
      heading: "",
      headingIcon: <></>,
      footerButtonArea: <></>,
      children: <></>,
    });
  };

  const [getPath] = usePath();

  const submitHandler = () => {
    form.submit();
  };

  const resourceUpdateHandler = () => {
    const body = {
      name: form.getFieldValue("name") ?? undefined,
      description: form.getFieldValue("description") ?? undefined,
    };
    putResource(id, body)
      .then(({ data }) => {
        const updatedData = { ...data };
        dispatch(updateNameAndDesc(updatedData));
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };
  const deleteHandler = (id: string) => {
    addToRecycleBin(id);
  };

  const footerButtons = (
    <>
      <MtdButton
        intent="primary"
        onClick={() => {
          submitHandler();
        }}
        textTransform="none"
      >
        {getLanguageLabel("update")}
      </MtdButton>
    </>
  );

  useEffect(() => {
    if (notEmpty(contextMenuId)) {
      getFileIndex(contextMenuId).then((data) => {
        setResource(data);
      }).catch(() => {});
    }
  }, [contextMenuId, fileIndexes]);

  useEffect(() => {
    if (type?.toLowerCase() === "dataset") {
      getBuildSpecAPI(contextMenuId, "master", NULL_UUID)
        .then(({ data }) => {
          setBuild(data);
        })
        .catch((error) => {});
    }
  }, [contextMenuId]);

  // DATASET SUB MENU
  const datasetChildrenForBuild: MenuItem[] = useMemo(() => {
    if (notEmpty(build)) {
      return [
        {
          label: getLanguageLabel("repository"),
          icon: <CodeCellIcon />,
          onClick: () => {
            window
              .open(
                `/portal/kitab/repository/${build.repository}/${build.branch}?f=${build.scriptPath}`,
                "_blank"
              )
              ?.focus();
          },
          type: multiSelect ? "HIDDEN" : "PRIMARY",
        },
        {
          label: getLanguageLabel("build"),
          icon: <BuildIcon />,
          onClick: () => {
            window
              .open(
                `/portal/kitab/dataset/${build.repository}/${build.branch}`,
                "_blank"
              )
              ?.focus();
          },
          type: multiSelect ? "HIDDEN" : "PRIMARY",
        },
        {
          label: getLanguageLabel("dataLineage"),
          icon: <GraphIcon />,
          onClick: () => {
            window.open(`/portal/bezier/${build.id}/master`, "_blank")?.focus();
          },
          type: multiSelect ? "HIDDEN" : "PRIMARY",
        },
      ];
    }
    return [];
  }, [build]);

  // CONNECT OPTIONS
  const connectOptions: MenuItem[] = useMemo(() => {
    if ("LINK" === type && notEmpty(contextMenuId)) {
      return [
        {
          label: getLanguageLabel("build"),
          icon: <BuildIcon />,
          onClick: () => {
            ConnectBuildAPI(contextMenuId)
              .then(({ data }) => {
                setBuildId(data.id);
                setBuildLogVisible(true);
              })
              .catch(({ response }) => {
                openNotification(
                  response.data.error,
                  response.data.description,
                  "error"
                );
              });
          },
          type: multiSelect ? "HIDDEN" : "PRIMARY",
        },
      ];
    }
    return [];
  }, [contextMenuId]);

  // CONNECT SUB MENU
  const connectChildren: MenuItem[] = useMemo(() => {
    if (connectAdmin) {
      return [
        {
          label: "DIVIDER",
          icon: <></>,
          onClick: () => {},
          type: "PRIMARY",
        },
        {
          label: getLanguageLabel("dataLinks"),
          icon: <LinkIcon />,
          onClick: () => {
            setValue("link");
          },
          type: "PRIMARY",
        },

        {
          label: getLanguageLabel("dataSource"),
          icon: <DatabaseIcon />,
          onClick: () => {
            setValue("source");
          },
          type: "PRIMARY",
        },
        {
          label: getLanguageLabel("agent"),
          icon: <DataAgentsIcon />,
          onClick: () => {
            setValue("agent");
          },
          type: "PRIMARY",
        },
      ];
    }
    return [];
  }, [connectAdmin]);

  // MAIN MENU
  const contextMenuItems: MenuItem[] = [
    {
      icon: <FolderIcon />,
      label: getLanguageLabel("open"),
      onClick: () => {
        if (notEmpty(id)) navigator(id);
      },
      extra: (
        <MtdButton
          icon={<PopOutIcon />}
          minimal
          icononly
          onClick={() => {
            if (notEmpty(id)) navigator(id, {}, {}, true);
          }}
        />
      ),
      type: multiSelect ? "HIDDEN" : notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    {
      label: getLanguageLabel("new") + " " + getLanguageLabel("chart"),
      icon: <GroupedColumnIcon />,
      type:
        ["DATASET"].includes(type) &&
        isUseCaseBasedOptionActivate(
          "KEPLER",
          info.displayBlockedFeatures,
          info.product
        )
          ? "PRIMARY"
          : "HIDDEN",
      onClick: () => {
        setValue("datasetChart");
      },
      extra: KEPLER_USE_CASES.includes(info.product) ? <></> : <KeyIcon />,
    },
    // NEW BUTTON SUB MENU
    {
      icon: <AddIcon />,
      label: getLanguageLabel("new"),
      onClick: () => {},
      type: multiSelect
        ? "HIDDEN"
        : !["PROJECT", "FOLDER"].includes(type)
        ? "HIDDEN"
        : "PRIMARY",
      submenu: [
        {
          label: getLanguageLabel("folder"),
          icon: <FolderIcon />,
          type: "PRIMARY",
          onClick: () => {
            setValue("folder");
          },
        },
        {
          label: getLanguageLabel("fileUpload"),
          icon: <UploadIcon />,
          type: "PRIMARY",
          onClick: () => {
            setValue("file");
          },
        },
        {
          label: "DIVIDER",
          onClick: () => {},
          type: "PRIMARY",
          icon: <></>,
        },
        {
          label: getLanguageLabel("dataset"),
          icon: <TableIcon />,
          type: "PRIMARY",
          onClick: () => {
            setValue("dataset");
          },
        },
        {
          label: getLanguageLabel("repository"),
          icon: <CodeCellIcon />,
          onClick: () => {
            setValue("repository");
          },
          type: isUseCaseBasedOptionActivate(
            "FRACTAL",
            info.displayBlockedFeatures,
            info.product
          )
            ? "PRIMARY"
            : "HIDDEN",
          extra: FRACTAL_USE_CASES.includes(info.product) ? <></> : <KeyIcon />,
        },

        {
          label: getLanguageLabel("chart"),
          icon: <GroupedColumnIcon />,
          onClick: () => {
            setValue("chart");
          },
          type: isUseCaseBasedOptionActivate(
            "KEPLER",
            info.displayBlockedFeatures,
            info.product
          )
            ? "PRIMARY"
            : "HIDDEN",
          extra: KEPLER_USE_CASES.includes(info.product) ? <></> : <KeyIcon />,
        },
        {
          label: getLanguageLabel("dashboard"),
          icon: <MonitorIcon />,
          onClick: () => {
            setValue("dashboard");
          },
          type: isUseCaseBasedOptionActivate(
            "KEPLER",
            info.displayBlockedFeatures,
            info.product
          )
            ? "PRIMARY"
            : "HIDDEN",
          extra: KEPLER_USE_CASES.includes(info.product) ? <></> : <KeyIcon />,
        },
        ...connectChildren,
      ],
    },
    {
      icon: <EditIcon />,
      label: getLanguageLabel("rename"),
      onClick: () => {
        form.setFieldValue("name", resource?.name);
        if (notEmpty(id)) {
          setModalProps({
            open: true,
            heading: getLanguageLabel("rename"),
            headingIcon: <EditIcon />,
            footerButtonArea: footerButtons,
            children: (
              <Form
                form={form}
                onFinish={() => {
                  resourceUpdateHandler();
                  form.setFieldsValue({});
                  cancelHandler();
                }}
              >
                <Form.Item
                  name="name"
                  initialValue={resource?.name}
                  label={getLanguageLabel("newName")}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <MtdInput autoselect />
                </Form.Item>
              </Form>
            ),
          });
        }
      },
      type: multiSelect ? "HIDDEN" : notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <CardIcon />,
      label: getLanguageLabel("changeDescription"),
      onClick: () => {
        form.setFieldValue(
          "description",
          notEmpty(resource.description)
            ? resource.description
            : getLanguageLabel("changeDescription")
        );

        if (notEmpty(id)) {
          setModalProps({
            open: true,
            heading: getLanguageLabel("changeDescription"),
            headingIcon: <CardIcon />,
            footerButtonArea: footerButtons,
            children: (
              <Form
                form={form}
                onFinish={() => {
                  resourceUpdateHandler();
                  form.setFieldsValue({});
                }}
              >
                <Form.Item
                  name="description"
                  label={getLanguageLabel("newDescription")}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <MtdInput autoselect />
                </Form.Item>
              </Form>
            ),
          });
        }
      },
      type: multiSelect ? "HIDDEN" : notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    ...connectOptions,
    ...datasetChildrenForBuild,
    // SORT SUB MENU
    {
      icon: <ChangeLogIcon />,
      label: getLanguageLabel("sort"),
      onClick: () => {},
      submenu: [
        {
          icon: <SortAscIcon />,
          label: getLanguageLabel("sortAscending"),
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: sortingId,
                    desc: false,
                  },
                ],
              })
            );
          },
          type: desc ? "PRIMARY" : "ACTIVE",
        },
        {
          icon: <SortDescIcon />,
          label: getLanguageLabel("sortDescending"),
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: sortingId,
                    desc: true,
                  },
                ],
              })
            );
          },
          type: desc ? "ACTIVE" : "PRIMARY",
        },
        {
          label: "DIVIDER",
          icon: <></>,
          onClick: () => {},
          type: "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "name",
                    desc,
                  },
                ],
              })
            );
          },
          label: getLanguageLabel("name"),
          type: sortingId === "name" ? "ACTIVE" : "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "size",
                    desc,
                  },
                ],
              })
            );
          },

          label: getLanguageLabel("size"),
          type: sortingId === "size" ? "ACTIVE" : "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "createdBy",
                    desc,
                  },
                ],
              })
            );
          },

          label: getLanguageLabel("createdBy"),
          type: sortingId === "createdBy" ? "ACTIVE" : "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "createdAt",
                    desc,
                  },
                ],
              })
            );
          },

          label: getLanguageLabel("createdAt"),
          type: sortingId === "createdAt" ? "ACTIVE" : "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "updatedBy",
                    desc,
                  },
                ],
              })
            );
          },

          label: getLanguageLabel("updatedBy"),
          type: sortingId === "updatedBy" ? "ACTIVE" : "PRIMARY",
        },
        {
          icon: <></>,
          onClick: () => {
            dispatch(
              sortFileExplorer({
                sorting: [
                  {
                    id: "updatedAt",
                    desc,
                  },
                ],
              })
            );
          },

          label: getLanguageLabel("updatedAt"),
          type: sortingId === "updatedAt" ? "ACTIVE" : "PRIMARY",
        },
      ],
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      icon: <ArrowRightIcon />,
      label: getLanguageLabel("move"),
      onClick: () => {
        if (notEmpty(id) && resource?.type !== "PROJECT") {
          dispatch(
            openFileExplorerModal({
              action: ({ id: explorerId }) => {
                if (notEmpty(id)) {
                  moveResource(id, explorerId)
                    .then(({ data }) => {
                      dispatch(updateParent(data));
                    })
                    .catch(({ response }) => {
                      openNotification(
                        response.data.error,
                        response.data.description,
                        "error"
                      );
                    });
                }
              },
              type: ["FOLDER"],
              activeId: id,
              projectSwitchAllowed: false,
            })
          );
        }
      },
      type: multiSelect
        ? "HIDDEN"
        : notEmpty(id) && resource?.type !== "PROJECT"
        ? "PRIMARY"
        : "DISABLED",
    },
    {
      label: `${getLanguageLabel("cut")} ${
        multiSelect ? "(" + selected.length + ")" : ""
      }`,
      icon: <CutIcon />,
      onClick: () => {
        dispatch(
          setSelectedFileExplorer({
            action: "CUT",
            list: selected,
          })
        );

        setSelected([]);
      },
      type: notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    {
      label: getLanguageLabel("paste"),
      icon: <PasteIcon />,
      onClick: () => {
        if (selectedState.action === "COPY") {
          openNotification(
            "Sorry!",
            "This action is not supported yet",
            "info"
          );
        } else if (selectedState.action === "CUT") {
          selectedState.list.forEach((s: any) => {
            moveResource(s, contextMenuId)
              .then(({ data }) => {
                dispatch(updateParent(data));
              })
              .catch(({ response }) => {
                openNotification(
                  response.data.error,
                  response.data.description,
                  "error"
                );
              });
          });
        }
        dispatch(
          setSelectedFileExplorer({
            action: "SELECTED",
            list: [],
          })
        );
      },
      type: selectedState.list.length == 0 ? "DISABLED" : "PRIMARY",
    },
    // COPY PART
    {
      label: "DIVIDER",
      icon: <></>,
      onClick: () => {},
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      label: `${getLanguageLabel("copy")} ${
        multiSelect ? "(" + selected.length + ")" : ""
      }`,
      icon: <CopyIcon />,
      onClick: () => {
        dispatch(
          setSelectedFileExplorer({
            action: "COPY",
            list: selected,
          })
        );
        setSelected([]);
      },
      type: notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copyLink"),
      onClick: () => {
        navigator(contextMenuId, {}, {}, true, false).then((resStr) => {
          copyToClipboard(resStr);
        });
      },
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copyPath"),
      onClick: () => {
        getFileIndex(contextMenuId).then((data) => {
          copyToClipboard(
            ["/Projects", ...getPath(data).map((p) => p.name)].join("/")
          );
        });
      },
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copyId"),
      onClick: () => {
        copyToClipboard(contextMenuId);
      },
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      label: "DIVIDER",
      icon: <></>,
      onClick: () => {},
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      icon: <TrashIcon color={"var(--movetodata-intent-danger)"} />,
      label: `${getLanguageLabel("delete")} ${
        multiSelect ? "(" + selected.length + ")" : ""
      }`,
      onClick: () => {
        if (multiSelect) {
          selected.forEach((s) => {
            deleteHandler(s);
          });
          setSelected([]);
        } else {
          deleteHandler(id);
        }
      },
      type:
        notEmpty(id) && resource?.type !== "PROJECT" ? "DANGER" : "DISABLED",
    },
  ];

  const contextMenuRef = useRef<any>();

  if (deleted || isEmpty(contextMenuId)) return <></>;
  return (
    <>
      <div ref={contextMenuRef}>
        <ContextMenu items={contextMenuItems} {...store} />
      </div>
      <MtdModal destroyOnClose onCancel={cancelHandler} {...modalProps} />
      <CreateNewChartModal
        defaultParent={contextMenuId}
        isVisible={value == "chart"}
        setIsVisible={setValue}
        branch={"master"}
      />
      <CreateNewChartModal
        isVisible={value == "datasetChart"}
        setIsVisible={setValue}
        branch={"master"}
        id={contextMenuId}
      />
      <CreateNewDashboardModal
        id={contextMenuId}
        createDashboardModal={value == "dashboard"}
        setCreateDashboardModal={setValue}
        redirect={true}
      />
      <CreateNewFolderModal
        destroyOnClose
        id={contextMenuId}
        isVisible={value == "folder"}
        setIsVisible={setValue}
      />
      <CreateNewRepositoryModal
        destroyOnClose
        id={contextMenuId}
        isVisible={value == "repository"}
        setIsVisible={setValue}
      />
      <CreateNewDatasetModal
        destroyOnClose
        id={contextMenuId}
        isVisible={value == "dataset"}
        setIsVisible={setValue}
      />

      {value == "file" && (
        <UploadNewFileModal
          destroyOnClose
          id={contextMenuId}
          isVisible={value == "file"}
          setIsVisible={setValue}
        />
      )}

      <LinkModal
        destroyOnClose
        defaultParent={contextMenuId}
        isVisible={value == "link"}
        setIsVisible={setValue}
      />
      <AgentModal
        destroyOnClose
        defaultParent={contextMenuId}
        isVisible={value == "agent"}
        setIsVisible={setValue}
      />
      <SourceModal
        destroyOnClose
        defaultParent={contextMenuId}
        isVisible={value == "source"}
        setIsVisible={setValue}
      />
      <MtdModal
        open={buildLogVisible}
        headingIcon={<BuildIcon />}
        heading={
          <Row justify={"space-between"} align="middle">
            <Col>{getLanguageLabel("buildLog")}</Col>
          </Row>
        }
        extraActionHeading={
          <MtdButton
            icon={<CrossIcon />}
            icononly
            trimicononlypadding
            minimal
            onClick={() => setBuildLogVisible(false)}
          ></MtdButton>
        }
        width={"80%"}
        onCancel={() => setBuildLogVisible(false)}
      >
        <BuildDetailsTable
          id={buildId as any}
          showHeader={false}
          page="DATASET"
        />
      </MtdModal>
    </>
  );
};

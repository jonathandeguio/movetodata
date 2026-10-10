import { Form, Select, Switch, Tooltip } from "antd";
import {
  AddIcon,
  CrossIcon,
  HistoryIcon,
} from "assets/icons/mtdActionIcons";
import { AllProjectsIcon, DatabaseIcon } from "assets/icons/mtdDataIcons";
import {
  CodeCellIcon,
  EditIcon,
  TextIcon,
} from "assets/icons/mtdEditorIcons";
import {
  JupyterIcon,
  MarkDownIcon,
  PythonIcon,
} from "assets/icons/mtdExternalIcons";
import { DocsIcon, FolderIcon } from "assets/icons/mtdFileIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { CopyCellIcon } from "assets/icons/mtdTableIcons";
import { openBottomBarItem } from "common/components/MtdLayout/bottomBarSlice";
import { ContextMenu, MenuItem } from "common/components/ContextMenu";
import { ContextMenuStore } from "common/components/ContextMenu/store";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { ChangeEvent, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  decodeFromBase64,
  getLanguageLabel,
  getStringWithAllowedChars,
  getUserLanguage,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";
import {
  closeRepositoryEditorPane,
  createOrUpdateRepositoryEditorPane,
} from "../../redux/repositoryEditorSlice";
import store from "../../redux/store";
import { RootState } from "../../redux/types/store";
import GitLens from "./components/GitLens";
import {
  autoSave,
  deleteRepoFile,
  getFileContentAPI,
  makeCopy,
  renameApi,
} from "./editor.api";
import {
  IPYNB_EMPTY_TEMPLATE,
  IPYNB_EN_TEMPLATE,
  IPYNB_FR_TEMPLATE,
  PYTHON_TEMPLATE,
  SQL_TEMPLATE,
} from "./editor.constants";
import { getFileExtensionBasedSubType } from "./editor.utils";

interface EditorTreeContextMenuProps {
  node: any;
  repo: string;
  branch: string;
  onClick?: (node: any) => void;
  refreshTree: (id?: string, branch?: string) => void;
  store: ContextMenuStore;
}
const state = store.getState();

export const EditorTreeContextMenu: React.FC<EditorTreeContextMenuProps> = ({
  node,
  repo,
  branch,
  onClick,
  refreshTree,
  store,
}) => {
  const [modalProps, setModalProps] = useState({
    open: false,
    heading: "Heading",
    headingIcon: <FolderIcon />,
    footerButtonArea: <></>,
    children: <></>,
  });

  const cancelHandler = () => {
    setModalProps({
      open: false,
      heading: "",
      headingIcon: <></>,
      footerButtonArea: <></>,
      children: <></>,
    });
  };

  const createCopy = async () => {
    makeCopy(repo, branch, node.path)
      .then(({ data }) => {
        refreshTree(repo, branch);
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  const onFormNameEnter = (
    event: ChangeEvent<HTMLInputElement>,
    form: any
  ): void => {
    const modifiedValue: string = getStringWithAllowedChars(event.target.value);
    form.setFieldValue(event.target.name, modifiedValue);

    //Brings the pointer to the original position
    const pointer = event.target.selectionStart;
    const element = event.target;
    window.requestAnimationFrame(() => {
      element.selectionStart = pointer;
      element.selectionEnd = pointer;
    });
  };

  const { editorPanes } = useSelector(
    (state: RootState) => state.repositoryEditor
  );
  const { tabContext } = useSelector((state: RootState) => state.bottomBar);

  const dispatch = useDispatch();

  const [newFileForm] = Form.useForm();
  const [newFolderForm] = Form.useForm();
  const [renameForm] = Form.useForm();

  const folderOptions: MenuItem[] = [
    {
      icon: <AddIcon />,
      label: getLanguageLabel("new"),
      type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
      onClick: () => {},
      submenu: [
        {
          icon: <FolderIcon />,
          label: getLanguageLabel("folder"),
          onClick: () => {
            setModalProps({
              open: true,
              heading: getLanguageLabel("newFolder"),
              headingIcon: <AddIcon />,
              children: (
                <Form
                  form={newFolderForm}
                  name="newFolder"
                  onFinish={() => {
                    autoSave(
                      repo,
                      branch,
                      node?.path +
                        "/" +
                        newFolderForm.getFieldValue("folderName") +
                        "/.gitkeep",
                      ""
                    )
                      .then((data) => {
                        refreshTree(repo, branch);
                        newFolderForm.resetFields();
                      })
                      .catch(({ response }) => {
                        openNotification(
                          response.data.error,
                          response.data.description,
                          "error"
                        );
                      })
                      .finally(() => {
                        cancelHandler();
                      });
                  }}
                >
                  <Form.Item
                    name="folderName"
                    label={getLanguageLabel("newFolder")}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                    style={{ margin: 0 }}
                  >
                    <MtdInput
                      name="folderName"
                      onChange={(e) => onFormNameEnter(e, newFolderForm)}
                    />
                  </Form.Item>
                </Form>
              ),
              footerButtonArea: (
                <MtdButton
                  intent="action"
                  icon={<AddIcon />}
                  onClick={() => {
                    newFolderForm.submit();
                  }}
                >
                  {getLanguageLabel("create")}
                </MtdButton>
              ),
            });
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <PythonIcon />,
          label: <>Python (*.py)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "py");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <DatabaseIcon />,
          label: <>Sql (*.sql)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "sql");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <TextIcon />,
          label: <>TXT (*.txt)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "txt");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <MarkDownIcon />,
          label: <>Markdown (*.md)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "md");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <DocsIcon />,
          label: <>YAML (*.yml)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "yml");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <JupyterIcon />,
          label: <>Notebook (*.ipynb)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "ipynb");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
        {
          icon: <AllProjectsIcon />,
          label: <>{getLanguageLabel("file")} (any *.*)</>,
          onClick: () => {
            handleNewFileModalUpdate();
            newFileForm.setFieldValue("fileType", "any");
          },
          type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        },
      ],
    },
  ];

  const fileOptions: MenuItem[] = useMemo(
    () => [
      {
        icon: <CodeCellIcon />,
        label: "git",
        onClick: () => {},
        type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
        submenu: [
          {
            icon: <HistoryIcon />,
            label: "Show File History",
            onClick: () => {
              dispatch(openBottomBarItem("gitLens"));
              console.log("first", tabContext);
              tabContext["gitLens"]?.openNewPane([
                {
                  children: <GitLens path={node?.path} />,
                  closable: true,
                  label: `${node?.name} (History)`,
                  icon: <HistoryIcon />,
                  paneKey: `${node?.name}-(History)`,
                },
              ]);
            },
            type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
          },
          {
            icon: <></>,
            label: "Compare with a branch",
            onClick: () => {
              getFileContentAPI(
                repo,
                "5875d0e3b096dfc1390aeedaa402ec3313ca099c",
                node.path
              ).then(({ data }) => {
                dispatch(
                  createOrUpdateRepositoryEditorPane({
                    ...editorPanes[node.path],
                    id:
                      node.path +
                      "DIFF" +
                      "5875d0e3b096dfc1390aeedaa402ec3313ca099c",
                    originalContent: decodeFromBase64(data["fileContents.b64"]),
                    paneType: "DIFF_EDITOR",
                  })
                );
              });
            },
            type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
          },
          {
            icon: <></>,
            label: "Compare with a revision",
            onClick: () => {},
            type: isDefined(node?.id) ? "PRIMARY" : "DISABLED",
          },
        ],
      },
    ],
    [tabContext, node, repo, editorPanes]
  );

  const contextMenuItems: MenuItem[] = [
    ...(node?.type === "FOLDER" ? folderOptions : []),
    {
      icon: <CopyCellIcon />,
      label: getLanguageLabel("duplicate"),
      onClick: () => {
        if (isDefined(node?.id) && node?.subType !== "REPOSITORY") {
          createCopy();
        }
      },
      type:
        isDefined(node?.id) && node?.subType !== "REPOSITORY"
          ? "PRIMARY"
          : "DISABLED",
    },
    {
      icon: <EditIcon />,
      label: getLanguageLabel("rename"),
      onClick: () => {
        if (isDefined(node?.id) && node?.subType !== "REPOSITORY") {
          renameForm.setFieldValue("fileName", node?.name);
          setModalProps({
            open: true,
            heading: getLanguageLabel("rename"),
            headingIcon: <EditIcon />,
            children: (
              <Form
                form={renameForm}
                name="rename"
                onFinish={() => {
                  renameApi(
                    repo,
                    branch,
                    node?.path,
                    renameForm.getFieldValue("fileName")
                  )
                    .then(() => {
                      Object.keys(editorPanes)
                        .filter((key) => key === node?.path)
                        .map((key) => {
                          dispatch(
                            createOrUpdateRepositoryEditorPane({
                              ...editorPanes[key],
                              fileName: renameForm.getFieldValue("fileName"),
                            })
                          );
                        });
                    })
                    .then(() => {
                      // openNotification(
                      //   "Rename",
                      //   "File Renamed SuccessFully",
                      //   "info"
                      // );
                      refreshTree(repo, branch);
                    })
                    .catch(({ response }) => {
                      openNotification(
                        response.data.error,
                        response.data.description,
                        "error"
                      );
                    })
                    .finally(() => {
                      cancelHandler();
                    });
                }}
              >
                <Form.Item
                  name="fileName"
                  label={"New Name"}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  style={{ margin: 0 }}
                >
                  <MtdInput
                    name="fileName"
                    onChange={(e) => onFormNameEnter(e, renameForm)}
                  />
                </Form.Item>
              </Form>
            ),
            footerButtonArea: (
              <MtdButton
                intent="action"
                icon={<EditIcon />}
                onClick={() => {
                  renameForm.submit();
                }}
              >
                {getLanguageLabel("rename")}
              </MtdButton>
            ),
          });
        }
      },
      type:
        isDefined(node?.id) && node?.subType !== "REPOSITORY"
          ? "PRIMARY"
          : "DISABLED",
    },
    {
      icon: <TrashIcon />,
      label: getLanguageLabel("delete"),
      onClick: () => {
        if (isDefined(node?.id) && node?.subType !== "REPOSITORY") {
          setModalProps({
            open: true,
            heading: getLanguageLabel("areYouSureYouWantToDeleteThis?"),
            headingIcon: <TrashIcon />,

            children: <>{getLanguageLabel("file") + ": " + node.path}</>,
            footerButtonArea: (
              <MtdButton
                icon={<TrashIcon />}
                intent="dangerous"
                onClick={() => {
                  deleteRepoFile(repo, branch, node.path)
                    .then(() => {
                      console.log("refreshing tree");
                      Object.keys(editorPanes)
                        .filter((key) => key === node?.path)
                        .map((key) => {
                          dispatch(closeRepositoryEditorPane(key));
                        });
                    })
                    .then(() => {
                      console.log("refreshing tree");
                      refreshTree(repo, branch);
                    })
                    .catch(({ response }) => {
                      openNotification(
                        response.data.error,
                        response.data.description,
                        "error"
                      );
                    })
                    .finally(() => {
                      cancelHandler();
                    });
                }}
              >
                {getLanguageLabel("delete")}
              </MtdButton>
            ),
          });
        }
      },
      type:
        isDefined(node?.id) && node?.subType !== "REPOSITORY"
          ? "DANGER"
          : "DISABLED",
    },
    ...(node?.type !== "FOLDER" ? fileOptions : []),
  ];

  const handleNewFileModalUpdate = () => {
    setModalProps({
      open: true,
      heading: getLanguageLabel("newFile"),
      headingIcon: <AddIcon />,
      children: (
        <Form
          form={newFileForm}
          name="newFile"
          labelAlign="left"
          initialValues={{ includeBoilerPlateCode: false }}
          onFinish={() => {
            newFileForm.getFieldValue("includeBoilerPlateCode");
            createNewFile(
              newFileForm.getFieldValue("fileName"),
              node?.path,
              newFileForm.getFieldValue("fileType"),
              newFileForm.getFieldValue("includeBoilerPlateCode")
            );
          }}
        >
          <Form.Item
            name="fileName"
            rules={[
              {
                required: true,
              },
            ]}
            style={{ margin: 0 }}
          >
            <MtdInput
              name="fileName"
              onChange={(e) => onFormNameEnter(e, newFileForm)}
              placeholder={getLanguageLabel("newFile")}
            />
          </Form.Item>
          <br />
          <Form.Item
            name="fileType"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select defaultValue="py">
              <Select.Option value={"py"}>
                <div className="text-and-icon-center">
                  <PythonIcon /> Python (*.py)
                </div>
              </Select.Option>
              <Select.Option value={"sql"}>
                <div className="text-and-icon-center">
                  <DatabaseIcon />
                  Sql (*.sql)
                </div>
              </Select.Option>
              <Select.Option value={"txt"}>
                <div className="text-and-icon-center">
                  <TextIcon />
                  TXT (*.txt)
                </div>
              </Select.Option>
              <Select.Option value={"md"}>
                <div className="text-and-icon-center">
                  <MarkDownIcon />
                  Markdown (*.md)
                </div>
              </Select.Option>
              <Select.Option value={"yml"}>
                <DocsIcon />
                YAML (*.yml)
              </Select.Option>
              <Select.Option value={"ipynb"}>
                <div className="text-and-icon-center">
                  <JupyterIcon />
                  Notebook (*.ipynb)
                </div>
              </Select.Option>
              <Select.Option value={"any"}>
                <div className="text-and-icon-center">
                  <AllProjectsIcon /> {getLanguageLabel("file")} (any *.*)
                </div>
              </Select.Option>
            </Select>
          </Form.Item>
          <Tooltip title={getLanguageLabel("boilerplateOption")} placement="bottom">
          <Form.Item
            name={"includeBoilerPlateCode"}
            label={"Template"}
            colon
            labelCol={{ span: 8 }}
            valuePropName="unchecked"
          >
            <Switch size="small"/>
          </Form.Item>
          </Tooltip>
        </Form>
      ),
      footerButtonArea: (
        <>
          <MtdButton
            intent="none"
            icon={<CrossIcon />}
            onClick={() => {
              cancelHandler();
            }}
          >
            {getLanguageLabel("cancel")}
          </MtdButton>
          <MtdButton
            intent="action"
            icon={<AddIcon />}
            onClick={() => {
              newFileForm.submit();
            }}
          >
            {getLanguageLabel("create")}
          </MtdButton>
        </>
      ),
    });
  };

  const createNewFile = (
    fileName: string,
    filePath: string,
    fileType: string,
    includeBoilerPlateCode: boolean
  ) => {
    if (notEmpty(fileName)) {
      const ext = fileName.split(".").pop();
      if (fileType != "any") fileName += "." + fileType;
      else if (ext) fileType = ext;

      let template = "";

      if (fileType == "py" && includeBoilerPlateCode)
        template = PYTHON_TEMPLATE;
      else if (fileType == "ipynb") {
        if (!includeBoilerPlateCode) template = IPYNB_EMPTY_TEMPLATE;
        else if (getUserLanguage(state.userDetails?.user) == "fr") {
          template = IPYNB_FR_TEMPLATE;
        } else {
          template = IPYNB_EN_TEMPLATE;
        }
      } else if (fileType == "sql" && includeBoilerPlateCode)
        template = SQL_TEMPLATE;

      autoSave(repo, branch, filePath + "/" + fileName, template)
        .then((data) => {
          refreshTree(repo, branch);
          onClick?.({
            name: fileName,
            path: filePath + "/" + fileName,
            subType: getFileExtensionBasedSubType(fileType),
          });
          newFileForm.resetFields();
        })
        .catch(({ response }) => {
          openNotification(
            response.data.error,
            response.data.description,
            "error"
          );
        })
        .finally(() => {
          cancelHandler();
        });
    } else {
      openNotification("Name can't be empty", "Please enter a name", "info");
    }
  };
  return (
    <>
      <ContextMenu items={contextMenuItems} {...store} />
      <MtdModal onCancel={cancelHandler} {...modalProps} />
    </>
  );
};

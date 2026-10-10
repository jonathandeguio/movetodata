import { formatDateAgo } from "Apps/explorer/explorer.utils";
import { Tooltip } from "antd";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import { EyeIcon, HistoryIcon } from "assets/icons/mtdActionIcons";
import { GitCommitIcon } from "assets/icons/mtdExternalIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronDownIcon,
  SingleChevronRightIcon,
  UndoIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import NoData from "components/CommonUI/NoData";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import {
  decodeFromBase64,
  getLanguageLabel,
  isDefined,
  openNotification,
} from "utils/utilities";
import { createOrUpdateRepositoryEditorPane } from "../../../../redux/repositoryEditorSlice";
import {
  checkout,
  gitCommitDetails,
  gitFileCommitDetails,
} from "../../editor.api";
import { getFileHistoryApi, getLogsApi } from "./GitLens.api";
import "./GitLens.scss";
import { getClassNameByChange } from "./GitLens.utils";
import { IGitCommitDetails, IGitLens, IGitLog } from "./types";

const DiffFile = (detail: IGitCommitDetails & { commitId: string }) => {
  const { id } = useParams();
  const [isOpen, setOpen] = useState<boolean>(false);
  const dispatch = useDispatch();

  const toggleFile = () => setOpen((open) => !open);

  return (
    <div className="file">
      <div
        className={`file__header file__header${getClassNameByChange(
          detail.changeType
        )}`}
      >
        <div onClick={toggleFile} className="file__header__info">
          {isOpen ? <SingleChevronDownIcon /> : <SingleChevronRightIcon />}
          {detail.changeType === "DELETE" ? detail.oldPath : detail.newPath}
          &nbsp;&nbsp;&nbsp;(
          {detail.changeType.toLocaleLowerCase()})
        </div>
        <div className="file__header__action">
          <Tooltip placement="topLeft" title="Show File Comparison">
            <div
              onClick={() => {
                if (isDefined(id) && isDefined(detail.commitId))
                  gitFileCommitDetails(
                    id,
                    detail.commitId,
                    detail.changeType === "DELETE"
                      ? detail.oldPath
                      : detail.newPath
                  ).then(({ data }) => {
                    dispatch(
                      createOrUpdateRepositoryEditorPane({
                        content: decodeFromBase64(data.updatedContent),
                        originalContent: decodeFromBase64(data.oldContent),
                        fileName: "File Diff",
                        type: "PY",
                        paneType: "DIFF_EDITOR",
                        gitBlame: [],
                        id: "asasd",
                        path:
                          detail.changeType === "DELETE"
                            ? detail.oldPath
                            : detail.newPath,
                      })
                    );
                  });
              }}
            >
              <EyeIcon size={16} />
            </div>
          </Tooltip>
        </div>
      </div>
      {isOpen && (
        <div className="file__content">
          {detail.content.split("\n").map((line, index) => {
            if (index < 4) return <></>;
            return <div className="file__content__line">{line}</div>;
          })}
        </div>
      )}
    </div>
  );
};

export const GitLens = ({ path }: IGitLens) => {
  const { id, branch } = useParams();
  const navigate = useNavigate();

  const [groupedGitLog, setGroupedGitLog] =
    useState<Record<string, IGitLog[]>>();
  const [commitDetails, setCommitDetails] = useState<
    IGitCommitDetails[] | null
  >(null);
  const [activeCommit, setActiveCommit] = useState<string | null>(null);

  const [modalProps, setModalProps] = useState({
    open: false,
    heading: "Reset to old commit?",
    headingIcon: <TrashIcon />,
    footerButtonArea: <></>,
    children: <></>,
  });

  function groupByDay(array: IGitLog[]) {
    const groupedData: Record<string, IGitLog[]> = {};

    array.forEach((item) => {
      const commitDate = new Date(item.commitTime * 1000);
      const commitDay = new Date(
        commitDate.getFullYear(),
        commitDate.getMonth(),
        commitDate.getDate()
      );

      const formattedDate = commitDay.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (!groupedData[formattedDate]) {
        groupedData[formattedDate] = [];
      }

      groupedData[formattedDate].push(item);
    });

    return groupedData;
  }

  useEffect(() => {
    if (isDefined(id) && isDefined(branch)) {
      if (isDefined(path)) {
        getFileHistoryApi(id, path).then(({ data }) => {
          setGroupedGitLog(groupByDay(data));
        });
      } else {
        getLogsApi(id, branch).then(({ data }) => {
          setGroupedGitLog(groupByDay(data));
        });
      }
    }
  }, [id, path, branch]);

  useEffect(() => {
    if (isDefined(activeCommit) && isDefined(id)) {
      gitCommitDetails(id, activeCommit).then(({ data }) => {
        data.sort((a: any, b: any) =>
          (a.changeType === "DELETE" ? a.oldPath : a.newPath) === path ?? ""
            ? -1
            : (b.changeType === "DELETE" ? b.oldPath : b.newPath) === path ?? ""
            ? 1
            : 0
        );
        setCommitDetails(data);
      });
    }
  }, [path, activeCommit, id]);

  return (
    <div className="gitLens">
      <div className="gitLens__left">
        {isDefined(path) && (
          <div className="file__path">
            <HistoryIcon />
            History for file `{path}`
          </div>
        )}
        {isDefined(groupedGitLog) &&
          Object.keys(groupedGitLog)?.map((date) => {
            return (
              <>
                <div className="time__container">
                  <div className="time">
                    <GitCommitIcon />
                    Commits on {date}
                  </div>
                </div>

                <div className="commit__group">
                  {groupedGitLog[date].map((item) => {
                    var utcSeconds = item.commitTime;
                    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                    d.setUTCSeconds(utcSeconds);

                    return (
                      <div
                        className={`commit ${
                          activeCommit === item.id ? "commit--active" : ""
                        }`}
                        onClick={() => setActiveCommit(item.id)}
                      >
                        <div className="commit__info">
                          <div className="commit__message">{item.message}</div>
                          <div className="commit__author">
                            <div className="commit__author__name">
                              {item.username}
                            </div>
                            <div className="commit__author__time">
                              &nbsp;authored {formatDateAgo(d)}
                            </div>
                          </div>
                        </div>
                        <div className="commit__actions">
                          <Tooltip
                            placement="topRight"
                            title={"Click hard reset files to this point"}
                          >
                            <MtdButton
                              icononly
                              minimal
                              onClick={() => {
                                if (isDefined(id) && isDefined(branch)) {
                                  setModalProps({
                                    open: true,
                                    heading: "Reset to old commit?",

                                    headingIcon: <TrashIcon />,

                                    footerButtonArea: (
                                      <MtdButton
                                        intent="dangerous"
                                        onClick={() => {
                                          checkout(id, branch, item.id)
                                            .then(() => {
                                              openNotification(
                                                "Checkout",
                                                "Checkout Successful",
                                                "success"
                                              );
                                              window.location.reload();
                                            })
                                            .catch(({ response }) => {
                                              openNotification(
                                                response.data.error,
                                                response.data.description,
                                                "error"
                                              );
                                            })
                                            .finally(() => {
                                              setModalProps({
                                                open: false,
                                                heading: "Reset to old commit?",
                                                headingIcon: <TrashIcon />,
                                                footerButtonArea: <></>,
                                                children: <></>,
                                              });
                                            });
                                        }}
                                      >
                                        Reset
                                      </MtdButton>
                                    ),
                                    children: (
                                      <>
                                        <div className="commit__info">
                                          <div className="commit__message">
                                            {item.message}
                                          </div>
                                          <div className="commit__author">
                                            {item.username}
                                          </div>
                                        </div>
                                        <br />
                                        This Action is irreversible, are you
                                        sure you want to continue?
                                      </>
                                    ),
                                  });
                                }
                              }}
                              icon={<UndoIcon />}
                            />
                          </Tooltip>
                          <Tooltip
                            placement="rightTop"
                            title={"Click to view files at this commit"}
                          >
                            <MtdButton
                              onClick={(e: MouseEvent) => {
                                e.preventDefault();
                                navigate(
                                  `/portal/kitab/repository/${id}/${item.id}/detached`
                                );
                              }}
                              icononly
                              minimal
                              icon={<FolderIcon />}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })}
        <MtdModal
          onCancel={() =>
            setModalProps({
              open: false,
              heading: "Reset to old commit?",
              headingIcon: <TrashIcon />,
              footerButtonArea: <></>,
              children: <></>,
            })
          }
          {...modalProps}
        />
      </div>
      <div className="gitLens__right">
        {isDefined(activeCommit) ? (
          <>
            {commitDetails?.map((detail) => (
              <DiffFile commitId={activeCommit} {...detail} />
            ))}
          </>
        ) : (
          <NoData
            icon={<SearchEmptyState />}
            heading={getLanguageLabel("selectCommitToSeeDetails")}
          />
        )}
      </div>
    </div>
  );
};

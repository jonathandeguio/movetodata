import { Button, Divider, Select, Space, Tooltip } from "antd";
import {
  GitCommitIcon,
  GitNewBranchIcon,
} from "assets/icons/mtdExternalIcons";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  SingleChevronRightIcon,
  TickSmallIcon,
} from "assets/icons/mtdNavigationIcon";
import React, { useState } from "react";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { AddIcon, RemoveIcon } from "../assets/icons/mtdActionIcons";
import MtdButton from "./MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "./MtdComponents/InputComponent/MtdInput";
import MtdModal from "./CommonUI/MtdModalContainer";
import { gitCommitIdRegex } from "./editor/editor.utils";

interface IEditorBranchesButton {
  branches: $TSFixMe;
  activeBranch: $TSFixMe;
  onBranchClick: $TSFixMe;
  onDeleteClick: $TSFixMe;
  onRenameClick: $TSFixMe;
  setCreateBranchModal: $TSFixMe;
  setMergeBranchModal: $TSFixMe;
  trackingStatus: any;
}

const BranchesButton = ({
  branches,
  activeBranch,
  onBranchClick,
  onDeleteClick,
  onRenameClick,
  setMergeBranchModal,
  setCreateBranchModal,
  trackingStatus,
}: IEditorBranchesButton) => {
  const DEFAULT_BRANCH = "master";
  const [revisionModal, setRevisionModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  return (
    <div className="branch_select">
      <Space.Compact style={{ width: "100%" }}>
        <Select
          defaultValue={DEFAULT_BRANCH}
          value={activeBranch}
          showSearch={true}
          optionLabelProp="label"
          popupMatchSelectWidth={false}
          style={{ width: "100%" }}
          dropdownRender={(originNode) => {
            return (
              <div className="branch_select__dropdown">
                <div
                  className="branch_select__item"
                  onClick={() => setCreateBranchModal(true)}
                >
                  <div className="branch_select__icon">
                    <AddIcon size={18} />
                  </div>
                  <div className="branch_select__text">New Branch</div>
                </div>
                <div
                  className="branch_select__item"
                  onClick={() => setRevisionModal(true)}
                >
                  <div className="branch_select__icon">
                    <GitCommitIcon />
                  </div>
                  <div className="branch_select__text">
                    Checkout to a revision
                  </div>
                </div>
                <Divider style={{ margin: "1px" }} />
                {originNode}
              </div>
            );
          }}
        >
          <>
            {branches?.map((branch: any) => {
              return (
                <Select.Option
                  key={branch}
                  value={branch}
                  label={
                    <React.Fragment>
                      <GitNewBranchIcon />
                      {branch}
                    </React.Fragment>
                  }
                >
                  <div
                    className="branch_select__item"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) onBranchClick(branch);
                    }}
                  >
                    <div className="branch_select__text">{branch}</div>
                    <div className="branch_select__icon branch_select__icon--chevron">
                      <SingleChevronRightIcon />
                    </div>
                    <div className="branch_select__submenu">
                      <div
                        className="branch_select__item"
                        onClick={(e) => {
                          onBranchClick(branch);
                        }}
                      >
                        <div className="branch_select__text">Checkout</div>
                      </div>
                      {/* <div className="branch_select__item">
                      <div
                        className="branch_select__text"
                        onClick={() => setCreateBranchModal(true)}
                      >
                        New branch from '{branch}'
                      </div>
                    </div> */}
                      {activeBranch !== branch && (
                        <>
                          <div className="branch_select__item">
                            <div
                              className="branch_select__text"
                              onClick={() => setMergeBranchModal(true)}
                            >
                              Merge '{branch}' into '{activeBranch}'
                            </div>
                          </div>
                          <Divider style={{ margin: "1px" }} />

                          <div className="branch_select__item">
                            <div className="branch_select__text">
                              Compare with '{activeBranch}'
                            </div>
                          </div>
                          <div className="branch_select__item">
                            <div className="branch_select__text">
                              Show difference with working tree
                            </div>
                          </div>
                        </>
                      )}
                      {branch !== "master" && (
                        <>
                          <Divider style={{ margin: "1px" }} />
                          <div className="branch_select__item">
                            <div
                              className="branch_select__text"
                              onClick={() => onRenameClick(branch)}
                            >
                              Rename
                            </div>
                          </div>
                          <div
                            className="branch_select__item branch_select__item--danger"
                            onClick={() => onDeleteClick(branch)}
                          >
                            <div className="branch_select__text">Delete</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Select.Option>
              );
            })}
          </>
        </Select>
        <Tooltip title={getLanguageLabel("gitStatus")}>
        <Button disabled={true}>
          <div className="flex">
            {trackingStatus.ahead}
            <ArrowUpIcon />
          </div>
          <div className="flex">
            {trackingStatus.behind}
            <ArrowDownIcon />
          </div>
        </Button>
        </Tooltip>
      </Space.Compact>
      <MtdModal
        destroyOnClose
        headingIcon={<GitCommitIcon />}
        heading={"Checkout to a revision"}
        open={revisionModal}
        onCancel={() => {
          setRevisionModal(false);
          setErrorMessage(undefined);
        }}
        okButtonProps={{ icon: <TickSmallIcon /> }}
        cancelButtonProps={{ icon: <RemoveIcon /> }}
        footerButtonArea={
          <>
            <MtdButton
              onClick={() => {
                setRevisionModal(false);
                setErrorMessage(undefined);
              }}
              icon={<RemoveIcon />}
            >
              Cancel
            </MtdButton>
            <MtdButton
              onClick={() => {
                setRevisionModal(false);
              }}
              disabled={isDefined(errorMessage)}
              intent="action"
              icon={<TickSmallIcon />}
            >
              Checkout
            </MtdButton>
          </>
        }
      >
        <MtdInput
          placeholder="Enter a valid commit id"
          onChange={(e) => {
            if (gitCommitIdRegex.test(e.target.value)) {
              setErrorMessage(undefined);
            } else {
              setErrorMessage("Not a valid commitId");
            }
          }}
        />
        {isDefined(errorMessage) && (
          <div style={{ color: "red" }}>{errorMessage}</div>
        )}
      </MtdModal>
    </div>
  );
};

export default BranchesButton;

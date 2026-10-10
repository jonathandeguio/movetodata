import React, { useEffect, useState } from "react";
import "./branchInfo.scss";

import { getDatasetBranchesAPI } from "Apps/Dataset/Dataset.api";
import { Divider, Popover, Tag } from "antd";
import Search from "antd/es/input/Search";
import MtdLoader from "components/mtdLoader";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { GitNewBranchIcon } from "../../assets/icons/mtdExternalIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";

interface IProps {
  datasetId: string;
  currentBranch: string;
  onClick: any;
  children?: any;
}

const BranchInfo = ({
  datasetId,
  currentBranch,
  onClick,
  children,
}: IProps) => {
  const [branchesData, setBranchesData] = useState<any[]>([]);
  const [filteredBranchesData, setFilteredBranchesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = (value: string) => {
    const filteredData = branchesData.filter((branch) =>
      branch.branch.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBranchesData(filteredData);
  };

  const getBranches = (id: string) => {
    setIsLoading(true);
    getDatasetBranchesAPI(id)
      .then(({ data }) => {
        setBranchesData(data);
        setFilteredBranchesData(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (datasetId) {
      getBranches(datasetId);
    }
  }, [datasetId]);

  return (
    <Popover
      trigger={"click"}
      title={
        <div className="text-and-icon-center --flex-gap5">
          <GitNewBranchIcon />
          <span className="icon-text">Branches</span>
        </div>
      }
      content={
        isLoading ? (
          <MtdLoader />
        ) : (
          <>
            <>
              <Search
                placeholder={getLanguageLabel("search")}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Divider />
              <div className="branchInfo-table">
                {isDefined(currentBranch) && (
                  <>
                    <div className="branchInfo-table-itemSelected">
                      <div style={{ visibility: "visible" }}>
                        <TickIcon color="var(--ACTION_COLOR)" />
                      </div>
                      {currentBranch}
                      <div style={{ visibility: "visible" }}>
                        <Tag color="var(--ACTION_COLOR)">
                          {getLanguageLabel("selected")}
                        </Tag>
                      </div>
                    </div>
                    <Divider style={{ margin: "1px" }} />
                  </>
                )}

                {filteredBranchesData.map((branch: any) => {
                  if (branch.branch == currentBranch) {
                    return;
                  }
                  return (
                    <>
                      <div
                        className="branchInfo-table-item"
                        onClick={() => onClick(branch.branch)}
                      >
                        {branch.branch}
                      </div>
                      <Divider style={{ margin: "1px" }} />
                    </>
                  );
                })}
              </div>
            </>
          </>
        )
      }
      placement="top"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {children}
      </div>
    </Popover>
  );
};

export default BranchInfo;

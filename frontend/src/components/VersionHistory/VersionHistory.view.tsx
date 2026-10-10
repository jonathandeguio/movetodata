import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { getResourceHistoryAPI } from "./VersionHistory.api";
import styles from "./VersionHistory.module.scss";
import HistoryContainer from "./components/HistoryContainer";
import NewVersionModal from "./components/NewVersionModal";

type TTabs = "versionsOnly" | "allHistory";
interface TProps {
  resourceId: string;
  pageType: "chart" | "dashboard";
}
const VersionHistory = ({ resourceId, pageType }: TProps) => {
  const [activeTab, setActiveTab] = useState<TTabs>("allHistory");
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState({
    resourceId: null,
    latestVersion: null,
    versions: [],
  });
  const { newVersion } = useSelector((state: RootState) => state.version);

  const getResourceHistory = () => {
    setIsLoading(true);
    getResourceHistoryAPI(resourceId)
      .then(({ data }) => {
        setHistory(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getResourceHistory();
  }, [newVersion]);

  if (isLoading) {
    return <MtdLoader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <MtdHeader
          heading={getLanguageLabel("historyAndVersions")}
          description={getLanguageLabel("recentEditsAndVersions")}
          actionComponent={
            <NewVersionModal
              history={history}
              pageType={pageType}
              resourceId={resourceId}
            />
          }
        />
        <div className={styles.switch}>
          <MtdSwitch
            items={[
              {
                label: getLanguageLabel("allHistory"),
                value: "allHistory",
                children: (
                  <HistoryContainer
                    versions={history.versions}
                    pageType={pageType}
                    resourceId={resourceId}
                  />
                ),
              },
              {
                label: getLanguageLabel("versionsOnly"),
                value: "versionsOnly",
                children: (
                  <HistoryContainer
                    onlyVersions
                    versions={history.versions}
                    pageType={pageType}
                    resourceId={resourceId}
                  />
                ),
              },
            ]}
            value={activeTab}
            onChange={(value: TTabs) => setActiveTab(value)}
            divider
          />
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;

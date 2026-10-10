import { Alert } from "antd";
import { PulseIcon } from "assets/icons/mtdMiscellaneousIcons";
import { News } from "components/UserActivityVault/UserActivity";
import { getNewsAPI } from "components/UserActivityVault/UserActivity.api";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  isDefined,
  isPlatformExpiringIn30Days,
  timeConverter,
} from "utils/utilities";

const FloatingBanner = () => {
  const [visible, setVisible] = useState(false);
  const { info } = useSelector((state) => (state as any).license);
  const [latestP1News, setLatestP1News] = useState<News>();

  const handleClose = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (isPlatformExpiringIn30Days(info.expiresOn)) {
      const platformNews: News = {
        title: "Urgent Reminder",
        description: `Platform Access Expired on ${timeConverter(
          info.expiresOn,
          true,
          true,
          "dd/MM/yyyy HH:mm"
        )}`,
        createdAt: new Date(),
        priority: 1,
      };
      setLatestP1News(platformNews);
      setVisible(true);
    } else {
      getNewsAPI().then(({ data }) => {
        const latestNews = data.find((news: News) => news.priority == 1);
        if (isDefined(latestNews)) {
          setLatestP1News(latestNews);
        } else return;
        setVisible(true);
      });
    }
  }, []);
  return (
    <>
      {visible && (
        <Alert
          message={
            <>
              {latestP1News?.title} | {latestP1News?.description}
            </>
          }
          type="info"
          showIcon
          icon={<PulseIcon color={"#ffffff"} />}
          closable
          afterClose={handleClose}
          style={{
            padding: "2px 6px 2px 6px",
            fontWeight: "900",
            fontSize: "0.8rem",
            background: "var(--ACTION_COLOR)",
            color: "#ffffff",
          }}
        />
      )}
    </>
  );
};

export default FloatingBanner;

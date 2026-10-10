import { Card, List, Skeleton, Tooltip, Typography } from "antd";

import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import {
  capitalizeFirstLetter,
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";
import { StarIcon } from "../../assets/icons/mtdMiscellaneousIcons";

import { Resource } from "Apps/explorer/explorer";
import {
  addToFavouritesApi,
  getRecentlyViewed,
  removeFromFavouritesApi,
} from "Apps/explorer/explorer.api";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import UserInfo from "common/components/UserInfo";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";

const { Title, Text } = Typography;

const RecentlyViewed = () => {
  const navigator = useNavigateHelper();
  const [isFav, setIsFav] = useState(new Map());
  const [recentlyViewed, setRecentlyViewed] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRecentlyViewed()
      .then(({ data }) => {
        let isFavouriteMap = new Map();
        for (let i = 0; i < data.length; i++) {
          const element = data[i];
          isFavouriteMap.set(element.id, element.favourite);
        }
        setIsFav(isFavouriteMap);
        setRecentlyViewed(data);
      })
      .catch((error) => {
        openNotification("Unable to get recentlyViewed", "", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const { config } = useSelector((state) => (state as any).platformConfig);

  useEffect(() => {
    document.title = getLanguageLabel("recentlyViewed");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = getDefaultFavicon();

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  return (
    <div className="settings-center-block">
      <Title level={3}>{getLanguageLabel("recentlyViewed")}</Title>
      <Card
        style={{
          borderRadius: "1px",
          background: "none",
          minHeight: "50vh",
          maxHeight: "50vh",
          overflowY: "scroll",
        }}
      >
        <List
          dataSource={recentlyViewed}
          renderItem={(item: any, index) => (
            <List.Item style={{ cursor: "pointer" }}>
              <List.Item.Meta
                avatar={getNodeIcon(
                  item.type,
                  item.subType,
                  false,
                  16,
                  item.metaData
                )}
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div onClick={() => navigator(item.id)}>{item.name}</div>

                    <div
                      onClick={() => {
                        if (isFav.get(item.id)) {
                          setIsFav((prev) => {
                            return new Map(prev.set(item.id, false));
                          });
                          removeFromFavouritesApi(item.id);
                        } else {
                          setIsFav((prev) => {
                            return new Map(prev.set(item.id, true));
                          });
                          addToFavouritesApi(item.id);
                        }
                      }}
                    >
                      <StarIcon
                        color={isFav.get(item.id) ? "#ffc940" : "#ffffff"}
                        stroke={isFav.get(item.id) ? "#ffc940" : "#717a94"}
                      />
                    </div>
                  </div>
                }
                description={
                  <>
                    {capitalizeFirstLetter(item.type)}{" "}
                    {getLanguageLabel("createdBy")}{" "}
                    <UserInfo userId={item.createdBy} />{" "}
                    <Tooltip title={timeConverter(item.createdAt)}>
                      {getTimeDisplay(item.createdAt)}
                    </Tooltip>
                  </>
                }
              />
            </List.Item>
          )}
        >
          {loading ? (
            <>
              {[...Array(4)].map(() => (
                <Skeleton active avatar></Skeleton>
              ))}
            </>
          ) : (
            recentlyViewed?.length == 0 && (
              <Text type="secondary">{getLanguageLabel("nothingToShow")}</Text>
            )
          )}
        </List>
      </Card>
    </div>
  );
};

export default RecentlyViewed;

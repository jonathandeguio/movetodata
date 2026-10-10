import {
  Card,
  Col,
  List,
  Row,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from "antd";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { StarIcon } from "../../assets/icons/mtdMiscellaneousIcons";

import {
  capitalizeFirstLetter,
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";

import {
  getFavourites,
  removeFromFavouritesApi,
} from "Apps/explorer/explorer.api";

import { Resource } from "Apps/explorer/explorer";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import UserInfo from "common/components/UserInfo";
import "./UserActivity.scss";

const { Title, Text } = Typography;

const Favs = () => {
  const navigate = useNavigateHelper();
  const { config } = useSelector((state) => (state as any).platformConfig);

  const [favsList, setFavsList] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // State to track whether the star is "active"
  const [isExampleStarActive, setIsExampleStarActive] = useState(false);

  // Function to toggle the state
  const toggleStar = () =>
    setIsExampleStarActive(
      (prevIsExampleStarActive) => !prevIsExampleStarActive
    );

  const rehydrateFavs = () => {
    setLoading(true);
    getFavourites()
      .then(({ data }) => {
        setFavsList(data);
      })
      .catch(() => {
        openNotification("Unable to get Notification", "", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    document.title = getLanguageLabel("favourites");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = "/favicons/general/favouritesIcon.svg";

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  useEffect(() => {
    rehydrateFavs();
  }, []);

  return (
    <div className="settings-center-block">
      <Title level={3}>{getLanguageLabel("favourites")}</Title>

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
          // pagination={{ position, align }}
          dataSource={favsList}
          // loading={loading}

          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={getNodeIcon(
                  item.type,
                  item.subType,
                  false,
                  16,
                  item.metaData
                )}
                title={
                  <>
                    <Row align={"middle"}>
                      <Col
                        onClick={() => navigate(item.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {item?.name}
                      </Col>
                      <Col
                        onClick={() => {
                          removeFromFavouritesApi(item.id).then(() =>
                            rehydrateFavs()
                          );
                        }}
                      >
                        <StarIcon color={"#ffc940"} stroke={"#ffc940"} />
                      </Col>
                    </Row>
                  </>
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
            favsList?.length == 0 && (
              <>
                <div className="centered-content">
                  <Space direction={"vertical"} size={"small"}>
                    {getLanguageLabel("noFavouritesFound")} <br />
                    <br />
                    <br />
                    <div
                      style={{
                        display: "inline",
                        fontSize: "0.9rem",
                        fontWeight: 100,
                        cursor: "pointer",
                      }}
                      onClick={toggleStar}
                    >
                      <div style={{ display: "inline" }}>
                        {getLanguageLabel("clickToAddToFavouritesS")}
                      </div>

                      {isExampleStarActive ? (
                        <StarIcon
                          size={18}
                          color={"#ffc940"}
                          stroke={"#ffc940"}
                        />
                      ) : (
                        <StarIcon size={18} />
                      )}

                      <div style={{ display: "inline" }}>
                        {getLanguageLabel("clickToAddToFavouritesE")}
                      </div>
                    </div>
                  </Space>
                </div>
              </>
            )
          )}
        </List>
      </Card>
    </div>
  );
};

export default Favs;

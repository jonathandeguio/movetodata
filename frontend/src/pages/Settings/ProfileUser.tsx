import { Avatar, Col, Collapse, Divider, Row, Typography } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { ArrowLeftIcon } from "../../assets/icons/mtdNavigationIcon";
import {
  getUserDetailByID,
  isPlatformAdmin,
  isUserAdmin,
} from "../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import Profile from "./Profile";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ProfileUser = () => {
  const { id } = useParams();
  const { user: currentUser } = useSelector(
    (state) => (state as $TSFixMe).userDetails
  );
  const { user } = useSelector((state) => (state as $TSFixMe).userDetailById);

  const { user: userAdmin } = useSelector((state) => (state as any).userAdmin);
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );
  const navigate = useNavigate();

  const dispatch = useDispatch<ThunkAppDispatch>();
  useEffect(() => {
    dispatch(getUserDetailByID(id));
    dispatch(isPlatformAdmin());
    dispatch(isUserAdmin());
  }, []);


  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  useEffect(() => {
    document.title = getLanguageLabel("settings");
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
    <>
      {user &&
        (userAdmin || platformAdmin ? (
          <>
            <div
              className="settings-center-block"
              style={{ marginTop: "3rem" }}
            >
              <Row justify="start" 
              // style={{flexDirection:"column-reverse"}}
               >
                <Col onClick={() => navigate(-1)}>
                  <div className="text-and-icon-center">
                    <ArrowLeftIcon size={30} />{" "}
                    <Text style={{ fontSize: "30px", fontWeight: "bold" }}>
                      {getLanguageLabel("userDetails")}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
            <Profile
              user={user}
              self={currentUser.id == user.id}
              loginHistory={true}
              showPreferences={true}
            />
          </>
        ) : (
          <div className="settings-center-block" style={{ marginTop: "3rem" }}>
            <Row justify="start">
              <Col onClick={() => navigate(-1)}>
                <div className="text-and-icon-center">
                  <ArrowLeftIcon size={30} />{" "}
                  <Text style={{ fontSize: "30px", fontWeight: "bold" }}>
                    {getLanguageLabel("userDetails")}
                  </Text>
                </div>
              </Col>
            </Row>
            <Row justify="center">
              <Col>
                <Avatar
                  className="interactive"
                  src={
                    user.profileImage && user.profileImage != ""
                      ? user.profileImage
                      : null
                  }
                  size={200}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "B"}
                </Avatar>
              </Col>
            </Row>
            <br />
            <Row justify="center">
              <Col>
                <Title level={1}>{user.name}</Title>
              </Col>
            </Row>
            <Divider />
            <div className="MtdHeader1">{getLanguageLabel("givenName")}</div>
            <MtdInput
              placeholder={user.givenName}
              // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
              name={["user", "fname"]}
              disabled
            />
            <div className="MtdHeader1">
              {getLanguageLabel("familyName")}
            </div>
            <MtdInput
              // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
              name={["user", "lname"]}
              placeholder={user.familyName}
              disabled
            />
            <div className="MtdHeader1">{getLanguageLabel("email")}</div>
            <MtdInput
              placeholder={user.email}
              // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
              name={["user", "email"]}
              type="email"
              disabled
            />
            <div className="MtdHeader1">{getLanguageLabel("location")}</div>
            <MtdInput
              placeholder={user.location}
              // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
              name={["location"]}
              disabled
            />

            <Row>
              <Col>
                {user.ssoAttributes && (
                  <Collapse>
                    <Panel header={`SSO Attributes`} key="1">
                      {Object.keys(user.ssoAttributes).map((key: any) => {
                        return (
                          <Row gutter={16}>
                            <Col>
                              <Text type="secondary">{key}:</Text>
                            </Col>
                            <Col>
                              <Text>
                                {user.ssoAttributes[key]
                                  ? user.ssoAttributes[key]
                                  : "--"}
                              </Text>
                            </Col>
                          </Row>
                        );
                      })}
                    </Panel>
                  </Collapse>
                )}
              </Col>
            </Row>
          </div>
        ))}
    </>
  );
};

export default ProfileUser;

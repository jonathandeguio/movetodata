import { FloatButton, Typography } from "antd";
import { LogoutIcon } from "assets/icons/mtdActionIcons";
import { DocumentationIcon } from "assets/icons/mtdFileIcons";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { ThunkAppDispatch } from "redux/types/store";
import { ParticleApp } from "utils/ParticleApp";
import { getLanguageLabel, getUserDocsLanguage } from "utils/utilities";
import { refreshTokenStatus } from "../../../../redux/actions/tokenActions";
import { isPlatformAdmin, logout } from "../../../../redux/actions/userActions";
import { LicenseForm } from "./LicenseForm.view";

const { Title, Text } = Typography;

export const ActivatePlatform = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );

  useEffect(() => {
    dispatch(isPlatformAdmin());
  }, []);
  return (
    <>
      <div
        className="login-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "var(--background-color)",
        }}
      >
        <div
          style={{
            background: "var(--background-color)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <ParticleApp
            fullScreen={true}
            height={1300}
            width={1300}
            numberOfParticles={50}
            speed={2}
            logoSize={8}
            image="/logo_hexa.png"
          />
        </div>

        <div
          className="login-containerNew"
          style={{
            zIndex: 10,
          }}
        >
          <FloatButton.Group shape="circle">
            <FloatButton
              icon={<DocumentationIcon />}
              onClick={() => {
                navigate(`/learn/${getUserDocsLanguage()}`);
              }}
              tooltip={<>{getLanguageLabel("documentation")}</>}
            />

            <FloatButton
              onClick={() => {
                dispatch(logout());
                dispatch(refreshTokenStatus());
                navigate("/Auth/logout");
              }}
              icon={<LogoutIcon />}
              tooltip={<>{getLanguageLabel("logout")}</>}
            />
          </FloatButton.Group>
          <Title level={3}>
            You are not using a valid License Key. Either the platform has
            expired or you are using license key not meant for your Origin.
          </Title>

          {platformAdmin ? (
            <div style={{ width: "100%" }}>
              <LicenseForm isDisabledPage={true} />
            </div>
          ) : (
            <Text>
              Contact Platform Administrator to register with License Key
            </Text>
          )}
        </div>
      </div>
    </>
  );
};

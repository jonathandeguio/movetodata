import "Apps/Kepler/dashboard/DashboardSubscribeMenu/DashboardSubscribeMenu.scss";
import axios, { AxiosResponse } from "axios";
import MtdModalContainer from "components/CommonUI/MtdModalContainer/MtdModalContainer";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ParticleApp } from "utils/ParticleApp";
import { getLanguageLabel, isIpPlatform } from "utils/utilities";
import "../../../Apps/Kepler/dashboard/DashboardSubscribeMenu/DashboardSubscribeMenu.scss";
import { WarningIcon } from "../../../assets/icons/mtdActionIcons";
import { ArrowRightIcon } from "../../../assets/icons/mtdNavigationIcon";
import MtdButton from "../../../components/MtdComponents/ButtonComponent/MtdButton";

interface ErrorComponentProps {
  lineStroke: string;
  errorHeading: string;
  errorCode: string;
  errorMsg: string;
  error?: Error;
}

const logError = (body: any): Promise<AxiosResponse<any, any>> => {
  return axios.post(`/errors`, body);
};

export const ErrorComponent = ({
  lineStroke,
  errorHeading,
  errorCode,
  errorMsg,
}: ErrorComponentProps) => {
  useEffect(() => {
    logError({
      name: errorHeading,
      message: errorMsg,
      stack: "",
      componentStack: "",
    });
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
          {!isIpPlatform() && <img src="/logoMoveToData.png" alt="MoveToData" style={{ height: 128, marginBottom: 8 }} />}
          <div className="form-containerNew">
            <MtdModalContainer
              headingIcon={<WarningIcon color="orange" />}
              heading={errorHeading}
              footerExtraText={getLanguageLabel("homePageMsg")}
              footerButtonArea={
                <Link to="/portal/home">
                  <MtdButton
                    intent="action"
                    icon={<ArrowRightIcon />}
                    htmlType="submit"
                  >
                    {getLanguageLabel("homePage")}
                  </MtdButton>
                </Link>
              }
              outerBorder={false}
              information={
                <div
                  style={{
                    padding: "10px",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "1rem",
                    flexDirection: "column",
                    backgroundColor: "var(--movetodata-bkg-color-muted)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "10px",
                      fontSize: "18px",
                      color: "var(--movetodata-font-color-muted)",
                    }}
                    className="text-and-icon-center"
                  >
                    {getLanguageLabel("quickFix")}
                  </div>
                  <div
                    style={{
                      marginBottom: "10px",
                      fontSize: "13px",
                      justifyContent: "flex-start",
                    }}
                  >
                    {getLanguageLabel("thingsToTry")}
                  </div>
                  <div>
                    <ul>
                      <li style={{ fontSize: "12px" }}>
                        {getLanguageLabel("checkInternetConnection")}
                      </li>
                      <li style={{ fontSize: "12px" }}>
                        {getLanguageLabel("reloadYourBrowser")}
                      </li>
                      <li style={{ fontSize: "12px" }}>
                        {getLanguageLabel("reviewSecuritySoftware")}
                      </li>
                    </ul>
                  </div>
                  <br></br>
                  {getLanguageLabel("contactHelpDesk")}
                </div>
              }
            >
              <div
                className="MtdHeader1"
                style={{ marginBottom: "10px" }}
              ></div>

              <div style={{ marginBottom: "10px", fontSize: "48px" }}>
                {errorCode}
              </div>
              <div className="contant_box_404">
                <h3 className="h4">{errorMsg}</h3>
              </div>
            </MtdModalContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorComponent;

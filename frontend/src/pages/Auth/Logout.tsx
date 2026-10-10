import { Form } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import { setTheme } from "../App";
import React from "react";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { ThunkAppDispatch } from "../../redux/types/store";
import Loading from "../Errors/Loading";

import "Apps/Kepler/dashboard/DashboardSubscribeMenu/DashboardSubscribeMenu.scss";

import { ArrowRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { ParticleApp } from "utils/ParticleApp";

const Logout = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const { userInfo, error, loading } = useSelector(
    (state) => (state as $TSFixMe).userLogin
  );
  const { isTokenValid, loading: tokenStatusLoading } = useSelector(
    (state) => (state as $TSFixMe).tokenStatus
  );

  useEffect(() => {
    if (!tokenStatusLoading && isTokenValid) {
      navigate(-1);
    }
  }, [userInfo, loading, error, isTokenValid, tokenStatusLoading]);

  useEffect(() => {
    if (!loading && error) {
      let toast_msg = "";
      if (error.response !== undefined) {
        toast_msg = "Wrong username or password";
      } else {
        toast_msg = error.message + " from our side";
      }

      openNotification(
        "Login Error",
        "There was a login error, please check details.",
        "error"
      );
      // message.error(toast_msg);
    }
  }, [error]);


  if (tokenStatusLoading) return <Loading />;

  return (
    <>
      {/* <DancingLines lineStroke={"#738091"} /> */}
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
          <ParticleApp
            fullScreen={true}
            height={1300}
            width={1300}
            numberOfParticles={100}
            speed={0.6}
            logoSize={5}
            image="/logo_hexa.png"
          />
        </div>
        <div
          className="login-containerNew"
          style={{
            zIndex: 10,
          }}
        >
          {getLanguageLabel("loggedOutSuccess")}

          <MtdButton
            key="submit"
            onClick={() => navigate("/Auth/login")}
            icon={<ArrowRightIcon />}
            intent="action"
          >
            {getLanguageLabel("login")}
          </MtdButton>
        </div>
      </div>
    </>
  );
};

export default Logout;

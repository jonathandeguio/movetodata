import { notification, Typography } from "antd";
import { CrossIcon, RefreshIcon } from "assets/icons/movetodataActionIcons";
import ErrorBoundary from "errors/ErrorBoundary/GeneralErrorBoundary";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router";
import { useSearchParams } from "react-router-dom";
import { getUserDetails } from "redux/actions/userActions";
import { closeTab, getLanguageLabel, hardRefresh } from "utils/utilities";
import { getConfig } from "redux/actions/authActions";
import { getPlatformConfig } from "redux/actions/platformSettingsActions";
import { setTokenInvalid, setTokenValid } from "redux/actions/tokenActions";
import { ThunkAppDispatch } from "redux/types/store";
import "./_app.scss";
import { ping } from "./App.api";
import MoveToDataButton from "components/ButtonComponent/MoveToDataButton";

const { Text } = Typography;

function AppContainer() {
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [searchParams] = useSearchParams();

  const { isTokenValid, loading: tokenStatusLoading } = useSelector(
    (state) => (state as $TSFixMe).tokenStatus
  );

  const [vrs, setVrs] = useState({ frontend: "" });

  const [countdown, setCountdown] = useState(-100);
  const [isCounting, setIsCounting] = useState(false);
  const elementRef = useRef(null);

  const dispatch = useDispatch<ThunkAppDispatch>();

  const countDownNotification = () => {
    setIsCounting(true);
    setCountdown(60);
  };

  const random = (max: number): number => {
    return Math.random() * (max - 0) + 0;
  };

  const sleep = (ms: number | undefined) =>
    new Promise((r) => setTimeout(r, ms));

  const handleReload = async () => {
    const confetti = document.createElement("span");
    confetti.style.cssText = "position : relative";
    const targetElement = document.querySelector(".confetti");
    if (targetElement) {
      for (let i = 0; i < 700; i++) {
        const sign = i % 2 == 0 ? "+" : "-";
        const styles = `transform: translate3d(${sign}${
          random(2000) - 250
        }px, ${random(2000) - 150}px, 0) rotate(${random(360)}deg);\
                      background: hsla(${random(360)}, 100%, 50%, 1);\
                      animation: bang 1000ms ease-out forwards;\
                      opacity: 0`;

        const e = document.createElement("i");
        e.style.cssText = styles;
        targetElement.appendChild(e);
      }
    }
    await sleep(500);
    localStorage.setItem("versions", vrs as any);
    hardRefresh();
    // window.location.reload();
  };

  function Ping() {
    // if (document.hidden === false) {
    ping(window.location.pathname)
      .then(({ data }) => {
        if (data.message === "pong") {
          if (networkError === true) {
            setNetworkError(false);
            notification.destroy("networkErrorNotification");
          }

          if (tokenStatusLoading || !isTokenValid) {
            dispatch(setTokenValid());
          }

          if (vrs.frontend != "" && data.versions.frontend != vrs.frontend) {
            countDownNotification();
          }

          if (data.versions.frontend != vrs.frontend) setVrs(data.versions);
        }
      })
      .catch((error) => {
        if ((error as $TSFixMe).code === "ERR_NETWORK") {
          if (networkError === false) {
            setNetworkError(true);
          }
        } else if (error.response?.status === 401) {
          if (tokenStatusLoading || isTokenValid) {
            dispatch(setTokenInvalid());
          }
        }
      });
    // }
  }

  useEffect(() => {
    if (isCounting && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(countdown - 1);
        if (countdown == 1) {
          clearInterval(timer);
          setIsCounting(false);

          // window.location.reload();

          hardRefresh();
        }

        notification.destroy("updatesNotification");
        notification.success({
          message: getLanguageLabel("newUpdates"),
          description: (
            <Text type="secondary">
              {getLanguageLabel("platformUpdatedMessage")}
            </Text>
          ),
          duration: 0,
          icon: (
            <span
              style={{ fontSize: "25px", position: "relative", top: "12px" }}
            >
              🎉
            </span>
          ),
          key: "updatesNotification",
          closeIcon: false,
          placement: "top",
          btn: (
            <div style={{ display: "flex" }}>
              <MoveToDataButton
                onClick={() => {
                  notification.destroy("updatesNotification");
                  setIsCounting(false);
                }}
                intent="dangerous"
                icon={<CrossIcon />}
              >
                {getLanguageLabel("cancel")}
              </MoveToDataButton>
              <MoveToDataButton
                intent="success"
                onClick={handleReload}
                style={{ marginLeft: 10 }}
                icon={<RefreshIcon />}
              >
                {getLanguageLabel("reload")} ( {countdown} )
                {/* {<CountdownSpinner seconds={countdown} />} */}
                <span className="confetti" ref={elementRef}></span>
              </MoveToDataButton>
            </div>
          ),
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, isCounting]);

  useEffect(() => {
    if (!tokenStatusLoading && isTokenValid) {
      dispatch(getPlatformConfig());
      dispatch(getConfig());
      dispatch(getUserDetails());

      if (searchParams.get("relogin")) {
        localStorage.setItem("tokenUpdated", "true");
        closeTab();
      }
    }
  }, [tokenStatusLoading, isTokenValid]);

  useEffect(() => {
    Ping();
    const timer = setInterval(function () {
      if (document.hidden === false) {
        Ping();
      }
    }, 10000);

    return () => {
      clearInterval(timer);
    };
  }, [isTokenValid, networkError, tokenStatusLoading, vrs]);

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}

export default AppContainer;

import { notification, Typography } from "antd";
import { CrossIcon, RefreshIcon } from "assets/icons/mtdActionIcons";
import { MtdIcon } from "assets/icons/mtdMiscellaneousIcons";
import { ping } from "common/common.api";
import { ExplorerModal } from "common/components/ExplorerModal";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import ErrorBoundary from "ErrorBoundary/GeneralErrorBoundary";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import {
  closeTab,
  getLanguageLabel,
  hardRefresh,
  isDefined,
  isLicenseKeyUsedValid,
} from "utils/utilities";
import { getPlatformConfig } from "../redux/actions/platformSettingsActions";
import { listProjects } from "../redux/actions/projectActions";
import { setTokenInvalid, setTokenValid } from "../redux/actions/tokenActions";
import { getUserDetails } from "../redux/actions/userActions";
import { getLicenseInfo } from "../redux/licenseInfoSlice";
import { getSparkConfig } from "../redux/sparkSlice";
import { RootState, ThunkAppDispatch } from "../redux/types/store";
import "./_app.scss";

const { Text } = Typography;

function AppContainer() {
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { config } = useSelector((state) => (state as any).platformConfig);

  const { info, loading: licenseLoading } = useSelector(
    (state) => (state as any).license
  );
  const [previousPlatformStatus, setPreviousPlatformStatus] = useState("");
  const { isTokenValid, loading: tokenStatusLoading } = useSelector(
    (state) => (state as $TSFixMe).tokenStatus
  );

  const fileExplorerModal = useSelector(
    (state: RootState) => state.modals.fileExplorerModal
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
    const targetElement = document.querySelector(".confetti");

    if (targetElement) {
      for (let i = 0; i < 500; i++) {
        const sign = i % 2 === 0 ? "+" : "-";
        const translateX = `${sign}${random(2000) - 250}px`;
        const translateY = `${random(2000) - 150}px`;
        const rotate = `${random(360)}deg`;
        const hue = random(360);
        const size = random(35) + 5;
        const color = `hsl(${hue}, 100%, 50%)`;

        // Create a container for the SVG icon
        const iconContainer = document.createElement("div");
        iconContainer.style.cssText = `
            position: absolute;
            transform: translate3d(${translateX}, ${translateY}, 0) rotate(${rotate});
            animation: bang 1500ms ease-out forwards;
            opacity: 0;
          `;

        // Render the MtdIcon into the container
        ReactDOM.render(
          <MtdIcon size={size} color={color} />,
          iconContainer
        );

        targetElement.appendChild(iconContainer);
      }
    }

    await sleep(700);
    localStorage.setItem("versions", vrs as any);
    hardRefresh();
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
          // countDownNotification();
          hardRefresh();
          }

          if (data.versions.frontend != vrs.frontend) setVrs(data.versions);

          if (!licenseLoading) {
            if (isLicenseKeyUsedValid(info))
              setPreviousPlatformStatus("ACTIVE");
            else if (previousPlatformStatus == "ACTIVE") {
              navigate(`/portal/home`);
              window.location.reload();
            }
          }
        }
      })
      .catch((error) => {
        if ((error as $TSFixMe).code === "ERR_NETWORK") {
          if (networkError === false) {
            setNetworkError(true);
          }
        } else if (error.response?.data?.error === "Unauthorized") {
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
              <MtdButton
                onClick={() => {
                  notification.destroy("updatesNotification");
                  setIsCounting(false);
                }}
                intent="dangerous"
                icon={<CrossIcon />}
              >
                {getLanguageLabel("cancel")}
              </MtdButton>
              <MtdButton
                intent="success"
                onClick={handleReload}
                style={{ marginLeft: 10 }}
                icon={<RefreshIcon />}
              >
                {getLanguageLabel("reload")} ( {countdown} )
                {/* {<CountdownSpinner seconds={countdown} />} */}
                <span className="confetti" ref={elementRef}></span>
              </MtdButton>
            </div>
          ),
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, isCounting]);

  useEffect(() => {
    dispatch(listProjects());
  }, []);

  useEffect(() => {
    if (!tokenStatusLoading && isTokenValid) {
      dispatch(getPlatformConfig());
      dispatch(getSparkConfig());

      if (searchParams.get("relogin")) {
        localStorage.setItem("tokenUpdated", "true");
        closeTab();
      }
    }
  }, [tokenStatusLoading, isTokenValid]);

  useEffect(() => {
    if (isDefined(config)) {
      let licenseKey = "";
      if (isDefined(config.licenseKey)) licenseKey = config.licenseKey;
      dispatch(getLicenseInfo(licenseKey)).then(() => {
        dispatch(getUserDetails());
      });
    }
  }, [config]);

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
  }, [isTokenValid, networkError, tokenStatusLoading, vrs, info]);

  return (
    <ErrorBoundary>
      <Outlet />
      <ExplorerModal />
    </ErrorBoundary>
  );
}

export default AppContainer;

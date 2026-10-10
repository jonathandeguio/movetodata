import { MenuProps } from "antd";
import { RefreshIcon, RunIcon, StopIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  reloadChartForDashboard,
  updateDashboardState,
} from "../../../../redux/actions/dashboardActions";
import { RootState, ThunkAppDispatch } from "../../../../redux/types/store";
import { DASHBOARD_REFRESH_CONFIG } from "./DashboardRefreshBtn.contants";
import styles from "./DashboardRefreshBtn.module.scss";
import { IDashboardRefreshState } from "./DashboardRefreshBtn.types";

const DashboardRefreshBtn: React.FC = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { dashboardRefreshConfig } = useSelector(
    (state: RootState) => state.dashboardEdit
  );

  const [refreshConfig, setRefreshConfig] = useState<IDashboardRefreshState>(
    dashboardRefreshConfig
  );
  const handleDashboardElementsRefresh = () => {
    dispatch(reloadChartForDashboard());
  };
  const handleDashboardRefresh = (
    refreshConfig: IDashboardRefreshState,
    timerRef: React.MutableRefObject<NodeJS.Timeout | null>,
    dispatch: ThunkAppDispatch
  ) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (refreshConfig.isPlaying) {
      timerRef.current = setInterval(() => {
        handleDashboardElementsRefresh();
        dispatch(updateDashboardState(refreshConfig));
      }, refreshConfig.refreshInterval);
    }
  };

  const handleIntervalChange = (e: MenuProps["onClick"] | any) => {
    e.domEvent.stopPropagation();
    e.domEvent.preventDefault();
    if(e.key==="off"){
      setRefreshConfig((prevState: IDashboardRefreshState) => ({
        ...prevState,
        refreshInterval:0,
        isPlaying: !prevState.isPlaying,
      }));
      return;
    }
    if(!refreshConfig?.isPlaying){
      handlePlayPause()
    }
    const newInterval = parseInt(e.key, 10);
    setRefreshConfig((prevState: IDashboardRefreshState) => ({
      ...prevState,
      refreshInterval: newInterval,
    }));
  };

  const handleRefreshNow = () => {
    handleDashboardElementsRefresh();
    // dispatch(updateDashboardState(refreshConfig));
  };

  const handlePlayPause = () => {
    setRefreshConfig((prevState: IDashboardRefreshState) => ({
      ...prevState,
      isPlaying: !prevState.isPlaying,
    }));
  };

  const getBtnText = (interval: number) => {
    if(interval===0){
      return "off"
    }
    const intervalInSeconds = interval / 1000;
    if (intervalInSeconds < 60 && intervalInSeconds>0) {
      return intervalInSeconds + " s";
    } else {
      return intervalInSeconds / 60 + " mins";
    }
  };

  useEffect(() => {
    handleDashboardRefresh(refreshConfig, timerRef, dispatch);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [refreshConfig]);

  return (
    <div className={styles.container}>
      <MtdButton
        // icon={refreshConfig.isPlaying ? <StopIcon /> : <RunIcon />}
        // onClick={handlePlayPause}
        menuItems={DASHBOARD_REFRESH_CONFIG}
        onClickMenuItem={handleIntervalChange}
        textTransform={"none"}
      >
        {getBtnText(refreshConfig.refreshInterval)}
      </MtdButton>
      <MtdButton
        onClick={handleRefreshNow}
        icon={<RefreshIcon />}
        icononly={true}
        minimal
      />
    </div>
  );
};

export default DashboardRefreshBtn;

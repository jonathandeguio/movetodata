import React, { useEffect, useRef, useState } from "react";
const svgString = renderToStaticMarkup(<MonitorIcon />);

import { MonitorIcon } from "assets/icons/mtdMiscellaneousIcons";
import { getResourcePermissionAPI } from "common/common.api";
import MtdLoader from "components/mtdLoader";
import { renderToStaticMarkup } from "react-dom/server";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { isDefined } from "utils/utilities";
import { resourcePermissionUpdate } from "../../../redux/actions/resourcePermissionActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { KeplerRestricted } from "../KeplerRestricted.view";
import { KEPLER_USE_CASES } from "../chart/charts.utils";
import DashboardAddChartMenu from "./DashboardAddChartMenu";
import DashboardHeader from "./DashboardHeader";
import DashboardSubscribeMenu from "./DashboardSubscribeMenu";
import DashboardTabs from "./DashboardTabs/DashboardTabs";
import DashboardVersionsContainer from "./DashboardVersionsContainer";

const Dashboard = () => {
  const { id } = useParams();

  if (!isDefined(id)) {
    throw new Error("Id is undefined, unable to load dash!");
  }
  const gridRef = useRef();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { info } = useSelector((state) => (state as any).license);

  useEffect(() => {
    getResourcePermissionAPI(id)
      .then(({ data }) => {
        dispatch(resourcePermissionUpdate(data, id));
        // Uncomment to open in edit mode by defaut
        // if (data == EDITOR_PERMISSION || data == OWNER_PERMISSION) {
        //   dispatch(resourceModeUpdate(EDIT_MODE, id));
        // }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (!KEPLER_USE_CASES.includes(info.product)) return <KeplerRestricted />;

  if (isLoading) {
    return <MtdLoader />;
  }

  /* As kepler-container class is also used on kepler chart, and there the
      height is 100% - 3.5vh because of bottom bar. Changing it here explicitly
      for reusability of class css */
  return (
    <>
      <div className="kepler-container" style={{ height: "100%" }}>
        <DashboardHeader gridRef={gridRef} id={id} />
        <div className="kepler-container-plane">
          <div className="kepler-container-plane-rightWrapper">
            <DashboardVersionsContainer />
            <div className="kepler-container-plane-rightWrapper-tabs">
              <DashboardTabs gridRef={gridRef} />
            </div>
            {/* The classname like above is defined inside this */}
            <DashboardAddChartMenu />
            <DashboardSubscribeMenu />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

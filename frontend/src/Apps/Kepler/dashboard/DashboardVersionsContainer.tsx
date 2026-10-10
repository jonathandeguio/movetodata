import MtdLoader from "components/mtdLoader";
import VersionHistory from "components/VersionHistory";
import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { isDefined } from "utils/utilities";
import { VERSION_MODE } from "../../../redux/constants/resourcePermissionConstants";

const DashboardVersionsContainer = () => {
  const { id } = useParams();
  if (!isDefined(id)) {
    throw new Error("Id is undefined, unable to load chart!");
  }
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  if (!resourcePermission) return <MtdLoader />;

  if (resourcePermission.mode != VERSION_MODE) return null;

  return (
    <div className="dashboardVersionContainer">
      <VersionHistory resourceId={id} pageType="dashboard" />;
    </div>
  );
};

export default DashboardVersionsContainer;

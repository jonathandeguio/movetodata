import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";
import AppContainer from "./AppContainer";

import { useSelector } from "react-redux";
import FileViewer from "../components/BlobViewer/BlobViewer.view";

import Connect from "Apps/Connect";
import ConnectAgents from "Apps/Connect/ConnectAgents.view";
import ConnectHome from "Apps/Connect/ConnectHome.view";
import ConnectLinks from "Apps/Connect/ConnectLinks.view";
import ConnectSources from "Apps/Connect/ConnectSources.view";
import Home from "../Apps/HomeV2/Home";
import HomeOutlet from "../Apps/HomeV2/Outlet/HomeOutlet";

import Builds from "components/Builds/BuildsHistory/Builds.view";
import Favs from "components/UserActivityVault/Favs.view";
import RecentlyViewed from "components/UserActivityVault/RecentlyViewed.view";
import BoslerUIComponents from "pages/Portal/BoslerUIComponents";
import NoDataComponents from "pages/Portal/NoDataComponents";
import TestingArea from "pages/Portal/TestingArea";
import Typhography from "pages/Portal/Typhography";

import NotificationSettings from "pages/Settings/NotificationPreferences/Notifications";
import PlatformSettings from "pages/Settings/PlatformConfig";
import ArtifactorySettings from "pages/Settings/PlatformConfig/ArtifactorySettings.view";
import { BackingFsSettings } from "pages/Settings/PlatformConfig/BackingFs/BackingFsSettings.view";
import BranchSettings from "pages/Settings/PlatformConfig/BranchSettings";
import { BulkUserCreationSettings } from "pages/Settings/PlatformConfig/BulkUserCreation/BulkUserCreationSettings.view";
import { CacheSettings } from "pages/Settings/PlatformConfig/Cache/CacheSettings.view";
import { DownloadSettings } from "pages/Settings/PlatformConfig/DownloadSettings.view";
import { GitSettings } from "pages/Settings/PlatformConfig/Git/GitSettings.view";
import { HistorySettings } from "pages/Settings/PlatformConfig/HistorySettings.view";
import HttpProxySettings from "pages/Settings/PlatformConfig/HTTPProxySettings.view";
import { ActivatePlatform } from "pages/Settings/PlatformConfig/License/ActivatePlatform.view";
import { LicensePage } from "pages/Settings/PlatformConfig/License/LicensePage.view";
import SMTPSettings from "pages/Settings/PlatformConfig/SMTPSettings.view";
import { SparkSettings } from "pages/Settings/PlatformConfig/Spark/SparkSettings.view";
import { ThemeSettings } from "pages/Settings/PlatformConfig/ThemeSettings.view";
import { TimezoneSettings } from "pages/Settings/PlatformConfig/TimezoneSettings.view";
import { UploadSettings } from "pages/Settings/PlatformConfig/UploadSettings.view";
import { isLicenseKeyUsedValid, isReactAppDevelopment } from "utils/utilities";
import ScheduleDetails from "../components/bottomBar/Schedules/Components/ScheduleDetails.view";
import Schedules from "../components/bottomBar/Schedules/Components/Schedules";
import BuildDetails from "../components/Builds/BuildDetails.view";
import CreatedByYou from "../components/UserActivityVault/CreatedByYou.view";
import UpdatedByYou from "../components/UserActivityVault/UpdatedByYou.view";
import DeveloperHome from "../pages/Developer/DeveloperHome";
import BoslerComponents from "../pages/Portal/BoslerComponents";
import IconList from "../pages/Portal/iconsList";
import ChangePassword from "../pages/Settings/ChangePassword";
import Groups from "../pages/Settings/Groups";
import LoginActivity from "../pages/Settings/LoginActivity";
import DeveloperSettings from "../pages/Settings/PlatformConfig/DeveloperSettings";
import Preferences from "../pages/Settings/Preferences";
import ProfileMe from "../pages/Settings/ProfileMe";
import SSO from "../pages/Settings/SSO";
import Tags from "../pages/Settings/Tags";
import Tokens from "../pages/Settings/Tokens";
import Users from "../pages/Settings/Users";

import PrivateOutlet from "../Authentication/PrivateOutlet";
import CodeEditor from "../components/editor/";
import Login from "../pages/Auth/Login";
import Logout from "../pages/Auth/Logout";
import Applications from "../pages/Portal/Applications";

import FileExplorer from "../Apps/explorer/";

import LinkDetails from "../Apps/Connect/Links/Link.view";
import SourceDetails from "../Apps/Connect/Sources/Source.view";
import LoginError from "../pages/Auth/LoginError";
import Notfound from "../pages/Errors/Notfound";
import BezierDetail from "../pages/Portal/BezierDetail";
import Sparks from "../pages/Portal/Sparks";
import Settings from "../pages/Settings";

import OAuth2RedirectHandler from "../Authentication/OAuth2RedirectHandler";
import ProjectsNav from "../pages/Portal/ProjectsNav";
import ManageGroups from "../pages/Settings/ManageGroups";
import ProfileUser from "../pages/Settings/ProfileUser";

import AgentDetails from "../Apps/Connect/Agents/Agent.view";
import SmartConnectorAnalysisPage from "../Apps/Connect/SmartConnector/SmartConnectorAnalysisPage";
import DatasetDetail from "../Apps/Dataset/DatasetDetail";

import { AccessManager } from "Apps/AccessManager";
import { AccessRequest } from "Apps/AccessManager/AccessRequest";
import { ChartsWrapper as Charts, Dashboard } from "Apps/Kepler/";
import Projects from "Apps/ProjectsV2";
import UserGroups from "pages/Settings/UserGroups";

const useRouter = () => {
  const { info, loading: licenseLoading } = useSelector(
    (state) => (state as any).license
  );

  return createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<AppContainer />}>
          <Route path="/" element={<PrivateOutlet />}>
            {licenseLoading || isLicenseKeyUsedValid(info) ? (
              <>
                <Route index element={<Navigate to="/portal/home" />} />
                <Route element={<ProjectsNav key={window.location.pathname} />}>
                  <Route path="/portal" element={<HomeOutlet />}>
                    <Route index element={<Navigate to="/portal/home" />} />
                    <Route path="home" element={<Home />} />
                    <Route path="projects" element={<Projects />} />

                    <Route path="applications" element={<Applications />} />

                    <Route path="recentlyViewed" element={<RecentlyViewed />} />
                    <Route path="favourites" element={<Favs />} />
                    <Route path="updatedByYou" element={<UpdatedByYou />} />
                    <Route path="createdByYou" element={<CreatedByYou />} />
                  </Route>
                  <Route
                    path="/portal/kitab/folder/:id"
                    element={<FileExplorer />}
                  />
                  <Route path="/portal/schedules" element={<Schedules />} />
                  <Route path="/portal/builds" element={<Builds />} />
                  <Route
                    path="/portal/accessManager"
                    element={<AccessManager />}
                  />

                  <Route path="/portal/connect" element={<Connect />}>
                    <Route index element={<ConnectHome />} />
                    <Route path="agent" element={<ConnectAgents />} />
                    <Route path="source" element={<ConnectSources />} />
                    <Route path="link" element={<ConnectLinks />} />
                  </Route>

                  <Route path="/portal" element={<DeveloperHome />}>
                    {process.env.NODE_ENV !== "production" && (
                      <>
                        <Route path="icons" element={<IconList />} />
                        <Route
                          path="components"
                          element={<BoslerComponents />}
                        />
                        <Route path="typography" element={<Typhography />} />
                        <Route
                          path="uicomponents"
                          element={<BoslerUIComponents />}
                        />
                        <Route path="nodata" element={<NoDataComponents />} />
                        <Route path="testingarea" element={<TestingArea />} />
                      </>
                    )}
                  </Route>

                  <Route path="/portal/blob/:id" element={<FileViewer />} />

                  <Route path="/portal/builds/:id" element={<BuildDetails />} />
                  <Route
                    path="/portal/accessManager/:id"
                    element={<AccessRequest />}
                  />
                  <Route
                    path="/portal/schedules/:id"
                    element={<ScheduleDetails />}
                  />
                  <Route
                    path="/portal/kitab/repository/:id/:branch/:detached?"
                    element={<CodeEditor />}
                  />
                  <Route
                    path="/portal/kitab/dataset/:id/:branch"
                    element={<DatasetDetail />}
                  />

                  <Route
                    path="/portal/bezier/:id/:branch"
                    element={<BezierDetail />}
                  />

                  <Route
                    path="/portal/kepler/CHART/:id"
                    element={<Charts />}
                  ></Route>
                  <Route
                    path="/portal/kepler/DASHBOARD/:id"
                    element={<Dashboard />}
                  ></Route>
                  <Route
                    path="/portal/kepler/DASHBOARD/:id/:tabId"
                    element={<Dashboard />}
                  ></Route>

                  <Route
                    path="/portal/connect/agent/:id"
                    element={<AgentDetails />}
                  />
                  <Route
                    path="/portal/connect/source/:id"
                    element={<SourceDetails />}
                  />
                  <Route
                    path="/portal/connect/source/:id/analyze"
                    element={<SmartConnectorAnalysisPage />}
                  />
                  <Route
                    path="/portal/connect/link/:id"
                    element={<LinkDetails />}
                  />

                  <Route
                    path="/portal/settings/user/:id"
                    element={<ProfileUser />}
                  />
                  <Route path="builds/:id" element={<Sparks />} />
                  <Route
                    path="/portal/settings/groups/:id/manageGroup"
                    element={<ManageGroups />}
                  />

                  <Route path="/portal/settings" element={<Settings />}>
                    <Route path="profile" element={<ProfileMe />} />
                    <Route path="preferences" element={<Preferences />} />
                    <Route
                      path="notifications"
                      element={<NotificationSettings />}
                    />
                    <Route path="tokens" element={<Tokens />} />
                    <Route path="users" element={<Users />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="tags" element={<Tags />} />
                    <Route path="loginActivity" element={<LoginActivity />} />
                    <Route path="userGroups" element={<UserGroups />} />
                    <Route path="changePassword" element={<ChangePassword />} />
                    <Route path="sso" element={<SSO />} />

                    <Route path="platform">
                      <Route path="home" element={<PlatformSettings />} />
                      <Route path="upload" element={<UploadSettings />} />
                      <Route path="download" element={<DownloadSettings />} />
                      <Route path="cache" element={<CacheSettings />} />
                      <Route path="history" element={<HistorySettings />} />
                      <Route path="timezone" element={<TimezoneSettings />} />
                      <Route path="theme" element={<ThemeSettings />} />
                      <Route path="license" element={<LicensePage />} />
                      <Route path="smtp" element={<SMTPSettings />} />
                      <Route
                        path="artifactory"
                        element={<ArtifactorySettings />}
                      />
                      <Route path="branch" element={<BranchSettings />} />
                      <Route path="httpProxy" element={<HttpProxySettings />} />
                      <Route path="backingFs" element={<BackingFsSettings />} />
                      <Route path="git" element={<GitSettings />} />
                      <Route path="spark" element={<SparkSettings />} />

                      <Route
                        path="bulkUserCreation"
                        element={<BulkUserCreationSettings />}
                      />
                      {isReactAppDevelopment() && (
                        <Route
                          path="developerSettings"
                          element={<DeveloperSettings />}
                        />
                      )}
                    </Route>
                  </Route>
                </Route>
              </>
            ) : (
              <>
                <Route index element={<Navigate to="/portal/home" />} />
                <Route path="/portal/home" element={<ActivatePlatform />} />
              </>
            )}
          </Route>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/relogin" element={<LoginError />} />
          <Route path="/auth/logout" element={<Logout />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route path="*" element={<Notfound />} />
        </Route>
      </>
    )
  );
};

export { useRouter };

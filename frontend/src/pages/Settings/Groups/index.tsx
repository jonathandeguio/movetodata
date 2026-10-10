import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllGroups } from "../../../redux/actions/authActions";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import MtdLoader from "components/mtdLoader";

import React from "react";

import { getLanguageLabel } from "utils/utilities";

import { ThunkAppDispatch } from "../../../redux/types/store";
import { GroupTab } from "./GroupsTable/GroupTab";
import { GROUP_TYPE_NAME } from "./Groups.utils";

const Groups = () => {
  const { user: groupAdmin } = useSelector(
    (state) => (state as any).groupAdmin
  );
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { allGroups, loading } = useSelector(
    (state) => (state as $TSFixMe).allGroups
  );
  const [selectedTab, setSelectedTab] = useState<string>(
    GROUP_TYPE_NAME.RESOURCE
  );

  useEffect(() => {
    dispatch(getAllGroups());
  }, []);

  if (loading) return <MtdLoader />;

  return (
    <MtdSwitch
      items={[
        {
          label: `${GROUP_TYPE_NAME.RESOURCE} ${getLanguageLabel("groups")}`,
          value: GROUP_TYPE_NAME.RESOURCE,
          children: (
            <GroupTab
              groups={allGroups.resource}
              isSystemGroup={false}
              loading={loading}
              isGroupCreationAllowed={platformAdmin || groupAdmin}
            />
          ),
        },
        {
          label: `${GROUP_TYPE_NAME.SYSTEM} ${getLanguageLabel("groups")}`,
          value: GROUP_TYPE_NAME.SYSTEM,
          children: (
            <GroupTab
              groups={allGroups.system}
              isSystemGroup={true}
              loading={loading}
              isGroupCreationAllowed={platformAdmin || groupAdmin}
            />
          ),
        },
      ]}
      value={selectedTab}
      onChange={(newVal: string) => {
        setSelectedTab(newVal);
      }}
    />
  );
};

export default Groups;

import { Avatar, Form, Select, Typography } from "antd";
import { IRequestAccessReview } from "Apps/AccessManager/AccessManager";
import { Resource } from "Apps/explorer/explorer";
import { getNodeIcon, ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { SearchIcon } from "assets/icons/mtdActionIcons";
import { Group } from "pages/Settings/Groups/Group";
import React, { Dispatch, SetStateAction, useState } from "react";
import { isDefined } from "utils/utilities";
import {
  getAllSystemGroupsAPI,
  getProjectsBasedOnSearchTextAPI,
} from "../RequestAccessModal.api";
import { REQUEST_ACCESS_TYPE } from "../RequestAccessModal.utils";
import styles from "../RequestAccessModal.module.scss";

interface IProps {
  accessRequest: IRequestAccessReview;
  setAccessRequest: Dispatch<SetStateAction<IRequestAccessReview>>;
  defaultProjectId?: string;
}

const { Text } = Typography;
const { Item } = Form;
const { Option } = Select;

const ProjectSelector = ({ accessRequest, setAccessRequest }: IProps) => {
  const [projects, setProjects] = useState([]);

  const getProjectBasedOnSearchText = (query: string) => {
    if (isDefined(query) && query.length >= 3)
      getProjectsBasedOnSearchTextAPI(query).then(({ data }) =>
        setProjects(data)
      );
  };

  return (
    <Select
      popupMatchSelectWidth
      placeholder={"Select your Project"}
      options={projects?.map((project: Resource) => ({
        key: project.id,
        value: project.id,
        name: project.name,
        label: (
          <div className="text-and-icon-center">
            {getNodeIcon(project.type, project.subType)}
            <Text>{project.name}</Text>
          </div>
        ),
      }))}
      labelRender={(option) => {
        return (
          option.label || (
            <div className="text-and-icon-center">
              {getNodeIcon(ResourceTypeEnum.PROJECT, "")}
              <Text>{accessRequest.requestTargetName}</Text>
            </div>
          )
        );
      }}
      value={accessRequest.requestTargetId}
      onSelect={(value, option) => {
        setAccessRequest({
          ...accessRequest,
          requestTargetId: value,
          requestTargetName: option?.name,
        });
      }}
      filterOption={false}
      showSearch={true}
      notFoundContent={null}
      onSearch={(e) => getProjectBasedOnSearchText(e)}
      suffixIcon={<SearchIcon />}
      className={styles.requestEntitySelector}
    />
  );
};

const AdministratorGroupSelector = ({
  accessRequest,
  setAccessRequest,
}: IProps) => {
  const [systemGroups, setSystemGroups] = useState<Group[]>([]);
  return (
    <Select
      popupMatchSelectWidth
      placeholder={"Select your Administrator Group"}
      onFocus={() => {
        getAllSystemGroupsAPI().then(({ data }) => {
          if (systemGroups.length == 0) setSystemGroups(data);
        });
      }}
      loading={systemGroups.length == 0}
      value={accessRequest.requestTargetId}
      onSelect={(value, option) => {
        setAccessRequest({
          ...accessRequest,
          requestTargetId: value,
          requestTargetName: option?.name,
        });
      }}
      className={styles.requestEntitySelector}
    >
      {systemGroups &&
        systemGroups?.map((i: $TSFixMe) => {
          return (
            <Option key={i.id} value={i.id} name={i.name}>
              <Avatar
                className={styles.avatar}
                src={i.profileImage != "" ? i.profileImage : null}
              >
                {i.name ? i.name.charAt(0).toUpperCase() : "B"}
              </Avatar>
              {i.name ? i.name : i.id} {i.username && <>({i.username})</>}
            </Option>
          );
        })}
    </Select>
  );
};

export const AddDetails = ({ accessRequest, setAccessRequest }: IProps) => {
  return (
    <Item
      label="Pick your access pass and unlock the ultimate experience!"
      required
    >
      {accessRequest.type == REQUEST_ACCESS_TYPE.PROJECT ? (
        <ProjectSelector
          accessRequest={accessRequest}
          setAccessRequest={setAccessRequest}
        />
      ) : (
        <AdministratorGroupSelector
          accessRequest={accessRequest}
          setAccessRequest={setAccessRequest}
        />
      )}
    </Item>
  );
};

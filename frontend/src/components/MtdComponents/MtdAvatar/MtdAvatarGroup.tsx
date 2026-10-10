import { Avatar } from "antd";
import React from "react";
import MtdAvatar from "./MtdAvatar";
import { isDefined } from "utils/utilities";
import { GroupProps } from "antd/es/avatar";
import { DEFAULT_MAX_GROUP_PROP } from "./MtdAvatar.constants";

interface IProps extends GroupProps {
  userIds: string[];
}

const MtdAvatarGroup = ({
  userIds,
  max = DEFAULT_MAX_GROUP_PROP,
  ...restProp
}: IProps) => {
  return (
    <Avatar.Group max={max} {...restProp}>
      {isDefined(userIds) &&
        userIds?.map((userId: string) => <MtdAvatar userId={userId} />)}
    </Avatar.Group>
  );
};

export default MtdAvatarGroup;

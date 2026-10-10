import { Avatar, AvatarProps, Popover, Typography } from "antd";
import { UserContent } from "components/UserPopover/userpopover";
import { User } from "global";
import { useUserHook } from "hooks/useUsers";
import React from "react";
import { useState } from "react";
import { isDefined, isEmpty } from "utils/utilities";

const { Text, Title } = Typography;
interface IProps extends AvatarProps {
  userId: string;
  disableUserPopover?: boolean;
}

const MtdAvatar = ({ userId, disableUserPopover, ...restProps }: IProps) => {
  const [userData, setUserData] = useState<User>();
  useUserHook(userId, {
    resolveCallback: (data) => {
      setUserData(data);
    },
  });

  const AvatarComponent = (
    <Avatar
      src={
        isDefined(userData) && !isEmpty(userData?.profileImage) ? (
          <img src={userData.profileImage} loading="lazy" />
        ) : null
      }
      {...restProps}
    >
      {isDefined(userData) && isDefined(userData?.name)
        ? userData?.name.charAt(0).toUpperCase()
        : "U"}
    </Avatar>
  );
  return disableUserPopover ? (
    AvatarComponent
  ) : (
    <Popover content={UserContent(userData)}>{AvatarComponent}</Popover>
  );
};

export default MtdAvatar;

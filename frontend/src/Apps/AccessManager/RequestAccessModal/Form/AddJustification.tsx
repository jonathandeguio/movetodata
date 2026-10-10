import { IRequestAccessReview } from "Apps/AccessManager/AccessManager";
import { Form } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { Dispatch, SetStateAction } from "react";

const { Item } = Form;

interface IProps {
  accessRequest: IRequestAccessReview;
  setAccessRequest: Dispatch<SetStateAction<IRequestAccessReview>>;
}

export const AddJustification = ({
  accessRequest,
  setAccessRequest,
}: IProps) => {
  return (
    <>
      <Item label="Title" required>
        <MtdInput
          value={accessRequest.title}
          onChange={(e) =>
            setAccessRequest({ ...accessRequest, title: e.target.value })
          }
          placeholder="Access Request Title Message"
        />
      </Item>

      <Item label="Explanation" required>
        <MtdInput
          value={accessRequest.description}
          onChange={(e) =>
            setAccessRequest({ ...accessRequest, description: e.target.value })
          }
          placeholder="Add Explanation"
        />
      </Item>
    </>
  );
};

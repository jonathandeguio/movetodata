import { AddUserIcon } from "assets/icons/mtdInterfaceIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { Dispatch, SetStateAction } from "react";
import { getLanguageLabel } from "utils/utilities";
import { Form } from "antd";
import { getAllGroups } from "../../../../redux/actions/authActions";
import { ThunkAppDispatch } from "redux/types/store";
import { useDispatch } from "react-redux";
import { createGroupAPI } from "../Groups.api";
import TextArea from "antd/es/input/TextArea";

interface IProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const { Item } = Form;

export const CreateNewGroupModal = ({ isOpen, setIsOpen }: IProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [form] = Form.useForm();

  const handleCreate = () => {
    createGroupAPI(form.getFieldsValue()).then(() => {
      setIsOpen(false);
      dispatch(getAllGroups());
    });
  };
  return (
    <Form
      form={form}
      onFinish={handleCreate}
      onKeyPress={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          form.submit();
        }
      }}
    >
      <MtdModal
        headingIcon={<AddUserIcon />}
        heading={getLanguageLabel("createNewGroup")}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footerButtonArea={
          <MtdButton
            icon={<TickIcon />}
            intent="action"
            htmlType="submit"
            onClick={handleCreate}
          >
            {getLanguageLabel("create")}
          </MtdButton>
        }
      >
        <div className="MtdHeader1">{getLanguageLabel("groupName")}</div>
        <Item
          name="name"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <MtdInput required />
        </Item>
        <div className="MtdHeader1">{getLanguageLabel("description")}</div>
        <Item name="description">
          <TextArea />
        </Item>
      </MtdModal>
    </Form>
  );
};

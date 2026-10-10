import { Form } from "antd";
import { FORM_FIELDS } from "Apps/ProjectsV2/utils/Projects.utils";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

interface IProps {
  resourceName: string;
  icon: React.ReactNode;
  isOpen: boolean;
  close: () => void;
  handleDelete: () => void;
}

const DeleteResourceModal = ({
  resourceName,
  icon,
  isOpen,
  close,
  handleDelete,
}: IProps) => {
  const [form] = Form.useForm();
  const name = Form.useWatch(FORM_FIELDS.NAME, form);
  return (
    <Form
      form={form}
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      colon={false}
      onFinish={handleDelete}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          form.submit();
        }
      }}
    >
      <MtdModal
        open={isOpen}
        onCancel={close}
        footerButtonArea={
          <Form.Item>
            <MtdButton
              intent="dangerous"
              htmlType="submit"
              disabled={name != resourceName}
              onClick={() => form.submit()}
              icon={<TrashIcon />}
            >
              {getLanguageLabel("delete")}
            </MtdButton>
          </Form.Item>
        }
        headingIcon={<TrashIcon color={"var(--DANGEROUS_COLOR)"} />}
        heading={"Delete"}
      >
        <Form.Item
          label={
            <>
              Please type &nbsp; <strong>{resourceName}</strong> &nbsp; to
              confirm.
            </>
          }
          name={FORM_FIELDS.NAME}
        >
          <MtdInput suffix={icon} placeholder={getLanguageLabel("name")} />
        </Form.Item>
      </MtdModal>
    </Form>
  );
};

export default DeleteResourceModal;

import { Form } from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const RenameModal = ({
  renameServiceDetails,
  setRenameServiceDetails,
  handleUpdate,
}: any) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      initialValues={{ name: renameServiceDetails.name }}
      onKeyPress={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          form.submit();
          setRenameServiceDetails({
            ...renameServiceDetails,
            modalView: false,
          });
        }
      }}
      onFinish={(values) => {
        handleUpdate(renameServiceDetails.id, values.name);
      }}
    >
      <MtdModal
        open={renameServiceDetails.modalView}
        onCancel={() =>
          setRenameServiceDetails({ ...renameServiceDetails, modalView: false })
        }
        headingIcon={<EditIcon />}
        heading={"Rename"}
        footerButtonArea={
          <MtdButton intent="action" onClick={() => form.submit()}>
            {getLanguageLabel("rename")}
          </MtdButton>
        }
      >
        Rename "{renameServiceDetails.name}"
        <Form.Item name="name">
          <MtdInput
            autoselect
            placeholder={getLanguageLabel("newName")}
            defaultValue={renameServiceDetails.name}
          />
        </Form.Item>
      </MtdModal>
    </Form>
  );
};

export default RenameModal;

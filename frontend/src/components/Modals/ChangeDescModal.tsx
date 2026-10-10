import { Form } from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const ChangeDescModal = ({
  changeDescServiceDetails,
  setChangeDescServiceDetails,
  handleUpdate,
}: any) => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{ description: changeDescServiceDetails.desc }}
      onKeyPress={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          form.submit();
        }
      }}
      onFinish={(values) => {
        handleUpdate(changeDescServiceDetails.id, values.description);
      }}
    >
      <MtdModal
        open={changeDescServiceDetails.modalView}
        onCancel={() =>
          setChangeDescServiceDetails({
            ...changeDescServiceDetails,
            modalView: false,
          })
        }
        headingIcon={<EditIcon />}
        heading={getLanguageLabel("changeDescription")}
        footerButtonArea={
          <MtdButton
            intent="action"
            onClick={() => form.submit()}
            // icon={<SaveIcon />}
            textTransform="none"
          >
            {getLanguageLabel("update")}
          </MtdButton>
        }
      >
        <Form.Item name="description">
          <MtdInput
            bordered
            autoselect
            placeholder={getLanguageLabel("newDescription")}
          />
        </Form.Item>
      </MtdModal>
    </Form>
  );
};

export default ChangeDescModal;

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { useDispatch } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { TrashIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import { ThunkAppDispatch } from "../../redux/types/store";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const DeleteModal = ({
  deleteServiceDetails,
  setDeleteServiceDetails,
  handleDelete,
}: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  return (
    <MtdModal
      open={deleteServiceDetails.modalView}
      onCancel={() =>
        setDeleteServiceDetails({ ...deleteServiceDetails, modalView: false })
      }
      footerButtonArea={
        <MtdButton
          intent="dangerous"
          disabled={deleteServiceDetails.disabled}
          onClick={() => handleDelete(deleteServiceDetails.id)}
          icon={<TrashIcon />}
        >
          {getLanguageLabel("delete")}
        </MtdButton>
      }
      headingIcon={<TrashIcon color={"var(--DANGEROUS_COLOR)"} />}
      heading={"Delete"}
    >
      Please Type{" "}
      <b style={{ fontWeight: "bold" }}>{deleteServiceDetails.name}</b> to
      confirm.
      <MtdInput
        bordered
        placeholder={getLanguageLabel("linkName")}
        onChange={(e) => {
          if (e.target.value === deleteServiceDetails.name) {
            setDeleteServiceDetails({
              ...deleteServiceDetails,
              disabled: false,
            });
          } else if (!deleteServiceDetails.disabled) {
            setDeleteServiceDetails({
              ...deleteServiceDetails,
              disabled: true,
            });
          }
        }}
      />
    </MtdModal>
  );
};

export default DeleteModal;

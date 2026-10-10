import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { getAllGroups } from "../../../../redux/actions/authActions";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { deleteGroupAPI } from "../Groups.api";
import { useDispatch } from "react-redux";
import { ThunkAppDispatch } from "redux/types/store";

interface IProps {
  id: string;
  name: string;
  isOpen: boolean;
  closeModal: () => void;
}
export const DeleteGroupModal = ({ id, name, isOpen, closeModal }: IProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  return (
    <MtdModal
      headingIcon={<TrashIcon color="var(--DANGEROUS_COLOR)" />}
      heading={getLanguageLabel("areYouSureYouWantToDeleteThis?")}
      open={isOpen}
      onCancel={closeModal}
      footerButtonArea={
        <MtdButton
          icon={<TrashIcon />}
          intent="dangerous"
          onClick={() =>
            deleteGroupAPI(id)
              .then(() => {
                dispatch(getAllGroups());
              })
              .catch((error) => {
                openNotification("Unable to delete group", "", "error");
              })
              .finally(closeModal)
          }
        >
          {getLanguageLabel("delete")}
        </MtdButton>
      }
    >
      {name} Group
    </MtdModal>
  );
};

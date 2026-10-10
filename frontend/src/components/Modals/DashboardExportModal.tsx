import { DocsIcon } from "assets/icons/mtdFileIcons";
import {
  CollectionIcon,
  DownloadIcon,
} from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { useDispatch } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { ThunkAppDispatch } from "../../redux/types/store";

interface TProps {
  openExportModal: boolean;
  setOpenExportModal: React.Dispatch<React.SetStateAction<boolean>>;
  donwloadImageCallback: (convertTo: "image" | "pdf") => void;
  gridRef: any;
}
const DashboardExportModal = ({
  openExportModal,
  setOpenExportModal,
  donwloadImageCallback,
  gridRef,
}: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const handleImageExport = () => {
    donwloadImageCallback("image");
  };

  const handlePDFExport = () => {
    donwloadImageCallback("pdf");
  };

  return (
    <MtdModal
      open={openExportModal}
      onCancel={() => setOpenExportModal(false)}
      headingIcon={<DownloadIcon />}
      heading={getLanguageLabel("export")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            background: "var(--background-color)",
            padding: "20px",
            border: "1px solid var(--movetodata-border-color-default)",
            height: "200px",
            width: "250px",
            gap: "10px",
          }}
        >
          <div className="MtdHeader1">
            <CollectionIcon />
            Image
          </div>
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            {getLanguageLabel("getParticularTab")} Image
          </div>
          <MtdButton icon={<DownloadIcon />} onClick={handleImageExport}>
            {getLanguageLabel("download")} Image
          </MtdButton>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "var(--background-color)",
            padding: "20px",
            border: "1px solid var(--movetodata-border-color-default)",
            height: "200px",
            width: "250px",
            gap: "10px",
          }}
        >
          <div className="MtdHeader1">
            <DocsIcon />
            PDF
          </div>
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            {getLanguageLabel("getParticularTab")} PDF
          </div>
          <MtdButton icon={<DownloadIcon />} onClick={handlePDFExport}>
            {getLanguageLabel("download")} PDF
          </MtdButton>
        </div>
      </div>
    </MtdModal>
  );
};

export default DashboardExportModal;

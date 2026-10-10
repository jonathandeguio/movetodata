import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { Editor } from "@monaco-editor/react";
import MtdLoader from "components/mtdLoader";
import { useDebounceState } from "hooks/useDebounce";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  encodeToBase64,
  isCurrentConfigThemeDark,
  isDefined,
  notEmpty,
} from "utils/utilities";
import {
  fetchBlobFileAPI,
  fetchResourceAPI,
  updateFileAPI,
} from "./BlobViewer.api";
import { checkAvailableFileType } from "./BlobViewer.utils";
import ComingSoon from "./ComingSoon";
import "./blobViewer.scss";
interface IProps {
  resourceId: string;
}

const BlobRender = ({ resourceId }: IProps) => {
  const { user } = useSelector((state: RootState) => state.userDetails);

  const [showFile, setShowFile] = useState<Blob>();
  const [fileDetails, setFileDetails] = useState({
    name: "",
    subType: "",
  });

  const [loading, setLoading] = useState(true);
  const [debouncedInput, setValue, value] = useDebounceState<string>();

  const getFile = async () => {
    let type = "";
    await fetchResourceAPI(resourceId).then(({ data }) => {
      setFileDetails(data);
      type = data.subType;
    });

    await fetchBlobFileAPI(resourceId).then((response) => {
      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: "application/octet-stream",
        });

        setShowFile(blob);
        if (type == "TXT") {
          blob.text().then((_value) => {
            setValue(_value);
          });
        }
      }
    });
  };

  useEffect(() => {
    getFile().finally(() => {
      setLoading(false);
    });
  }, [resourceId]);

  useEffect(() => {
    if (notEmpty(resourceId) && notEmpty(debouncedInput)) {
      updateFileAPI(resourceId, encodeToBase64(debouncedInput)).then(
        ({ data }) => {}
      );
    }
  }, [debouncedInput]);

  if (loading) {
    return <MtdLoader />;
  }

  return checkAvailableFileType(fileDetails.subType) ? (
    fileDetails.subType === "TXT" ? (
      <Editor
        defaultLanguage=""
        value={value}
        theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
        onChange={(value, event) => {
          if (isDefined(value)) {
            setValue(value);
          }
        }}
        options={{
          fontFamily:
            '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
        }}
      />
    ) : (
      <DocViewer
        config={{
          header: {
            disableHeader: true,
            disableFileName: true,
            retainURLParams: false,
          },
        }}
        documents={[
          {
            uri: window.URL.createObjectURL(showFile as Blob),
            fileType: fileDetails.subType.toLocaleLowerCase(),
            fileName: fileDetails.name,
          },
        ]}
        // style={{ height: "" }}
        pluginRenderers={DocViewerRenderers}
        theme={{
          // primary: "transparent",
          primary: "transparent",
          secondary: "transparent",
          tertiary: "transparent",
          //   textPrimary: "var(--color)",
          //   textSecondary: "var(--movetodata-font-color-muted)",
          //   textTertiary: "var(--movetodata-font-color-muted)",
          //   disableThemeScrollbar: true,
        }}
      />
    )
  ) : (
    <ComingSoon file={showFile} fileDetails={fileDetails} />
  );
};

export default React.memo(BlobRender);

import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import MtdLoader from "../mtdLoader";

import { useDebounceState } from "hooks/useDebounce";

import BlobHeader from "./BlobHeader";
import BlobRender from "./BlobRender";
import { fetchBlobFileAPI, fetchResourceAPI } from "./BlobViewer.api";

const BlobViewer = () => {
  const { id } = useParams();
  const [showFile, setShowFile] = useState<Blob>();
  const [fileDetails, setFileDetails] = useState({
    name: "",
    subType: "",
  });

  const [loading, setLoading] = useState(true);

  const getFile = async () => {
    let type = "";
    await fetchResourceAPI(id as string).then(({ data }) => {
      setFileDetails(data);
      type = data.subType;
    });

    await fetchBlobFileAPI(id as string).then((response) => {
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

  const [debouncedInput, setValue, value] = useDebounceState<string>();

  useEffect(() => {
    getFile().then(() => {
      setLoading(false);
    });
  }, []);

  return (
    <>
      {loading ? (
        <MtdLoader />
      ) : (
        <>
          <div className="blob-container">
            <BlobHeader
              file={showFile}
              fileDetails={fileDetails}
              setFileDetails={setFileDetails}
            />
            <div className="blob-container-plane">
              <BlobRender resourceId={id as string} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BlobViewer;

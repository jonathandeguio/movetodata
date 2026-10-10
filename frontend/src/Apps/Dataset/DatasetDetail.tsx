import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConfirmDeleteModal from "../../components/Modals/ConfirmDeleteModal";
import MtdLoader from "../../components/mtdLoader";

import { getDatasetDetailsAPI } from "Apps/Connect/Connect.api";
import { ResourceSubType, ResourceType } from "Apps/explorer/explorer.utils";
import { TBuildTrigger } from "components/Builds/Builds.types";
import { useDispatch } from "react-redux";
import { isDefined } from "utils/utilities";
import { getDatasetMapping } from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import Dataset from "./Dataset.view";
import DatasetUpload from "./DatasetUpload";

export interface IDatasetDetails {
  id: string;
  metaData: IDatasetMetaData;
  type: ResourceType;
  subType: ResourceSubType;
  buildId: string;
  transactionId: string;
  buildTrigger: TBuildTrigger;
}

export interface IDatasetMetaData {
  id: string;
  buildId: string;
  transactionId: string;
  buildTrigger: TBuildTrigger;
  defaultBranchPresent: boolean;
}

export default function DatasetDetail() {
  const { id, branch } = useParams();
  const dispatch = useDispatch<ThunkAppDispatch>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [datasetDetails, setDatasetDetails] = useState<IDatasetDetails>();

  // useHotkeys("ctrl+D,meta+D", (event: any) => {
  //   event.preventDefault();
  //   if (notEmpty(datasetMapping) && datasetMapping) {
  //     openNotification("Download Intiated", "", "success");
  //     downloadCSV(
  //       id as string,
  //       branch as string,
  //       datasetMapping.datasetMapping?.currentTransaction
  //     );
  //   } else
  //     openNotification(
  //       "Data not found",
  //       "No dataset available for download",
  //       "error"
  //     );
  // });

  // useHotkeys("ctrl+U,meta+U", (event: any) => {
  //   event.preventDefault();
  //   if (notEmpty(datasetMapping) && datasetMapping)
  //     setIsConfirmDeleteModalOpen(true);
  // });

  useEffect(() => {
    if (id && branch) {
      setIsLoading(true);
      getDatasetDetailsAPI(id as string, branch)
        .then(({ data }) => {
          dispatch(getDatasetMapping(id, branch));
          setDatasetDetails(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, branch]);

  if (!id || !branch || isLoading) {
    return <MtdLoader />;
  } else if (isDefined(datasetDetails) && !datasetDetails?.transactionId) {
    return <DatasetUpload id={id} branch={branch} />;
  } else if (datasetDetails)
    return (
      <>
        <ConfirmDeleteModal
          isVisible={isConfirmDeleteModalOpen}
          setIsVisible={setIsConfirmDeleteModalOpen}
        />
        <Dataset datasetDetails={datasetDetails} id={id} branch={branch} />
      </>
    );

  return null;
}

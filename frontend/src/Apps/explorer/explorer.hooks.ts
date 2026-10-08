import {
  useFileExplorerService,
  useResourceHook,
} from "hooks/useFileExplorerService";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { notEmpty, openNotification } from "utils/utilities";
import { updateFileExplorer } from "../../redux/fileExplorerSlice";
import { RootState } from "../../redux/types/store";
import { specialIds } from "./explorer.constants";
import {
  fillUrlTemplate,
  hareAndTortoisePath,
  objectToQueryParamString,
} from "./explorer.utils";

const getPath = (node: any, indexes: { [key: string]: any }): any[] => {
  return indexes[node?.id]
    ? getPath(indexes[node?.id], indexes).concat([node])
    : [node];
};

export const usePath = () => {
  const parentIndexes = useSelector(
    (state: RootState) => state.indexes.parentIndexes
  );
  const funct = useCallback(
    (node: any) => {
      if (hareAndTortoisePath(node, parentIndexes[node?.id], parentIndexes)) {
        openNotification(
          "Inconsistent data!",
          "Please refresh your browser and report this issue.",
          "error",
          0
        );
      }
      return getPath(node, parentIndexes);
    },
    [parentIndexes]
  );

  return [funct];
};

export const useNavigateHelper = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: openProjectId } = useParams();
  const { cacheDataPromise: getFileIndex } = useResourceHook();

  const defaultParams = {
    branch: "master",
  };

  const navigator = async (
    id: string,
    params: { [key: string]: string | number } = {},
    searchParams: { [key: string]: string | number } = {},
    openInNewTab = false,
    doNavigate = true
  ): Promise<string | null> => {
    let finalUrl: string | null = null;

    if (specialIds.includes(id)) {
      if (!openInNewTab) dispatch(updateFileExplorer({ activeId: id }));

      finalUrl = `/portal/kitab/folder/${openProjectId}?activeId=${id}`;
    } else {
      finalUrl = await getFileIndex(id).then((file) => {
        let url = "";

        const fileType = file.type?.toLowerCase() ?? "";
        switch (fileType) {
          case "folder":
            url = `/portal/kitab/folder/${file.project}`;
            searchParams["activeId"] = file.id;
            break;
          case "project":
            url = `/portal/kitab/folder/${file.id}`;
            searchParams["activeId"] = file.id;
            break;
          case "dataset":
            url = `/portal/kitab/dataset/${file.id}/{branch}`;
            break;
          case "repository":
            url = `/portal/kitab/repository/${file.id}/{branch}`;
            break;
          case "agent":
          case "source":
          case "link":
            url = `/portal/connect/${fileType}/${file.id}`;
            break;
          case "chart":
          case "dashboard":
            url = `/portal/kepler/${fileType}/${file.id}`;
            break;
          case "file":
            url = `/portal/blob/${file.id}`;
            break;
          default:
            openNotification(
              "Unknown Format! " + (file.type ?? "undefined"),
              "This format is not supported",
              "warning",
              2
            );
        }

        url = fillUrlTemplate(url, params, defaultParams);
        url = `${url}?${objectToQueryParamString(searchParams)}`;

        return url;
      });

      if (notEmpty(finalUrl) && doNavigate)
        openInNewTab ? window.open(finalUrl, "_blank") : navigate(finalUrl);
    }

    const promise = new Promise<string>((resolve, reject) => {
      resolve(
        window.location.href.split("/")[0] +
          "//" +
          window.location.href.split("/")[2] +
          finalUrl
      );
    });

    return promise;
  };

  return navigator;
};

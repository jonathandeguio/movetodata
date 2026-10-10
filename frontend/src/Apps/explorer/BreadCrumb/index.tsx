import { Tooltip, Typography } from "antd";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { StarIcon } from "assets/icons/mtdMiscellaneousIcons";
import { SingleChevronRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import {
  default as React,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  capitalizeFirstLetter,
  getLanguageLabel,
  getLastClassOfUUID,
  isDefined,
  isEmpty,
  openNotification,
} from "utils/utilities";
import { updateNameAndDesc } from "../../../redux/fileIndexSlice";
import { RootState } from "../../../redux/types/store";
import { putResource } from "../explorer.api";
import { specialIds } from "../explorer.constants";
import { usePath } from "../explorer.hooks";
import { getNodeFavIcon, getNodeIcon } from "../explorer.utils";
import { OverflowList } from "./OverflowList";
import "./breadCrumb.scss";

const { Text } = Typography;
interface Props {
  id: string;
  onClick?: (node: any) => void;
}

export const Breadcrumb: React.FC<Props> = ({ id, onClick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [firstResource, setFirstResource] = useState<any>(null);
  const [path, setPath] = useState<any[]>([]);
  const [shiftedPath, setShiftedPath] = useState<any[]>([]);
  const navigate = useNavigate();

  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );

  const dispatch = useDispatch();

  const [getPath] = usePath();
  const {
    getFileIndex,
    fetchResourceTree,
    addToFavourites,
    removeFromFavourites,
  } = useFileExplorerService();

  // Setting Browser Tab Title and Icon
  useEffect(() => {
    if (isDefined(path) && path.length > 0) {
      const _p = path[path.length - 1];
      document.title = _p.name ? _p.name : getLastClassOfUUID(_p.id);

      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getNodeFavIcon(_p.type, _p.subType);
    }
  }, [path]);

  // SET THE PATH FOR BREADCRUMB
  useEffect(() => {
    if (specialIds.includes(id)) {
      setPath([]);
      setShiftedPath([]);
    } else {
      if (!specialIds.includes(id) && isEmpty(fileIndexes[id])) {
        fetchResourceTree(id);
      }
      getFileIndex(id).then((data) => {
        const completePath = getPath(data);
        setFirstResource(completePath.shift());
        setPath(completePath);
        setShiftedPath([]);
      }).catch(() => {});
    }
  }, [id, fileIndexes, getPath]);

  // CHECK THE OVERFLOW -------------------------------------------------

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      overflowHandler(containerRef);
    });

    if (isDefined(containerRef.current)) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [path]);

  useLayoutEffect(() => {
    overflowHandler(containerRef);
  }, [containerRef.current?.scrollWidth, path]);

  const overflowHandler = (
    ref: React.MutableRefObject<HTMLDivElement | null>
  ) => {
    if (
      isDefined(path) &&
      path.length > 0 &&
      isDefined(ref.current) &&
      ref.current.scrollWidth > ref.current.offsetWidth
    ) {
      let pathCopy = [...path];
      console.log("IT IS OVERFLOWING", pathCopy, pathCopy.length);
      const lastElement = pathCopy.pop();
      if (pathCopy.length > 0) {
        setShiftedPath([...shiftedPath, pathCopy.shift()]);
        setPath([...pathCopy, lastElement]);
      } else {
        setShiftedPath([firstResource, ...shiftedPath]);
        setFirstResource(null);
      }
    }
  };

  const changeHandler = (node: any, value: any) => {
    if (value != node.name && value.length > 2) {
      putResource(node.id, {
        name: value,
      })
        .then(({ data }) => {
          const updatedData = {
            ...data,
          };
          dispatch(updateNameAndDesc(updatedData));
        })
        .catch(({ response }) => {
          openNotification(
            response.data.error,
            response.data.description,
            "error"
          );
        });
    }
  };

  // ======================================================================
  return (
    <div ref={containerRef} className="breadcrumb__container">
      {/* IN CASE THERE IS ANY SPECIAL ID ASSOCIATED */}
      {/* DISPLAY THE PROJECT | FIRST ANCESTOR */}
      {specialIds.includes(id) ? (
        <div className="breadcrumb">
          <div className="breadcrumb__item" style={{ cursor: "default" }}>
            {capitalizeFirstLetter(id.replace(/_/g, " ").toLowerCase())}
          </div>
        </div>
      ) : (
        isDefined(firstResource) && (
          <div className="breadcrumb">
            {path.length !== 0 && <ProjectIcon />}

            {path.length + shiftedPath.length !== 0 ? (
              <>
                <div
                  className="breadcrumb__item"
                  onClick={() => {
                    if (path.length + shiftedPath.length !== 0)
                      if (isDefined(onClick)) {
                        onClick(firstResource);
                      } else {
                        navigate(
                          `/portal/kitab/folder/${
                            firstResource.project ?? firstResource.id
                          }?activeId=${firstResource.id}`
                        );
                      }
                  }}
                >
                  {firstResource.name}
                </div>
                <div className="flex">
                  <SingleChevronRightIcon />
                </div>
              </>
            ) : (
              <>
                <div className="flex">
                  {getNodeIcon(
                    firstResource.type,
                    firstResource.subType,
                    false,
                    16,
                    firstResource.metaData
                  )}
                </div>
                <Text>
                  <Tooltip title={getLanguageLabel("clickToRename")}>
                    <MtdInput
                      dynamicWidth
                      style={{ fontSize: "22px", fontWeight: 500 }}
                      editText
                      className="editText"
                      debounceInterval={5000}
                      onChange={(e: any) => {
                        changeHandler(firstResource, e.target.value);
                      }}
                      variant={"borderless"}
                      value={firstResource.name}
                      placeholder="Add the Name of the file"
                    />
                  </Tooltip>
                </Text>
                <div
                  onClick={(e) => {
                    if (firstResource.favourite) {
                      removeFromFavourites(firstResource.id);
                    } else {
                      addToFavourites(firstResource.id);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex"
                  style={{ cursor: "pointer" }}
                >
                  <StarIcon
                    color={firstResource.favourite ? "#ffc940" : "#ffffff"}
                    stroke={firstResource.favourite ? "#ffc940" : "#717a94"}
                    size={16}
                  />
                </div>
              </>
            )}
          </div>
        )
      )}
      {/* DISPLAY THE OVERFLOW LIST */}
      <OverflowList
        onClick={onClick}
        overflowList={shiftedPath}
        hasLast={path.length === 0}
      />
      {/* DISPLAY THE REMAINING DATA */}
      <div className="breadcrumb">
        {path.map((p: any, index: number) => {
          return (
            <>
              {index + 1 < path.length ? (
                <>
                  <div
                    className="breadcrumb__item"
                    onClick={() => {
                      if (index + 1 < path.length) {
                        if (isDefined(onClick)) {
                          onClick(p);
                        } else {
                          navigate(
                            `/portal/kitab/folder/${
                              p.project ?? p.id
                            }?activeId=${p.id}`
                          );
                        }
                      }
                    }}
                  >
                    {p.name}
                  </div>
                  <div className="flex">
                    <SingleChevronRightIcon />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex">
                    {getNodeIcon(p.type, p.subType, false, 16, p.metaData)}
                  </div>
                  <Text>
                    <Tooltip title={getLanguageLabel("clickToRename")}>
                      <MtdInput
                        style={{ fontSize: "22px", fontWeight: 500 }}
                        editText
                        dynamicWidth
                        className="editText"
                        debounceInterval={1000}
                        onChange={(e: any) => {
                          changeHandler(p, e.target.value);
                        }}
                        variant={"borderless"}
                        value={p.name}
                        placeholder="Add the Name of the file"
                      />
                    </Tooltip>
                  </Text>
                  <div
                    onClick={(e) => {
                      if (p.favourite) {
                        removeFromFavourites(p.id);
                      } else {
                        addToFavourites(p.id);
                      }

                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="flex"
                    style={{ cursor: "pointer" }}
                  >
                    <StarIcon
                      color={p.favourite ? "#ffc940" : "#ffffff"}
                      stroke={p.favourite ? "#ffc940" : "#717a94"}
                      size={16}
                    />
                  </div>
                </>
              )}
            </>
          );
        })}
      </div>
    </div>
  );
};

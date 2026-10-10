import React, { useState } from "react";

import {
  Col,
  Divider,
  Popover,
  Row,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { TagsIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  getLanguageLabel,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";
import { fetchUserDetailsAPI } from "../Dataset.api";
import {
  fetchAllTagsWithCategoryAPI,
  fetchDatasetTagsAPI,
  manageDatasetTagsAPI,
} from "./Tags.api";

import { applyTags, getTagCategory, removeTags } from "./Tags.utils";

const Tags = ({ id }: { id: string }) => {
  const [datasetTags, setDatasetTags] = useState<object[]>();
  const [tagsModal, setTagsModal] = useState<boolean>();
  const [addedTags, setAddedTags] = useState<object[]>();
  const [removedTags, setRemovedTags] = useState<string[]>();
  const [categoriesData, setCategoriesData] = useState<object[]>();
  const [editAddedTags, setEditAddedTags] = useState<boolean>(false);

  const [isEditingOn, setIsEditingOn] = useState(false);

  const [createdBy, setCreatedBy] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");

  const handleTagsLoad = () => {
    fetchDatasetTagsAPI(id)
      .then(({ data }) => {
        setDatasetTags(data);
        setAddedTags(data);
      })
      .catch((error) => {
        openNotification(
          "Failed to fetch tags for the dataset",
          "Please wait or retry",
          "error"
        );
      });
  };

  const handleTagModalCancel = () => {
    setTagsModal(false);
    setRemovedTags([]);
    setIsEditingOn(false);
  };

  const handleAddRemoveTags = () => {
    if (addedTags && addedTags.length != 0 && editAddedTags) {
      const payload = {
        datasetId: id,
        tagIds: addedTags.map((element: any) => element.id),
        action: "add",
      };

      manageDatasetTagsAPI(payload)
        .then(() => handleTagsLoad())
        .catch((error) => {
          openNotification(
            "Failed to fetch tags for the dataset",
            "Please wait or retry",
            "error"
          );
        });
    }
    if (removedTags && removedTags.length != 0) {
      const payload = {
        datasetId: id,
        tagIds: removedTags,
        action: "remove",
      };
      manageDatasetTagsAPI(payload)
        .then(() => handleTagsLoad())
        .catch((error) => {
          openNotification(
            "Failed to fetch tags for the dataset",
            "Please wait or retry",
            "error"
          );
        });
    }

    setIsEditingOn(false);
  };

  return (
    <>
      <MtdModal
        headingIcon={<TagsIcon />}
        heading={
          <Row justify={"space-between"} align="middle">
            <Col>{getLanguageLabel("tags")}</Col>
          </Row>
        }
        extraActionHeading={
          isEditingOn ? (
            <MtdButton
              icon={<TickIcon />}
              intent="success"
              onClick={handleAddRemoveTags}
            >
              {getLanguageLabel("apply")}
            </MtdButton>
          ) : (
            <MtdButton
              icon={<EditIcon />}
              onClick={() => setIsEditingOn(true)}
            >
              {getLanguageLabel("edit")}
            </MtdButton>
          )
        }
        open={tagsModal}
        onCancel={handleTagModalCancel}
        width={600}
      >
        <div className="tags-modal">
          {isEditingOn ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography.Title level={5}>
                  {getLanguageLabel("appliedTags")}
                </Typography.Title>
                <Typography.Text>
                  {addedTags?.length} {getLanguageLabel("tagsAppliedToDataset")}
                </Typography.Text>
              </div>
              <div className="tags-modal-applied-tags">
                {addedTags && addedTags.length != 0 ? (
                  <>
                    {addedTags.map((value: any) => {
                      return (
                        <Tag
                          closable
                          color={value.color}
                          onClick={() =>
                            applyTags(
                              value,
                              addedTags,
                              setEditAddedTags,
                              setAddedTags
                            )
                          }
                          onClose={() =>
                            removeTags(
                              value,
                              removedTags,
                              setRemovedTags,
                              datasetTags
                            )
                          }
                        >
                          {" "}
                          {value.name}
                        </Tag>
                      );
                    })}
                  </>
                ) : (
                  <Space
                    direction="horizontal"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      height: "10vh",
                    }}
                  >
                    <Typography.Text>
                      {getLanguageLabel("clickOnOneOfTheTagsAboveToApply")}
                    </Typography.Text>
                  </Space>
                )}
              </div>
              <Typography.Title level={5}>
                {getLanguageLabel("available")} {getLanguageLabel("tags")}
              </Typography.Title>
              <div className="tags-modal-available-tags">
                {categoriesData
                  ? categoriesData.map((category: any) => {
                      if (category.enabled) {
                        return (
                          <>
                            <div className="MtdHeader1">{category.name}</div>
                            {category.tags.map((value: any) => {
                              return (
                                <Tag
                                  color={value.color}
                                  onClick={() =>
                                    applyTags(
                                      value,
                                      addedTags,
                                      setEditAddedTags,
                                      setAddedTags
                                    )
                                  }
                                >
                                  {value.name}
                                </Tag>
                              );
                            })}
                            <Divider
                              type="horizontal"
                              style={{ margin: "5px 0 " }}
                            />
                          </>
                        );
                      }
                    })
                  : ""}
              </div>
            </>
          ) : (
            <>
              {datasetTags && (
                <>
                  {datasetTags.map((value: any) => {
                    return (
                      <Popover
                        color={value.color}
                        title={
                          categoriesData == undefined ||
                          categoriesData.length == 0 ? (
                            <Skeleton />
                          ) : (
                            <span style={{ color: "white" }}>
                              <TagsIcon />

                              {getTagCategory(value.id, categoriesData)}
                            </span>
                          )
                        }
                        content={
                          <span style={{ color: "white" }}>
                            <table>
                              <tbody>
                                {value.name && (
                                  <tr>
                                    <th>{getLanguageLabel("name")}</th>
                                    <td>
                                      <Tag color={value.color}>
                                        {value.name}
                                      </Tag>
                                    </td>
                                  </tr>
                                )}
                                {value.description && (
                                  <tr>
                                    <th>{getLanguageLabel("description")}</th>
                                    <td>{value.description}</td>
                                  </tr>
                                )}
                                {value.createdAt && (
                                  <tr>
                                    <th>{getLanguageLabel("createdAt")}</th>
                                    <td>{timeConverter(value.createdAt)}</td>
                                  </tr>
                                )}
                                {value.createdBy && (
                                  <tr>
                                    <th>{getLanguageLabel("createdBy")}</th>
                                    <td>
                                      {createdBy === "" ? (
                                        <MtdLoader size="tiny" />
                                      ) : (
                                        createdBy
                                      )}
                                    </td>
                                  </tr>
                                )}
                                {value.updatedAt && (
                                  <tr>
                                    <th>{getLanguageLabel("updatedAt")}</th>
                                    <td>{timeConverter(value.updatedAt)}</td>
                                  </tr>
                                )}
                                {value.updatedBy && (
                                  <tr>
                                    <th>{getLanguageLabel("updatedBy")}</th>
                                    <td>
                                      {updatedBy === "" ? (
                                        <MtdLoader size="tiny" />
                                      ) : (
                                        updatedBy
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </span>
                        }
                      >
                        <Tag
                          onMouseOver={() => {
                            if (isDefined(value.createdBy))
                              fetchUserDetailsAPI(value.createdBy).then(
                                ({ data }) => setCreatedBy(data.name)
                              );
                            if (isDefined(value.updatedBy))
                              fetchUserDetailsAPI(value.updatedBy).then(
                                ({ data }) => setUpdatedBy(data.name)
                              );
                          }}
                          color={value.color}
                        >
                          {" "}
                          {value.name}
                        </Tag>
                      </Popover>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </MtdModal>

      <Tooltip title={getLanguageLabel("tags")} placement={"bottom"}>
        <MtdButton
          onClick={() => {
            setTagsModal(true);
            fetchAllTagsWithCategoryAPI()
              .then(({ data }) => setCategoriesData(data))
              .catch((error) =>
                openNotification(
                  "Failed to fetch categories",
                  "Please retry",
                  "error"
                )
              );
            handleTagsLoad();
          }}
          minimal
          icon={<TagsIcon size={22} />}
          icononly
          trimicononlypadding
        />
      </Tooltip>
    </>
  );
};

export default Tags;

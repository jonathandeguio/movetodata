import React from "react";

import type { MenuProps } from "antd";
import {
  Button,
  Col,
  Divider,
  Dropdown,
  Layout,
  Menu,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import axios from "axios";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguageLabel, openNotification } from "utils/utilities";
import {
  AddIcon,
  CrossIcon,
  SaveIcon,
  SearchIcon,
} from "../../assets/icons/mtdActionIcons";
import { ScatterIcon } from "../../assets/icons/mtdChartIcons";
import { TrashIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronDownIcon,
  SingleChevronLeftIcon,
} from "../../assets/icons/mtdNavigationIcon";
import MtdButton from "../../components/MtdComponents/ButtonComponent/MtdButton";
import MtdUserPopover from "../../components/UserPopover/userpopover";
import MtdLoader from "../../components/mtdLoader";
import GlobalSearch from "../../helpers/GlobalSearch";
import { useUserHook } from "hooks/useUsers";
import { User } from "global";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const Tags = () => {
  const navigate = useNavigate();

  const menuStyle = {
    boxShadow: "none",
  };

  // const [isAdmin, setIsAdmin] = useState();

  // GLOBAL DATA
  const [menuVisible, setMenuVisible] = useState(true);
  const [tagSiderVisible, setTagSiderVisible] = useState(false);
  const [categorySiderVisible, setCategorySiderVisible] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [tagsList, setTagsList] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState();
  const [colorsDropdownVisible, setColorsDropdownVisible] =
    useState<boolean>(false);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);
  const [tagLoading, setTagLoading] = useState<boolean>(false);

  // SELECTED CATEGORY INFORMATION
  const [selectedCategory, setSelectedCategory] = useState<any>();
  const [categoryName, setCategoryName] = useState<string>();
  const [categoryDescription, setCategoryDescription] = useState<string>();
  const [categoryCreateUser, setCategoryCreateUser] = useState<any>();
  const [categoryUpdateUser, setCategoryUpdateUser] = useState<any>();
  const [categoryEnabled, setCategoryEnabled] = useState<boolean>(true);

  // // SELECTED TAG INFORMATION
  const [selectedTag, setSelectedTag] = useState<any>();
  const [tagName, setTagName] = useState<string>();
  const [tagDescription, setTagDescription] = useState<string>();
  const [tagCreateUser, setTagCreateUser] = useState<any>();
  const [tagUpdateUser, setTagUpdateUser] = useState<any>();
  const [tagColor, setTagColor] = useState<string>();
  const [customTagColor, setCustomTagColor] = useState<string>();

  // const dispatch = useDispatch<ThunkAppDispatch>();

  // PRESET COLORS FOR TAG
  const colors = [
    "magenta",
    "red",
    "volcano",
    "orange",
    "gold",
    "lime",
    "green",
    "cyan",
    "blue",
    "geekblue",
    "purple",
  ];
  const colorsDropdown: MenuProps["items"] = colors.map((color) => ({
    key: color,
    label: color,
  }));
  const onClick: MenuProps["onClick"] = ({ key }) => {
    setTagColor(key);
    setColorsDropdownVisible(false);
  };

  // ANT DESIGN TABLE COLUMNS
  const columns = [
    {
      title: getLanguageLabel("tagName"),
      dataIndex: "name",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      width: "30%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return (
          <>
            <div
              style={{
                display: "flex",
                marginRight: "1ev",
                alignItems: "center",
              }}
            >
              <>{text}</>
            </div>
          </>
        );
      },
    },
    {
      title: getLanguageLabel("description"),
      dataIndex: "description",
      width: "30%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return <>{text}</>;
      },
    },
    {
      title: getLanguageLabel("tagColor"),
      dataIndex: "color",
      width: "30%",
      render: (color: $TSFixMe, record: $TSFixMe) => {
        return (
          <>
            <Tag color={color} key={record.name}>
              {record.name.toUpperCase()}
            </Tag>
          </>
        );
      },
    },
  ];

  // FUNCTION TO CREATE MENU ITEMS FROM CATEGORY LIST
  type MenuItem = Required<MenuProps>["items"][number];

  function getItem(
    label?: string,
    key?: React.Key,
    icon?: React.ReactNode,
    type?: "divider"
  ): MenuItem {
    return {
      key,
      icon,
      label,
      type,
    } as MenuItem;
  }

  const getUser = useUserHook();

  // USE EFFECTS
  useEffect(() => {
    getCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (categoriesList && categoriesList.length !== 0) {
      const items: MenuProps["items"] = categoriesList.map((item, index) =>
        getItem(item.name, item.name, <ScatterIcon />)
      );
      setMenuItems(items);
    }
  }, [categoriesList]);

  useEffect(() => {
    if (selectedCategory != null && selectedCategory !== "new") {
      setCategoryName(selectedCategory.name);
      setCategoryDescription(selectedCategory.description);
      setCategoryEnabled(selectedCategory.enabled);
    }
  }, [selectedCategory]);

  // FUNCTIONS
  const getCategoriesAndTags = async () => {
    setCategoryLoading(true);
    setTagLoading(true);

    try {
      const { data } = await axios.get(`/docket/category/all`);
      setCategoriesList(data);
      setCategoryLoading(false);
    } catch (error) {
      openNotification("Failed to fetch categories", " ", "error");
      setCategoryLoading(false);
    }

    try {
      const { data } = await axios.get(`/docket/tag/all`);
      setTagsList(data);
      setTagLoading(false);
    } catch (error) {
      openNotification("Failed to fetch tags", " ", "error");
      setTagLoading(false);
    }
  };

  const clearCategoryStateVariables = () => {
    setSelectedCategory(null);
    setCategoryEnabled(true);
    setCategoryUpdateUser(null);
    setCategoryCreateUser(null);
    setCategoryDescription("");
    setCategoryName("");
  };

  const clearTagStateVariables = () => {
    setSelectedTag(null);
    setTagColor("");
    setTagUpdateUser(null);
    setTagCreateUser(null);
    setTagDescription("");
    setTagName("");
  };

  const handleCategoryClick = async (e: any) => {
    const category = categoriesList.find((element) => element.name == e.key);
    setMenuVisible(false);
    setSelectedCategory(category);
    setFilteredData(category.tags);
    getUser(category.createdBy).then((user: User) => {
      setCategoryCreateUser(user);
    });
    getUser(category.updatedBy).then((user: User) => {
      setCategoryUpdateUser(user);
    });
    // setCategoryCreateUser(await userInfo(category.createdBy));
    // setCategoryUpdateUser(await userInfo(category.updatedBy));
  };

  const handleTagsClick = async (tag: any) => {
    setCategorySiderVisible(false);
    setTagSiderVisible(true);
    setSelectedTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagDescription(tag.description);
    getUser(tag.createdBy).then((user: User) => {
      setTagCreateUser(user);
    });
    getUser(tag.updatedBy).then((user: User) => {
      setTagUpdateUser(user);
    });
    // setTagCreateUser(await userInfo(tag.createdBy));
    // setTagUpdateUser(await userInfo(tag.updatedBy));
  };

  const handleBack = () => {
    setFilteredData(undefined);
    setSelectedCategory(undefined);
    setMenuVisible(true);
    clearCategoryStateVariables();
  };

  const handleClose = () => {
    setCategorySiderVisible(true);
    setTagSiderVisible(false);
    clearTagStateVariables();
  };

  const checkColorHex = (colorCode: string) => {
    if (!/^#([0-9a-fA-F]{3}){1,2}$/i.test(colorCode)) {
      openNotification(
        "Invalid HEX Code",
        "Please enter a valid HEX code",
        "error"
      );
    } else {
      setTagColor(colorCode);
    }
  };

  const handleColorSaveButton = () => {
    checkColorHex(customTagColor!);
    setColorsDropdownVisible(false);
  };

  const handleNewCategory = () => {
    setMenuVisible(false);
    setSelectedCategory("new");
  };

  const handleNewTag = () => {
    setTagSiderVisible(true);
    setCategorySiderVisible(false);
    setSelectedTag("new");
  };

  const handleCategoryDeleteOrCancel = async () => {
    if (selectedCategory === "new") {
      handleBack();
    } else {
      try {
        const { data } = await axios.get(
          `/docket/category/delete/${selectedCategory.id}`
        );
        openNotification("Category Deleted!", " ", "success");
        getCategoriesAndTags();
        handleBack();
      } catch (error) {
        openNotification(
          "Failed to delete category with id " + selectedCategory.id,
          " ",
          "error"
        );
      }
    }
  };

  const handleCategoryUpdateOrCreate = async () => {
    if (selectedCategory === "new") {
      try {
        if (categoryName != undefined && categoryDescription != undefined) {
          var jsonData = {
            name: categoryName,
            description: categoryDescription,
            enabled: categoryEnabled,
          };
          const { data } = await axios.post(
            `/docket/category/create`,
            jsonData
          );
          getCategoriesAndTags();
          handleBack();
          openNotification("Category Created!", " ", "success");
        } else throw "Something went wrong";
      } catch (error) {
        openNotification(
          "Failed to create category " + categoryName,
          " ",
          "error"
        );
      }
    } else {
      try {
        if (categoryName != undefined && categoryDescription != undefined) {
          var jsonData = {
            name: categoryName,
            description: categoryDescription,
            enabled: categoryEnabled,
          };
          const { data } = await axios.put(
            `/docket/category/update/${selectedCategory.id}`,
            jsonData
          );
          getCategoriesAndTags();
          openNotification("Category Updated!", " ", "success");
        } else throw "Something went wrong";
      } catch (error) {
        openNotification(
          "Failed to update category named " + categoryName,
          " ",
          "error"
        );
      }
    }
  };

  const handleTagDeleteOrCancel = async () => {
    if (selectedTag === "new") {
      handleClose();
    } else {
      try {
        const { data } = await axios.get(
          `/docket/tag/delete/${selectedTag.id}`
        );
        openNotification("Tag Deleted!", "Tag succesfully deleted", "success");
        updateData();
        handleClose();
      } catch (error) {
        openNotification("Failed to delete tag named " + tagName, " ", "error");
      }
    }
  };

  const handleTagUpdateOrCreate = async () => {
    if (selectedTag === "new") {
      try {
        if (
          tagName != undefined &&
          tagDescription != undefined &&
          tagColor != undefined &&
          selectedCategory.id != undefined
        ) {
          const jsonData = {
            name: tagName,
            description: tagDescription,
            color: tagColor,
            tagsCategoryId: selectedCategory.id,
          };
          const { data } = await axios.post(`/docket/tag/create`, jsonData);
          openNotification("Tag Created!", "Tag creation succesful", "success");
          updateData();
          handleClose();
        } else throw "Something went wrong";
      } catch (error) {
        openNotification("Failed to create tag " + tagName, " ", "error");
      }
    } else {
      try {
        if (
          tagName != undefined &&
          tagDescription != undefined &&
          tagColor != undefined
        ) {
          const jsonData = {
            name: tagName,
            description: tagDescription,
            color: tagColor,
          };
          const { data } = await axios.put(
            `/docket/tag/update/${selectedTag.id}`,
            jsonData
          );
          openNotification("Tag Updated!", " ", "success");
          updateData();
        } else throw "Something went wrong";
      } catch (error) {
        openNotification("Failed to update tag named " + tagName, " ", "error");
      }
    }
  };

  const updateData = async () => {
    await getCategoriesAndTags().then(() => {
      if (selectedCategory != undefined) {
        setFilteredData(
          categoriesList.find((category) => category.id == selectedCategory.id)
            .tags
        );
      }
    });
  };

  return (
    <>
      {categoriesList == undefined || categoryLoading || tagLoading ? (
        <div className="settings-center-block">
          <MtdLoader />
        </div>
      ) : (
        <div className="settings-center-block">
          <p>
            <Row justify="space-between">
              <Col>
                <Title level={3}>{getLanguageLabel("tags")}</Title>
                <Text type="secondary">{getLanguageLabel("tagMsg")}</Text>
              </Col>
            </Row>
            <Divider />
          </p>

          <MtdInput
            placeholder={getLanguageLabel("searchCategories")}
            allowClear
            onChange={(e) => {
              setFilteredData(GlobalSearch(e.target.value, tagsList, columns));
            }}
            suffix={<SearchIcon />}
          />
          <Layout hasSider style={{ height: "56vh" }}>
            <Sider
              collapsed={!categorySiderVisible}
              className="tags-sider"
              // trigger={null}
              breakpoint="lg"
              collapsedWidth="0"
              onBreakpoint={(broken) => {
                //
              }}
              onCollapse={(collapsed, type) => {
                //
              }}
              width={"20%"}
              style={{
                height: "max-content",
                boxShadow: "none",
                border: "none",
              }}
            >
              <div
                style={{
                  display: menuVisible ? "flex" : "none",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <br />

                <MtdButton
                  icon={<AddIcon />}
                  intent="action"
                  onClick={handleNewCategory}
                >
                  {" "}
                  {getLanguageLabel("newCategory")}{" "}
                </MtdButton>
              </div>
              <div
                style={{
                  height: "46vh",
                  overflow: "auto",
                  display: menuVisible ? "block" : "none",
                }}
              >
                <Menu
                  // theme="dark"
                  selectedKeys={[]}
                  mode="inline"
                  defaultSelectedKeys={[]}
                  items={menuItems}
                  onSelect={(e) => handleCategoryClick(e)}
                />
              </div>

              <div
                style={{
                  display: !menuVisible ? "inline" : "none",
                }}
              >
                <Button
                  type="text"
                  size="small"
                  className="interactive"
                  style={{
                    aspectRatio: "1",

                    padding: "1%",
                    margin: "3%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1em",
                  }}
                  onClick={handleBack}
                >
                  <SingleChevronLeftIcon />
                </Button>

                {selectedCategory !== undefined ? (
                  <div
                    style={{
                      display: "flex",
                      height: "52vh",
                      marginTop: "-2.5em",
                      flexDirection: "column",
                      // justifyContent: 'center',
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedCategory === "new" ? (
                      <Space style={{ padding: "2em", marginTop: "-3em" }}>
                        <MtdInput
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder={getLanguageLabel("enterCategoryName")}
                          required
                          style={{
                            fontSize: "large",
                            textAlign: "center",
                            fontWeight: "900",
                          }}
                        />
                      </Space>
                    ) : (
                      <>
                        <Button
                          type="text"
                          className="interactive"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBlock: "2em",
                          }}
                          onClick={handleNewTag}
                        >
                          <AddIcon />
                          &thinsp;
                          {getLanguageLabel("addNewTag")}
                        </Button>
                        <Title
                          editable={{
                            tooltip: getLanguageLabel("editName"),
                            onChange: setCategoryName,
                            enterIcon: null,
                          }}
                          level={3}
                        >
                          {categoryName}
                        </Title>
                      </>
                    )}
                    <div className="category-summary">
                      <table width="calc(365vw+ 0%)">
                        <tr>
                          <th>{getLanguageLabel("description")}</th>
                          <td>
                            {selectedCategory === "new" ? (
                              <MtdInput
                                onChange={(e) =>
                                  setCategoryDescription(e.target.value)
                                }
                                placeholder={getLanguageLabel(
                                  "enterCategoryDescription"
                                )}
                                required
                              />
                            ) : (
                              <Text
                                editable={{
                                  tooltip: getLanguageLabel("editDescription"),
                                  onChange: setCategoryDescription,
                                  enterIcon: null,
                                }}
                              >
                                {categoryDescription}
                              </Text>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>{getLanguageLabel("enabled")}</th>
                          <td>
                            <Switch
                              onChange={setCategoryEnabled}
                              checked={categoryEnabled}
                              size="small"
                            />
                          </td>
                        </tr>
                        {selectedCategory === "new" ? (
                          ""
                        ) : (
                          <>
                            <tr>
                              <th>{getLanguageLabel("createdBy")}</th>
                              <td>
                                {categoryCreateUser == undefined ? (
                                  <MtdLoader size="small" />
                                ) : categoryCreateUser === "-" ? (
                                  categoryCreateUser
                                ) : (
                                  <MtdUserPopover
                                    id={categoryCreateUser.id}
                                    record={categoryCreateUser}
                                  >
                                    <div
                                      style={{
                                        display: "inline-block",
                                      }}
                                      className="pop-over-item"
                                    >
                                      <div
                                        onClick={(e) =>
                                          navigate(
                                            `/portal/settings/user/${categoryCreateUser.id}`
                                          )
                                        }
                                      >
                                        {" "}
                                        {categoryCreateUser.name}{" "}
                                      </div>
                                    </div>
                                  </MtdUserPopover>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>{getLanguageLabel("updatedBy")}</th>
                              <td>
                                {categoryUpdateUser == undefined ? (
                                  <MtdLoader size="small" />
                                ) : categoryUpdateUser === "-" ? (
                                  categoryUpdateUser
                                ) : (
                                  <MtdUserPopover
                                    id={categoryUpdateUser.id}
                                    record={categoryUpdateUser}
                                  >
                                    <div
                                      style={{
                                        display: "inline-block",
                                      }}
                                      className="pop-over-item"
                                    >
                                      <div
                                        onClick={(e) =>
                                          navigate(
                                            `/portal/settings/user/${categoryUpdateUser.id}`
                                          )
                                        }
                                      >
                                        {" "}
                                        {categoryUpdateUser.name}{" "}
                                      </div>
                                    </div>
                                  </MtdUserPopover>
                                )}
                              </td>
                            </tr>
                          </>
                        )}
                      </table>
                    </div>
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      <MtdButton
                        intent="dangerous"
                        onClick={handleCategoryDeleteOrCancel}
                        icon={
                          selectedCategory === "new" ? (
                            <CrossIcon />
                          ) : (
                            <TrashIcon />
                          )
                        }
                        icononly
                      >
                        {selectedCategory === "new"
                          ? getLanguageLabel("cancel")
                          : getLanguageLabel("delete")}
                      </MtdButton>
                      &nbsp;
                      <MtdButton
                        icon={<SaveIcon />}
                        intent="action"
                        key="submit"
                        onClick={handleCategoryUpdateOrCreate}
                      >
                        {selectedCategory === "new"
                          ? getLanguageLabel("create")
                          : getLanguageLabel("save")}
                      </MtdButton>
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </Sider>
            <Divider
              type="vertical"
              style={{
                backgroundColor: "var(--movetodata-border-color-default)",
                height: "auto",
              }}
            />

            <Table
              onRow={(record, rowIndex) => {
                return {
                  onClick: (event) => {
                    handleTagsClick(record);
                  },
                };
              }}
              columns={columns}
              dataSource={
                filteredData !== undefined
                  ? filteredData
                  : tagsList.slice(0, 100)
              }
              className="interactive tags-table-layout"
              pagination={false}
              scroll={{ y: "48vh" }}
            />

            <Divider
              type="vertical"
              style={{
                backgroundColor: "var(--movetodata-border-color-default)",
                height: "auto",
              }}
            />
            <Sider
              collapsed={!tagSiderVisible}
              className="tags-sider"
              breakpoint="lg"
              collapsedWidth="0"
              onBreakpoint={(broken) => {
                //
              }}
              onCollapse={(collapsed, type) => {
                //
              }}
              width={"20%"}
              style={{
                height: "52vh",

                boxShadow: "none",
                border: "none",
              }}
            >
              <div>
                <Button
                  type="text"
                  size="small"
                  className="interactive"
                  style={{
                    aspectRatio: "1",

                    padding: "1%",
                    margin: "3%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1em",
                  }}
                  onClick={handleClose}
                >
                  <CrossIcon />
                </Button>

                {selectedTag !== undefined ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // justifyContent: 'center',
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedTag === "new" ? (
                      <Space style={{ padding: "2em" }}>
                        <MtdInput
                          onChange={(e) => setTagName(e.target.value)}
                          placeholder={getLanguageLabel("enterTagName")}
                          required
                          style={{
                            fontSize: "large",
                            textAlign: "center",
                            fontWeight: "900",
                          }}
                        />
                      </Space>
                    ) : (
                      <Title
                        editable={{
                          tooltip: getLanguageLabel("editName"),
                          onChange: setTagName,
                          enterIcon: null,
                        }}
                        level={3}
                      >
                        {tagName}
                      </Title>
                    )}
                    <div className="category-summary">
                      <table width="calc(365vw+ 0%)">
                        <tr>
                          <th>{getLanguageLabel("description")}</th>
                          <td>
                            {selectedTag === "new" ? (
                              <MtdInput
                                onChange={(e) =>
                                  setTagDescription(e.target.value)
                                }
                                placeholder={getLanguageLabel(
                                  "enterTagDescription"
                                )}
                                required
                              />
                            ) : (
                              <Text
                                editable={{
                                  tooltip: getLanguageLabel("editDescription"),
                                  onChange: setTagDescription,
                                  enterIcon: null,
                                }}
                              >
                                {tagDescription}
                              </Text>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>{getLanguageLabel("color")}</th>
                          <td>
                            <Dropdown
                              trigger={["click"]}
                              open={colorsDropdownVisible}
                              onOpenChange={setColorsDropdownVisible}
                              menu={{
                                items: colorsDropdown,
                                onClick,
                                selectable: true,
                                defaultSelectedKeys: ["3"],
                              }}
                              dropdownRender={(menu: any) => (
                                <div className="dropdown-content">
                                  {React.cloneElement(
                                    menu as React.ReactElement,
                                    { style: menuStyle }
                                  )}
                                  <Divider style={{ margin: 0 }} />
                                  <Space style={{ padding: 8 }}>
                                    <MtdInput
                                      onChange={(e: any) =>
                                        setCustomTagColor("#" + e.target.value)
                                      }
                                      placeholder="Custom Color HEX"
                                      prefix={"#"}
                                    />
                                  </Space>
                                  <Space style={{ padding: 8 }}>
                                    <Button onClick={handleColorSaveButton}>
                                      <SaveIcon />
                                      {getLanguageLabel("save")}
                                    </Button>
                                  </Space>
                                </div>
                              )}
                              overlayStyle={{}}
                              placement="bottomCenter"
                            >
                              <Button
                                // type='text'
                                className="interactive"
                                style={{
                                  width: "6vw",

                                  padding: "1%",
                                  margin: "3%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1em",
                                }}
                              >
                                <Space style={{ padding: 8 }}>{tagColor}</Space>
                                <SingleChevronDownIcon />
                              </Button>
                            </Dropdown>
                          </td>
                        </tr>
                        {selectedTag === "new" ? (
                          ""
                        ) : (
                          <>
                            <tr>
                              <th>{getLanguageLabel("createdBy")}</th>
                              <td>
                                {tagCreateUser == undefined ? (
                                  <MtdLoader size="small" />
                                ) : tagCreateUser === "-" ? (
                                  tagCreateUser
                                ) : (
                                  <MtdUserPopover
                                    id={tagCreateUser.id}
                                    record={tagCreateUser}
                                  >
                                    <div
                                      style={{
                                        display: "inline-block",
                                      }}
                                      className="pop-over-item"
                                    >
                                      <div
                                        onClick={(e) =>
                                          navigate(
                                            `/portal/settings/user/${tagCreateUser.id}`
                                          )
                                        }
                                      >
                                        {" "}
                                        {tagCreateUser.name}{" "}
                                      </div>
                                    </div>
                                  </MtdUserPopover>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>{getLanguageLabel("updatedBy")}</th>
                              <td>
                                {tagUpdateUser == undefined ? (
                                  <MtdLoader size="small" />
                                ) : tagUpdateUser === "-" ? (
                                  tagUpdateUser
                                ) : (
                                  <MtdUserPopover
                                    id={tagUpdateUser.id}
                                    record={tagUpdateUser}
                                  >
                                    <div
                                      style={{
                                        display: "inline-block",
                                      }}
                                      className="pop-over-item"
                                    >
                                      <div
                                        onClick={(e) =>
                                          navigate(
                                            `/portal/settings/user/${tagUpdateUser.id}`
                                          )
                                        }
                                      >
                                        {" "}
                                        {tagUpdateUser.name}{" "}
                                      </div>
                                    </div>
                                  </MtdUserPopover>
                                )}
                              </td>
                            </tr>
                          </>
                        )}
                      </table>
                    </div>
                    <br />
                    <br />
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      <MtdButton
                        icon={
                          selectedTag === "new" ? <CrossIcon /> : <TrashIcon />
                        }
                        intent="dangerous"
                        onClick={handleTagDeleteOrCancel}
                        icononly
                      >
                        {selectedTag === "new"
                          ? getLanguageLabel("cancel")
                          : getLanguageLabel("delete")}
                      </MtdButton>
                      &nbsp;
                      <MtdButton
                        icon={<SaveIcon />}
                        intent="action"
                        onClick={handleTagUpdateOrCreate}
                      >
                        {selectedTag === "new"
                          ? getLanguageLabel("create")
                          : getLanguageLabel("save")}
                      </MtdButton>
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </Sider>
          </Layout>
        </div>
      )}
    </>
  );
};
export default Tags;

import { Table, Typography } from "antd";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { LinkIcon, SearchIcon } from "../../assets/icons/mtdActionIcons";
import { GroupedColumnIcon } from "../../assets/icons/mtdChartIcons";
import {
  DataAgentsIcon,
  DatabaseIcon,
  ProjectIcon,
} from "../../assets/icons/mtdDataIcons";

import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  getLanguageLabel,
  getTimeDisplay,
  openNotification,
} from "utils/utilities";
import { FolderIcon } from "../../assets/icons/mtdFileIcons";
import {
  HelpIcon,
  MonitorIcon,
  TrashIcon,
} from "../../assets/icons/mtdMiscellaneousIcons";
import { UndoIcon } from "../../assets/icons/mtdNavigationIcon";
import { TableIcon } from "../../assets/icons/mtdTableIcons";
import GlobalSearch from "../../helpers/GlobalSearch";
import {
  listFolderDetails,
  listProjects,
} from "../../redux/actions/projectActions";
import {
  getTrashBinItems,
  permanentDelete,
  restoreFromTrash,
} from "../../redux/actions/trashBinActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const { Title } = Typography;

const TrashBinModal = ({
  id,
  showTrashModal,
  setShowTrashModal,
  trashItemsCount,
  setTrashItemsCount,
}: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();
  const { trashBinItems, loading: trashLoading } = useSelector(
    (state) => (state as any).trashBin
  );

  const [selectedTrashItems, setSelectedTrashItems] = useState(null);

  const { folder, loading } = useSelector(
    (state) => (state as $TSFixMe).folderDetails
  );

  const [title, settitle] = useState({
    name: undefined,
    description: undefined,
    id: "",
  });

  const [FilteredTrashData, setFilteredTrashData] = useState();

  const rowSelection = {
    type: "checkbox",
    onChange: (selectedRowKeys: $TSFixMe) => {
      setSelectedTrashItems(selectedRowKeys);
    },
    getCheckboxProps: (record: $TSFixMe) => ({
      disabled: record.name === "Disabled User",

      // Column configuration not to be checked
      name: record.name,
    }),
  };

  function SelectIcon(props: $TSFixMe) {
    const typeIcon = props.typeIcon || props;

    switch (typeIcon) {
      case "PROJECT":
        return <ProjectIcon size={22} />;

      case "FOLDER":
        return <FolderIcon size={22} />;

      case "DATASET":
        return <TableIcon size={22} />;

      case "repository":
        return <CodeCellIcon size={22} />;

      case "agent":
        return <DatabaseIcon size={22} />;

      case "link":
        return <LinkIcon size={22} />;

      case "source":
        return <DataAgentsIcon size={22} />;

      case "chart":
        return <GroupedColumnIcon size={22} />;

      case "dashboard":
        return <MonitorIcon size={22} />;

      default:
        return <HelpIcon />;
    }
  }

  const trashColumns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      key: "name",
      render: (text: $TSFixMe, record: $TSFixMe) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title
            // onClick={() => handleclick(record)}
            level={5}
            // style={{ color: "#5C7080", cursor: "pointer" }}
          >
            <div className="text-and-icon-center">
              <SelectIcon typeIcon={record.type} /> {text}
            </div>
          </Title>
        </div>
      ),
    },
    // {
    //   title: getLanguageLabel("description"),
    //   dataIndex: "description",
    //   key: "description",
    // },
    {
      title: getLanguageLabel("type"),
      dataIndex: "type",
      key: "type",
    },
    {
      title: getLanguageLabel("lastUpdated"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: "30%",
      render: (text: $TSFixMe) => (text ? getTimeDisplay(text) : "--"),
    },
  ];

  const handleclick = (record: $TSFixMe) => {
    settitle({
      name: record.name,
      description: record.description,
      id: record.id,
    });

    if (record.type === "FOLDER") {
      navigate(`/portal/kitab/${record.type}/${record.id}`);
    } else if (
      record.type === "agent" ||
      record.type === "source" ||
      record.type === "link"
    ) {
      navigate(`/portal/connect/${record.type}/${record.id}`);
    } else if (record.type === "chart" || record.type === "dashboard") {
      navigate(`/portal/kepler/${record.type}/${record.id}`);
    } else {
      navigate(`/portal/kitab/${record.type}/${record.id}/master`);
    }
  };

  useEffect(() => {
    dispatch(getTrashBinItems(id));
  }, [id]);

  useEffect(() => {
    if (trashBinItems != undefined) {
      const newCount =
        trashBinItems && trashBinItems?.length ? trashBinItems?.length : 0;
      setTrashItemsCount(newCount);
    }
  }, [trashBinItems]);

  return (
    <MtdModal
      headingIcon={<TrashIcon color="var(--DANGEROUS_COLOR)" />}
      heading={getLanguageLabel("trashBin")}
      open={showTrashModal}
      onCancel={() => {
        setShowTrashModal(false);
        setSelectedTrashItems(null);
      }}
      footerButtonArea={
        <>
          <MtdButton
            icon={<UndoIcon />}
            intent={selectedTrashItems ? "primary" : "none"}
            disabled={selectedTrashItems ? false : true}
            key="submit"
            loading={loading}
            onClick={() => {
              if (!selectedTrashItems) {
                openNotification(
                  "Please select atleast one item",
                  "You need to select atleast one item",
                  "info"
                );
                return;
              }
              dispatch(restoreFromTrash(selectedTrashItems)).then(() => {
                if (id) {
                  dispatch(listFolderDetails(id));
                } else {
                  dispatch(listProjects());
                }
                dispatch(getTrashBinItems(id));
                setSelectedTrashItems(null);
                setShowTrashModal(false);
              });
            }}
          >
            {getLanguageLabel("restore")}
          </MtdButton>
          <MtdButton
            icon={<TrashIcon />}
            intent={selectedTrashItems ? "dangerous" : "none"}
            disabled={selectedTrashItems ? false : true}
            loading={loading}
            onClick={() => {
              if (!selectedTrashItems) {
                openNotification(
                  "Please select atleast one item",
                  "You need to select atleast one item",
                  "info"
                );
                return;
              }
              dispatch(permanentDelete(selectedTrashItems)).then(() => {
                dispatch(getTrashBinItems(id));
                setSelectedTrashItems(null);
                setShowTrashModal(false);
              });
            }}
          >
            {getLanguageLabel("permanentDelete")}
          </MtdButton>
        </>
      }
    >
      <MtdInput
        placeholder={`${getLanguageLabel("search")} ${
          title.name !== undefined ? title.name + " Trash" : ""
        }`}
        allowClear
        onChange={(e) => {
          setFilteredTrashData(
            GlobalSearch(e.target.value, trashBinItems, trashColumns)
          );
        }}
        suffix={<SearchIcon />}
      />
      <Table
        style={{ width: "100%", margin: "auto" }}
        columns={trashColumns}
        dataSource={
          FilteredTrashData !== undefined ? FilteredTrashData : trashBinItems
        }
        loading={trashLoading}
        pagination={false}
        // @ts-expect-error TS(2322): Type '{ type: string; onChange: (selectedRowKeys: ... Remove this comment to see the full error message
        rowSelection={rowSelection}
      />
    </MtdModal>
  );
};

export default TrashBinModal;

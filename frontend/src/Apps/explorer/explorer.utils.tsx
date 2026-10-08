import { SourceTypeEnum } from "Apps/Connect/Enums/SourceTypeEnum";
import { IDatasetMetaData } from "Apps/Dataset/DatasetDetail";
import { LinkIcon, SparklesIcon } from "assets/icons/boslerActionIcons";
import {
  ChartIcon,
  GaugeIcon,
  GroupedColumnIcon,
  LineChartIcon,
  MapIcon,
  PieChartIcon,
  RadarIcon,
  ScatterIcon,
  SmallAreaChartIcon,
  StackedGroupedBarIcon,
  SunburstIcon,
  TreeMapIcon,
  WaterFallIcon,
  WordCloudIcon,
} from "assets/icons/boslerChartIcons";
import {
  BigNumberIcon,
  BooleanIcon,
  DataAgentsIcon,
  DatabaseIcon,
  NumberIcon,
  ProjectIcon,
  StringIcon,
} from "assets/icons/boslerDataIcons";
import { CodeCellIcon, TextIcon } from "assets/icons/boslerEditorIcons";
import {
  JupyterIcon,
  MSSQLIcon,
  MariaDBIcon,
  MarkDownIcon,
  MySQLIcon,
  PostgresIcon,
  PySparkIcon,
  PythonIcon,
  SnowflakeIcon,
  SparkSQLIcon,
} from "assets/icons/boslerExternalIcons";
import {
  DocsIcon,
  FolderIcon,
  FolderOpen2Icon,
} from "assets/icons/boslerFileIcons";
import { CalendarIcon, MapLegendIcon } from "assets/icons/boslerInterfaceIcons";
import { HelpIcon, MonitorIcon } from "assets/icons/boslerMiscellaneousIcons";
import { TableCellIcon, TableIcon } from "assets/icons/boslerTableIcons";
import { CONNECT } from "components/Builds/Builds.constants";
import React from "react";
import { isDefined, notEmpty } from "utils/utilities";

export enum ResourceTypeEnum {
  FILE = "FILE",
  FOLDER = "FOLDER",
  CHART = "CHART",
  PROJECT = "PROJECT",
  REPOSITORY = "REPOSITORY",
  DASHBOARD = "DASHBOARD",
  AGENT = "AGENT",
  SOURCE = "SOURCE",
  POSTGRESSOURCE = "POSTGRESSOURCE",
  MARIASOURCE = "MARIASOURCE",
  MYSQLSERVERSOURCE = "MYSQLSERVERSOURCE",
  ORACLE21SOURCE = "ORACLE21SOURCE",
  MYSQLSOURCE = "MYSQLSOURCE",
  SNOWFLAKESOURCE = "SNOWFLAKESOURCE",
  FILESYSTEMSOURCE = "FILESYSTEMSOURCE",
  LINK = "LINK",
  DATASET = "DATASET",
  CONNECT = "CONNECT",
}

export enum ResourceSubTypeEnum {
  TEXT = "Text",
  GITIGNORE = "GITIGNORE",
  RAWDATASET = "RAWDATASET",
  LIVEDATASET = "LIVEDATASET",
  BUILDDATASET = "BUILDDATASET",

  PARQUET = "PARQUET",
  CSV = "CSV",
  XLS = "XLS",

  JDBC = "JDBC",

  LIVELINK = "LIVELINK",
  STORELINK = "STORELINK",
  // CONNECT
  SCHEMAFOLDER = "SCHEMAFOLDER",
  COLUMN = "COLUMN",
  // POSTGRES
  POSTGRES_SCHEMAFOLDER = "POSTGRES_SCHEMAFOLDER",
  // Types
  POSTGRES_VARCHAR = "POSTGRES_VARCHAR",
  POSTGRES_DECIMAL = "POSTGRES_DECIMAL",
  POSTGRES_INT = "POSTGRES_INT",
  POSTGRES_LONG = "POSTGRES_LONG",
  POSTGRES_BOOLEAN = "POSTGRES_BOOLEAN",
  POSTGRES_CHAR = "POSTGRES_CHAR",
  POSTGRES_TIMESTAMP = "POSTGRES_TIMESTAMP",
  POSTGRES_TEXT = "POSTGRES_TEXT",
  POSTGRES_UUID = "POSTGRES_UUID",

  // Charts
  PIE_CHART = "PIECHART",
  BIG_NUMBER_CHART = "BIGNUMBER",
  MAP_CHART = "MAPCHART",
  RADAR_CHART = "RADARCHART",
  GAUGE_CHART = "GAUGECHART",
  SUNBURST_CHART = "SUNBURSTCHART",
  TABLE_CHART = "TABLE",
  VERTICAL_AXIS_CHART = "VERTICALAXISCHART",
  HORIZONTAL_CHART = "HORIZONTALBARCHART",
  LINE_CHART = "LINECHART",
  BAR_CHART = "BARCHART",
  SCATTER_CHART = "SCATTERCHART",
  LINE_AREA_CHART = "LINEAREACHART",
  PARAMETERCHART = "PARAMETERCHART",
  WATERFALLCHART = "WATERFALLCHART",
  TREEMAPCHART = "TREEMAPCHART",
  WORDCLOUDCHART = "WORDCLOUDCHART",

  // Repository
  PYTHON = "PYTHON",
  SQL = "SQL",

  PY = "PY",
  MARKDOWN = "MD",
  IPYNB = "IPYNB",
  FILE = "FILE",

  NONE = "NONE",
}

export type ResourceType = keyof typeof ResourceTypeEnum;
export type ResourceSubType = keyof typeof ResourceSubTypeEnum;

export const treeNodeComparator = (a: any, b: any) => {
  if (
    (a.type === ResourceTypeEnum.FOLDER) !==
    (b.type === ResourceTypeEnum.FOLDER)
  ) {
    if (a.type === ResourceTypeEnum.FOLDER) return -1;
    if (b.type === ResourceTypeEnum.FOLDER) return 1;
  } else {
    let x = a.name;
    let y = b.name;

    return x.localeCompare(y);
  }
  return 0;
};

export const globalComparator = (a: any, b: any) => {
  if (a === b) {
    return -1;
  }

  // Handle null and undefined cases
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }

  // Convert both values to strings for consistent comparison
  const aString = String(a);
  const bString = String(b);

  // Use localeCompare for string comparison
  if (typeof a === "string" || typeof b === "string") {
    return aString.localeCompare(bString);
  }

  // Use numeric comparison for numbers
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  // Fallback to default comparison for other types
  return a > b ? 1 : -1;
};

export const buildFileIndex = async (treeData: any) => {
  const index = {};

  fileIndexHelper(treeData, index);

  return index;
};
export const fileIndexHelper = async (node: any, index: any) => {
  index[node.id] = node;
  node?.children?.forEach((child: any) => {
    fileIndexHelper(child, index);
  });
};

export const buildParentIndex = async (treeData: any) => {
  let index: { [key: string]: any } = {};

  parentIndexHelper(treeData, treeData.children, index);

  return index;
};

export const parentIndexHelper = async (
  node: any,
  children: any[],
  index: any
) => {
  children?.forEach((child) => {
    index[child.id] = node;

    const trimmedChild = { ...child, children: null, parent: null };
    parentIndexHelper(trimmedChild, child.children, index);
  });
};

export const hareAndTortoisePath = (
  tortoise: any,
  hare: any,
  indexes: { [key: string]: any }
): boolean => {
  return false;
  // if (!isDefined(hare) || !isDefined(tortoise)) return false;
  // if (tortoise === hare && isDefined(tortoise)) return true;

  // if (isDefined(hare) && isDefined(tortoise))
  //   return hareAndTortoisePath(
  //     indexes[tortoise?.id],
  //     [indexes[hare?.id]?.id],
  //     indexes
  //   );

  // return false;
};

export const formatDateAgo = (date: Date) => {
  const currentDate = new Date();
  const timeDifference = currentDate.valueOf() - date.valueOf();

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  if (weeks >= 4) {
    return formattedDate;
  } else if (weeks >= 2) {
    return `${weeks} weeks ago`;
  } else if (weeks === 1) {
    return `one weeks ago`;
  } else if (days >= 2) {
    return `${days} days ago`;
  } else if (days === 1) {
    return "one day ago";
  } else if (hours >= 2) {
    return `${hours} hours ago`;
  } else if (hours === 1) {
    return "an hour ago";
  } else if (minutes >= 2) {
    return `${minutes} minutes ago`;
  } else if (minutes === 1) {
    return "a minute ago";
  } else if (seconds >= 2) {
    return `${seconds} seconds ago`;
  } else {
    return "just now";
  }
};

export const getNodeFavIcon = (type: string, subType: string) => {
  if (isDefined(subType)) {
    switch (subType) {
      case ResourceSubTypeEnum.TEXT:
        return "/favicons/dataset/parquetIcon.svg";
      case ResourceSubTypeEnum.CSV:
      case ResourceSubTypeEnum.XLS:
      case ResourceSubTypeEnum.JDBC:
        return "/favicons/dataset/rawIcon.svg";

      // Charts
      case ResourceSubTypeEnum.PIE_CHART:
        return "/favicons/kepler/pieIcon.svg";
      case ResourceSubTypeEnum.BIG_NUMBER_CHART:
        return "/favicons/kepler/bignumberIcon.svg";
      case ResourceSubTypeEnum.MAP_CHART:
        return "/favicons/kepler/mapIcon.svg";
      case ResourceSubTypeEnum.GAUGE_CHART:
        return "/favicons/kepler/gaugeIcon.svg";
      case ResourceSubTypeEnum.RADAR_CHART:
        return "/favicons/kepler/radarIcon.svg";
      case ResourceSubTypeEnum.SUNBURST_CHART:
        return "/favicons/kepler/sunburstIcon.svg";
      case ResourceSubTypeEnum.TABLE_CHART:
        return "/favicons/kepler/tableIcon.svg";
      case ResourceSubTypeEnum.LINE_CHART:
        return "/favicons/kepler/lineIcon.svg";
      case ResourceSubTypeEnum.BAR_CHART:
        return "/favicons/kepler/barIcon.svg";
      case ResourceSubTypeEnum.LINE_AREA_CHART:
        return "/favicons/kepler/lineAreaIcon.svg";
      case ResourceSubTypeEnum.SCATTER_CHART:
        return "/favicons/kepler/scatterIcon.svg";
      case ResourceSubTypeEnum.VERTICAL_AXIS_CHART:
        return "/favicons/kepler/barIcon.svg";
      case ResourceSubTypeEnum.HORIZONTAL_CHART:
        return "/favicons/kepler/horizontalIcon.svg";
      case ResourceSubTypeEnum.WATERFALLCHART:
        return "/favicons/kepler/waterfallIcon.svg";
      case ResourceSubTypeEnum.TREEMAPCHART:
        return "/favicons/kepler/treeMapIcon.svg";
      case ResourceSubTypeEnum.PARAMETERCHART:
        return "/favicons/kepler/parameterIcon.svg";
      case ResourceSubTypeEnum.WORDCLOUDCHART:
        return "/favicons/kepler/wordCloudIcon.svg";
      // FILES
      case ResourceSubTypeEnum.GITIGNORE:
        return "/favicons/explorer/folderIcon.svg";
      case ResourceSubTypeEnum.PYTHON:
        return "/favicons/repository/pySparkIcon.svg";
      case ResourceSubTypeEnum.SQL:
        return "/favicons/repository/sparkSqlIcon.svg";
      case ResourceSubTypeEnum.PY:
        return "/favicons/repository/pySparkIcon.svg";
      case ResourceSubTypeEnum.IPYNB:
        return "/favicons/explorer/folderIcon.svg";
      case ResourceSubTypeEnum.FILE:
        return "/favicons/explorer/folderIcon.svg";
      case ResourceSubTypeEnum.MARKDOWN:
        return "/favicons/explorer/folderIcon.svg";
      case ResourceSubTypeEnum.RAWDATASET:
        return "/favicons/dataset/rawIcon.svg";
      case ResourceSubTypeEnum.BUILDDATASET:
        return "/favicons/dataset/parquetIcon.svg";
    }
  }

  switch (type) {
    case ResourceTypeEnum.AGENT:
      return "/favicons/folderIcon.svg";
    case ResourceTypeEnum.FILE:
      return "/favicons/explorer/folderIcon.svg";
    case ResourceTypeEnum.FOLDER:
      return "/favicons/explorer/folderIcon.svg";
    case ResourceTypeEnum.CHART:
      return "/favicons/kepler/barIcon.svg";
    case ResourceTypeEnum.PROJECT:
      return "/favicons/explorer/projectIcon.svg";
    case ResourceTypeEnum.REPOSITORY:
      switch (subType) {
        case ResourceSubTypeEnum.PYTHON:
          return "/favicons/repository/pySparkIcon.svg";
        case ResourceSubTypeEnum.SQL:
          return "/favicons/repository/sparkSqlIcon.svg";
        default:
          return "/favicons/repository/codeRepositoryIcon.svg";
      }

    case ResourceTypeEnum.DASHBOARD:
      return "/favicons/kepler/dashboardIcon.svg";
    case ResourceTypeEnum.SOURCE:
      return "/favicons/connect/dataSourceIcon.svg";
    case ResourceTypeEnum.LINK:
      switch (subType) {
        case ResourceSubTypeEnum.LIVELINK:
          return "/favicons/connect/dataLiveLinkIcon.svg";
        default:
          return "/favicons/connect/dataLinkIcon.svg";
      }
    case ResourceTypeEnum.DATASET:
      switch (subType) {
        case ResourceSubTypeEnum.LIVEDATASET:
          return "/favicons/dataset/liveIcon.svg";
        default:
          return "/favicons/dataset/emptyIcon.svg";
      }
    default:
      return "/favicons/boslerLogo.svg";
  }
};

const getPostgresDataTypeIcon = (dataType: string) => {
  if (!dataType) return null;
  switch (dataType.toLowerCase()) {
    case "boolean":
      return <BooleanIcon />;

    // Numeric types
    case "smallint":
    case "integer":
    case "bigint":
    case "decimal":
    case "numeric":
    case "real":
    case "double precision":
    case "smallserial":
    case "serial":
    case "bigserial":
      return <NumberIcon />;

    // String types
    case "character varying":
    case "varchar":
    case "character":
    case "char":
    case "text":
    case "citext":
      return <StringIcon />;

    // Date/Time types
    case "date":
    case "timestamp":
    case "timestamp without time zone":
    case "timestamp with time zone":
    case "time":
    case "time without time zone":
    case "time with time zone":
    case "interval":
      return <CalendarIcon />;

    // UUID type
    case "uuid":
      return <div className="movetodata-icons">ID</div>;

    // JSON types
    case "json":
    case "jsonb":
      return <StringIcon />;

    // Binary types
    case "bytea":
      return <StringIcon />;

    // Geometric types
    case "point":
    case "line":
    case "lseg":
    case "box":
    case "path":
    case "polygon":
    case "circle":
      return <StringIcon />;

    // Network address types
    case "cidr":
    case "inet":
    case "macaddr":
      return <StringIcon />;

    // Monetary types
    case "money":
      return <NumberIcon />;

    // Range types
    case "int4range":
    case "int8range":
    case "numrange":
    case "tsrange":
    case "tstzrange":
    case "daterange":
      return <StringIcon />;

    // Full-text search types
    case "tsvector":
    case "tsquery":
      return <StringIcon />;

    // Array types
    case "array":
      return <StringIcon />;

    // Composite types
    case "composite":
      return <StringIcon />;

    // Default icon
    default:
      return <StringIcon />;
  }
};

const getOracleDBDataTypeIcon = (dataType: string) => {
  if (!dataType) return null;
  switch (dataType.toLowerCase()) {
    case "number":
    case "binary_float":
    case "binary_double":
      return <NumberIcon />;

    case "char":
    case "varchar2":
    case "nvarchar2":
    case "clob":
    case "nclob":
    case "long":
    case "raw":
    case "long raw":
      return <StringIcon />;

    case "date":
    case "timestamp":
    case "timestamp with time zone":
    case "timestamp with local time zone":
    case "interval year to month":
    case "interval day to second":
      return <CalendarIcon />;

    case "binary_integer":
    case "pls_integer":
      return <NumberIcon />;

    case "boolean":
      return <BooleanIcon />;

    case "urowid":
    case "rowid":
    case "uuid":
      return <div className="movetodata-icons">ID</div>;

    default:
      return <StringIcon />;
  }
};

const getSQLServerDataTypeIcon = (dataType: string) => {
  if (!dataType) return null;
  switch (dataType.toLowerCase()) {
    case "bit":
      return <BooleanIcon />;

    case "tinyint":
    case "smallint":
    case "int":
    case "bigint":
    case "decimal":
    case "numeric":
    case "real":
    case "float":
      return <NumberIcon />;

    case "char":
    case "varchar":
    case "text":
    case "nchar":
    case "nvarchar":
    case "ntext":
    case "binary":
    case "varbinary":
    case "image":
      return <StringIcon />;

    case "date":
    case "datetime":
    case "datetime2":
    case "smalldatetime":
    case "time":
    case "datetimeoffset":
      return <CalendarIcon />;

    case "uniqueidentifier":
      return <div className="movetodata-icons">ID</div>;

    default:
      return <StringIcon />;
  }
};

const getMariaDBMySQLDataTypeIcon = (dataType: string) => {
  if (!dataType) return null;
  switch (dataType.toLowerCase()) {
    case "tinyint":
    case "smallint":
    case "mediumint":
    case "int":
    case "integer":
    case "bigint":
    case "decimal":
    case "dec":
    case "numeric":
    case "fixed":
    case "float":
    case "double":
    case "double precision":
      return <NumberIcon />;

    case "char":
    case "varchar":
    case "binary":
    case "varbinary":
    case "tinyblob":
    case "blob":
    case "mediumblob":
    case "longblob":
    case "tinytext":
    case "text":
    case "mediumtext":
    case "longtext":
    case "enum":
    case "set":
      return <StringIcon />;

    case "date":
    case "datetime":
    case "timestamp":
    case "time":
    case "year":
      return <CalendarIcon />;

    case "bit":
    case "boolean":
    case "bool":
      return <BooleanIcon />;

    case "uuid":
      return <div className="movetodata-icons">ID</div>;

    default:
      return <StringIcon />;
  }
};

export const getDatabaseColumnIcon = (
  database: ResourceTypeEnum | SourceTypeEnum,
  column: string
) => {
  if (
    database == ResourceTypeEnum.POSTGRESSOURCE ||
    database == SourceTypeEnum.POSTGRES
  ) {
    return getPostgresDataTypeIcon(column);
  } else if (
    database == ResourceTypeEnum.MARIASOURCE ||
    database == SourceTypeEnum.MARIADB
  ) {
    return getMariaDBMySQLDataTypeIcon(column);
  } else if (
    database == ResourceTypeEnum.MYSQLSERVERSOURCE ||
    database == SourceTypeEnum.MSSQLSERVER
  ) {
    return getSQLServerDataTypeIcon(column);
  } else if (
    database == ResourceTypeEnum.ORACLE21SOURCE ||
    database == SourceTypeEnum.ORACLE21
  ) {
    return getOracleDBDataTypeIcon(column);
  } else {
    return getPostgresDataTypeIcon(column);
  }
};

export const getNodeIcon = (
  type: string,
  subType: string,
  isOpen = false,
  size = 16,
  metaData: IDatasetMetaData | null = null
) => {
  if (isDefined(subType)) {
    switch (subType) {
      case ResourceSubTypeEnum.TEXT:
        return <TextIcon size={size} />;
      case ResourceSubTypeEnum.CSV:
      case ResourceSubTypeEnum.XLS:
      case ResourceSubTypeEnum.JDBC:
        return <TableIcon size={size} />;

      // Charts
      case ResourceSubTypeEnum.PIE_CHART:
        return <PieChartIcon size={size} />;
      case ResourceSubTypeEnum.PARAMETERCHART:
        return <MapLegendIcon size={size} />;
      case ResourceSubTypeEnum.BIG_NUMBER_CHART:
        return <BigNumberIcon size={size} />;
      case ResourceSubTypeEnum.MAP_CHART:
        return <MapIcon size={size} />;
      case ResourceSubTypeEnum.GAUGE_CHART:
        return <GaugeIcon size={size} />;
      case ResourceSubTypeEnum.RADAR_CHART:
        return <RadarIcon size={size} />;
      case ResourceSubTypeEnum.SUNBURST_CHART:
        return <SunburstIcon size={size} />;
      case ResourceSubTypeEnum.TABLE_CHART:
        return <TableCellIcon size={size} />;
      case ResourceSubTypeEnum.LINE_CHART:
        return <LineChartIcon size={size} />;
      case ResourceSubTypeEnum.BAR_CHART:
        return <GroupedColumnIcon size={size} />;
      case ResourceSubTypeEnum.LINE_AREA_CHART:
        return <SmallAreaChartIcon size={size} />;
      case ResourceSubTypeEnum.SCATTER_CHART:
        return <ScatterIcon size={size} />;
      case ResourceSubTypeEnum.VERTICAL_AXIS_CHART:
        return <GroupedColumnIcon size={size} />;
      case ResourceSubTypeEnum.HORIZONTAL_CHART:
        return <StackedGroupedBarIcon size={size} />;
      case ResourceSubTypeEnum.WATERFALLCHART:
        return <WaterFallIcon size={size} />;
      case ResourceSubTypeEnum.TREEMAPCHART:
        return <TreeMapIcon size={size} />;
      case ResourceSubTypeEnum.WORDCLOUDCHART:
        return <WordCloudIcon size={size} />;

      // FILES
      case ResourceSubTypeEnum.GITIGNORE:
        return <CodeCellIcon size={size} />;
      case ResourceSubTypeEnum.PYTHON:
        return <PySparkIcon size={size} />;
      case ResourceSubTypeEnum.SQL:
        return <SparkSQLIcon size={size} />;
      case ResourceSubTypeEnum.PY:
        return <PythonIcon size={size} />;
      case ResourceSubTypeEnum.IPYNB:
        return <JupyterIcon size={size} />;
      case ResourceSubTypeEnum.FILE:
        return <DocsIcon size={size} />;
      case ResourceSubTypeEnum.MARKDOWN:
        return <MarkDownIcon size={size} />;
      case ResourceSubTypeEnum.RAWDATASET:
        return <TableIcon size={size} />;
      case ResourceSubTypeEnum.BUILDDATASET:
        if ((metaData as any)?.buildTrigger == CONNECT) {
          return <TableIcon color="orange" size={size} />;
        }
        return <TableIcon color="#4C90F0" size={size} />;

      // POSTGRES
      case ResourceSubTypeEnum.POSTGRES_BOOLEAN:
        return <BooleanIcon />;
      case ResourceSubTypeEnum.POSTGRES_DECIMAL:
        return <NumberIcon />;
      case ResourceSubTypeEnum.POSTGRES_INT:
        return <NumberIcon />;
      case ResourceSubTypeEnum.POSTGRES_TEXT:
        return <StringIcon />;
      case ResourceSubTypeEnum.POSTGRES_VARCHAR:
        return <StringIcon />;
      case ResourceSubTypeEnum.POSTGRES_UUID:
        return <div className="movetodata-icons">ID</div>;
      case ResourceSubTypeEnum.POSTGRES_TIMESTAMP:
        return <CalendarIcon />;

      // CONNECT
      case ResourceSubTypeEnum.SCHEMAFOLDER:
        return isOpen ? (
          <FolderOpen2Icon size={size} />
        ) : (
          <FolderIcon size={size} />
        );
    }
  }

  switch (type) {
    case ResourceTypeEnum.AGENT:
      return <DataAgentsIcon size={size} />;
    case ResourceTypeEnum.FILE:
      return <DocsIcon size={size} />;
    case ResourceTypeEnum.FOLDER:
      return isOpen ? (
        <FolderOpen2Icon size={size} />
      ) : (
        <FolderIcon size={size} />
      );
    case ResourceTypeEnum.CHART:
      return <ChartIcon size={size} />;
    case ResourceTypeEnum.PROJECT:
      return <ProjectIcon size={size} />;
    case ResourceTypeEnum.REPOSITORY:
      return <></>;
    case ResourceTypeEnum.DASHBOARD:
      return <MonitorIcon size={size} />;
    case ResourceTypeEnum.SOURCE:
      return <DatabaseIcon size={size} />;
    case ResourceTypeEnum.POSTGRESSOURCE:
      return <PostgresIcon size={size} />;

    case ResourceTypeEnum.MARIASOURCE:
      return <MariaDBIcon size={size} />;

    case ResourceTypeEnum.MYSQLSERVERSOURCE:
      return <MSSQLIcon size={size} />;
    case ResourceTypeEnum.MYSQLSOURCE:
      return <MySQLIcon size={size} />;

    case ResourceTypeEnum.SNOWFLAKESOURCE:
      return <SnowflakeIcon size={size} />;

    case ResourceTypeEnum.FILESYSTEMSOURCE:
      return <FolderIcon size={size} />;

    case ResourceTypeEnum.LINK:
      switch (subType) {
        case ResourceSubTypeEnum.LIVELINK:
          return <LinkIcon color={"var(--movetodata-intent-danger)"} size={size} />;
        default:
          return <LinkIcon color={"var(--ACTION_COLOR)"} size={size} />;
      }
    case ResourceTypeEnum.DATASET:
      switch (subType) {
        case ResourceSubTypeEnum.LIVEDATASET:
          return (
            <TableIcon color={"var(--movetodata-intent-danger)"} size={size} />
          );
        default:
          return <TableIcon color={"lightgrey"} size={size} />;
      }
    default:
      return <HelpIcon size={size} />;
  }
};

export const getSparkles = (mS: number) => {
  if (notEmpty(mS)) {
    const currentDate = new Date();
    const timeDifference = currentDate.valueOf() - mS;

    // 45mins
    if (timeDifference < 2700000)
      return <SparklesIcon color={"#0078D4"} size={12} />;
  }

  return <></>;
};

export function objectToQueryParamString(obj: {
  [key: string]: string | number;
}) {
  const queryParams = [];

  // Iterate over each key-value pair in the object
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      // Encode the key and value and append them to the array
      queryParams.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    }
  }

  // Join the array elements with '&' to create the query parameter string
  return queryParams.join("&");
}

export function fillUrlTemplate(
  template: string,
  params: { [key: string]: string | number },
  defaultParams: { [key: string]: string | number }
) {
  // Replace each placeholder in the template with its corresponding value from params
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const regex = new RegExp("{" + key + "}", "g");
      template = template.replace(regex, `${params[key]}`);
    }
  }
  for (const key in defaultParams) {
    if (defaultParams.hasOwnProperty(key)) {
      const regex = new RegExp("{" + key + "}", "g");
      template = template.replace(regex, `${defaultParams[key]}`);
    }
  }
  return template;
}

export function createReverseMap(gitStatus: any) {
  const reverseMap: { [key: string]: string } = {};

  if (isDefined(gitStatus)) {
    for (const [status, files] of Object.entries(gitStatus)) {
      if (Array.isArray(files)) {
        files.forEach((file) => {
          reverseMap[file] = status;
        });
      }
    }
  }

  return reverseMap;
}

export function getMatchingKey(obj: { [key: string]: any }, regex: any) {
  return Object.keys(obj).find((key) => regex.test(key)) || null;
}

export function createRegex(startsWith: string) {
  const escapedString = startsWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedString}.*$`);
}

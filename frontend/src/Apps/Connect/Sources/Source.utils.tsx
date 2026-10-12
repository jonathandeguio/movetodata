import { ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import PreviewLink from "../Links/bottomBar/PreviewLink";

import { AutoModeIcon } from "assets/icons/mtdActionIcons";
import { isDefined } from "utils/utilities";
import { SourceAuthTypeEnum } from "../Enums/SourceAuthTypeEnum";
import { SourceTypeEnum } from "../Enums/SourceTypeEnum";
import { ISourceConfig } from "./Source";

export const isSourceConfigValid = (source: ISourceConfig) => {
  if (source.type == "jdbc") {
    // ODBC Bridge: requires name, parent, and at minimum a DSN name (server field)
    // or a full connection string (database field). Credentials are optional for some ODBC sources.
    if (source.dbmsType === SourceTypeEnum.ODBC) {
      return (
        source.name &&
        source.parent &&
        (source.server || source.database)
      );
    }
    // Databricks: host + httpPath (stored in schema) + PAT (stored in password). No port or username required.
    if (source.dbmsType === SourceTypeEnum.DATABRICKS) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.schema &&
        source.password
      );
    }
    // MongoDB: host + port + database are mandatory. Username/password are optional (some instances use no auth).
    if (source.dbmsType === SourceTypeEnum.MONGODB) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.port &&
        source.database
      );
    }
    // Trino / Starburst: host + port + catalog (database) + username required. Password is optional.
    if (
      source.dbmsType === SourceTypeEnum.TRINO ||
      source.dbmsType === SourceTypeEnum.STARBURST
    ) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.port &&
        source.database &&
        source.username
      );
    }
    // Redshift, Vertica, SparkSQL external: standard JDBC — all fields required.
    if (
      source.dbmsType === SourceTypeEnum.REDSHIFT ||
      source.dbmsType === SourceTypeEnum.VERTICA ||
      source.dbmsType === SourceTypeEnum.SPARKSQL_EXTERNAL
    ) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.port &&
        source.database &&
        source.username &&
        source.password
      );
    }
    // SQLite / DuckDB: file-based — only the file path (server field) is required. No credentials.
    if (
      source.dbmsType === SourceTypeEnum.SQLITE ||
      source.dbmsType === SourceTypeEnum.DUCKDB
    ) {
      return source.name && source.parent && source.server;
    }
    // Amazon Athena: region (schema) + S3 bucket (database) + access key (username) + secret key (password).
    // No host or port required.
    if (source.dbmsType === SourceTypeEnum.ATHENA) {
      return (
        source.name &&
        source.parent &&
        source.schema &&
        source.database &&
        source.username &&
        source.password
      );
    }
    // IBM DB2, SAP HANA, AlloyDB: standard JDBC — server, port, database, username, password required.
    if (
      source.dbmsType === SourceTypeEnum.DB2 ||
      source.dbmsType === SourceTypeEnum.SAPHANA ||
      source.dbmsType === SourceTypeEnum.ALLOYDB
    ) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.port &&
        source.database &&
        source.username &&
        source.password
      );
    }
    // Google BigQuery: project ID (server) + service account JSON key (token).
    if (source.dbmsType === SourceTypeEnum.BIGQUERY) {
      return (
        source.name &&
        source.parent &&
        source.server &&
        source.token
      );
    }
    if (source.authType == SourceAuthTypeEnum.KEYPAIR) {
      return (
        source.name &&
        source.parent &&
        source.warehouse &&
        source.username &&
        source.privateKey &&
        source.server &&
        source.port &&
        source.database
      );
    } else {
      return (
        source.name &&
        source.parent &&
        source.username &&
        source.password &&
        source.server &&
        source.port &&
        source.database
      );
    }
  } else if (source.type === "FOLDER") {
    return isDefined(source.path);
  } else if (source.type === "rest") {
    return isDefined(source.url) && isDefined(source.method);
  } else if (source.type === "s3") {
    return (
      source.name &&
      source.parent &&
      source.database &&  // bucket
      source.schema &&    // region
      source.username &&  // access key ID
      source.password     // secret key
    );
  } else if (source.type === "salesforce") {
    return (
      source.name &&
      source.parent &&
      source.username &&
      source.password &&
      source.token
    );
  }
};

export const getSourceBottombarItems = (
  source: any
): IMtdBottomBarItem[] => {
  return [
    {
      id: "datasetBuildLogPanel",
      icon: <ComponentIcon />,
      label: getLanguageLabel("buildLog"),
      body: BuildDetailsTable,
      type: "TAB",
      props: {
        showHeader: false,
        page: "SOURCE",
        showEmpty: true,
        data: [],
      },
    },
    ...(source.type == "jdbc" && source.directLoad
      ? [
          {
            id: "datasetPreviewPanel",
            icon: <AutoModeIcon />,
            label: getLanguageLabel("preview"),
            body: PreviewLink,
            type: "TAB",
            props: {
              id: source.id,
              showHeader: false,
            },
          },
        ]
      : ([] as any)),
  ];
};

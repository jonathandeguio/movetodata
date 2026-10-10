import { Col, Divider, Progress, Row, Typography } from "antd";
import { HistoricalRunsIcon } from "assets/icons/mtdActionIcons";
import MtdLoader from "components/mtdLoader";
import { MtdTag } from "components/Tag/Tag";
import React, { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { getLanguageLabel, TimeCounter } from "utils/utilities";
import styles from "./DatasetColumnStats.module.scss";

const { Title, Text } = Typography;

const DatasetColumnStats = (props: $TSFixMe) => {
  const { counts, lengths, distribution } = !props.info.loading
    ? props.info.data
    : { counts: "", lengths: "", distribution: "" };

  return (
    <PanelGroup direction="horizontal" className={styles.container}>
      <Panel>
        <Row className="--m15" justify="space-between" align={"middle"}>
          <Col>
            <Text strong>{getLanguageLabel("counts")}</Text>
          </Col>
        </Row>
        <Divider className={styles.zeroMarginDivider} />
        <div className={styles.columns}>
          {!props.info.loading ? (
            props.info.error ? (
              <>{props.info.error}</>
            ) : (
              <>
                {Object.keys(counts).map((key: $TSFixMe, index: $TSFixMe) => {
                  return (
                    <div className="distribution">
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexFlow: "row wrap",
                          justifyContent: "space-between",
                          paddingRight: "2%",
                        }}
                      >
                        <div>{key}</div>
                        <div>{Object.values(counts)[index] as ReactNode}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : (
            <MtdLoader />
          )}
        </div>
      </Panel>
      <PanelResizeHandle className="resizablePane-collapser" />

      <Panel>
        <Row className="--m15" justify="space-between" align={"middle"}>
          <Col>
            <Text strong>{getLanguageLabel("distribution")}</Text>
          </Col>
        </Row>
        <Divider className={styles.zeroMarginDivider} />
        <div className={styles.columns}>
          {!props.info.loading ? (
            props.info.error ? (
              <>{props.info.error}</>
            ) : (
              <>
                {distribution.map((val: $TSFixMe) => {
                  return (
                    <>
                      <div className="distribution">
                        <div
                          style={{
                            width: "50%",
                            display: "flex",
                            flexFlow: "row wrap",
                            justifyContent: "space-between",
                            paddingRight: "2%",
                          }}
                        >
                          <div>{val.name}</div>
                          <div>{val.count}</div>
                        </div>
                        <Progress
                          strokeLinecap="butt"
                          percent={val.percentage}
                          showInfo={false}
                          style={{ width: "50%" }}
                        />
                      </div>
                    </>
                  );
                })}
              </>
            )
          ) : (
            <MtdLoader />
          )}
        </div>
      </Panel>

      <PanelResizeHandle className="resizablePane-collapser" />

      <Panel>
        <Row className={styles.timeCounterColumnHeader} justify="space-between">
          <Col>
            <Text strong>{getLanguageLabel("length")}</Text>
          </Col>
          <Col>
            <MtdTag
              color={props.info.loading ? "var(--movetodata-intent-danger)" : ""}
              icon={
                <HistoricalRunsIcon
                  size={11}
                  color={props.info.loading ? "#fff" : ""}
                />
              }
            >
              <TimeCounter nudge={props.info.loading ? "start" : "stop"} />
            </MtdTag>
          </Col>
        </Row>
        <Divider className={styles.zeroMarginDivider} />
        <div className={styles.columns}>
          {!props.info.loading ? (
            props.info.error ? (
              <>{props.info.error}</>
            ) : (
              lengths.map((len: $TSFixMe) => {
                return (
                  <>
                    <div className="distribution">
                      <div
                        style={{
                          width: "30%",
                          display: "flex",
                          flexFlow: "row wrap",
                          justifyContent: "space-between",
                          paddingRight: "2%",
                        }}
                      >
                        <div>{len.name}</div>
                        <div>{len.value}</div>
                      </div>
                      <Progress
                        strokeLinecap="butt"
                        percent={len.percentage}
                        showInfo={false}
                        style={{ width: "70%" }}
                      />
                    </div>
                  </>
                );
              })
            )
          ) : (
            <MtdLoader />
          )}
        </div>
      </Panel>
      <PanelResizeHandle className="resizablePane-collapser" />
    </PanelGroup>
  );
};

export default DatasetColumnStats;

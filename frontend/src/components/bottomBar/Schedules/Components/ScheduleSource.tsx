import { Select } from "antd";
import { ScheduledRunIcon } from "assets/icons/mtdInterfaceIcons";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AddIcon, CrossIcon } from "../../../../assets/icons/mtdActionIcons";
import { TableIcon } from "../../../../assets/icons/mtdTableIcons";
import MtdButton from "../../../MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "../../../mtdLoader";
import {
  ADD,
  DATASET_PLACEHOLDER,
  DEFAULT_OPERATOR,
  OPERATORS_OPTIONS,
  OPERATOR_PLACEHOLDER,
} from "../SchedulesModal.constants";
import { getSources, handleAdd, handleRemove } from "../SchedulesModal.service";

const ScheduleSource = ({
  triggers,
  setTriggers,
}: {
  triggers: any;
  setTriggers: any;
}) => {
  const { id, branch } = useParams();
  const [sources, setSources] = useState<undefined | any[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [operator, setOperator] = useState<string>(DEFAULT_OPERATOR);
  const [dataset, setDataset] = useState<
    | {
        id: string;
        name: string;
      }
    | undefined
  >();

  useEffect(() => {
    getSources(id, branch, setIsLoading, triggers, setTriggers, setSources);
  }, [id, branch]);

  if (isLoading) {
    return <MtdLoader size={"small"} />;
  }

  if (!sources) {
    return <MtdLoader size={"small"} />;
  }

  return (
    <>
      <MtdHeader
        heading="Schedule by Source"
        description="Schedule a dataset by source. Whenever the selected sources gets updated based on the created condition, it will trigger the current dataset build right at that moment."
        icon={<ScheduledRunIcon />}
        borderBottom
      />
      <div className="pipeline-menu-schedule-info --mt20">
        {triggers.length > 0 && (
          <div
            style={{
              background: "var(--movetodata-bkg-color-muted)",
              border: "1px solid var(--movetodata-border-color-default)",
              padding: "0.5rem 0 0.5rem 0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            {triggers.map((trigger: any) => {
              return (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <TableIcon />
                  <div style={{ flex: 1 }}>{trigger.name}</div>
                  <div style={{ fontStyle: "italic", color: "var(--movetodata" }}>
                    {trigger.operator}
                  </div>
                  <MtdButton
                    intent="dangerous"
                    minimal
                    icon={<CrossIcon />}
                    icononly
                    onClick={() =>
                      handleRemove(
                        trigger,
                        triggers,
                        setTriggers,
                        sources,
                        setSources
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Select
            placeholder={DATASET_PLACEHOLDER}
            style={{ flex: 1 }}
            value={dataset ? dataset.id : undefined}
            onChange={(value: string, option: any) => {
              setDataset({ id: value, name: option.label });
            }}
            options={sources.map((souce: any) => ({
              label: souce.name,
              value: souce.id,
            }))}
          />
          <Select
            placeholder={OPERATOR_PLACEHOLDER}
            value={operator}
            onChange={(value: string) => setOperator(value)}
            options={OPERATORS_OPTIONS}
          />
          <MtdButton
            intent="success"
            icon={<AddIcon />}
            icononly
            onClick={() =>
              handleAdd(
                dataset,
                triggers,
                operator,
                sources,
                setTriggers,
                setSources,
                setDataset
              )
            }
          >
            {ADD}
          </MtdButton>
        </div>
      </div>
      <div className="pipeline-menu-schedule-content"></div>
    </>
  );
};

export default ScheduleSource;

import { Col, Divider, Popconfirm, Row, Typography } from "antd";
import { SaveIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { updatePlatformConfig } from "../../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

const { Text, Title } = Typography;
export const HistorySettings = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config } = useSelector((state) => (state as any).platformConfig);
  const [transactions, setTransactions] = useState(config.datasetHistory);

  return (
    <div className="settings-center-block">
      <p>
        <Row>
          <Col>
            <Title level={3}>{getLanguageLabel("datasetHistory")}</Title>
            <Text type="secondary">
              {getLanguageLabel("datasetHistoryExplain")}
            </Text>
          </Col>
        </Row>
        <Divider />
      </p>

      <Row>
        <Col span={24}>
          <Text type="secondary">
            {getLanguageLabel("datasetTransactionsExplain")}
          </Text>
          <br />
          <br />
          <Row>
            <Col span={6}>
              <Text type="secondary">{getLanguageLabel("transactions")}</Text>
            </Col>
            <Col>
              <MtdInput
                value={transactions}
                onChange={(e) => setTransactions(e.target.value)}
              />
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={6}></Col>
            <Col>
              <Popconfirm
                title="Are you sure to update ?"
                description="Decreasing it, can lead to deletion of extra transactions for the dataset mapped to Global config."
                onConfirm={() => {
                  dispatch(
                    updatePlatformConfig({
                      ...config,
                      datasetHistory: transactions,
                    })
                  );
                }}
                okText="Yes"
                cancelText="No"
              >
                <MtdButton
                  icon={<SaveIcon />}
                  intent="primary"
                  textTransform="none"
                >
                  {getLanguageLabel("update")}{" "}
                </MtdButton>
              </Popconfirm>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

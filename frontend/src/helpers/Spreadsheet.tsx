import { Popconfirm, Table } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";

const data: $TSFixMe = [];
for (let i = 0; i < 5; i++) {
  data.push({
    key: i.toString(),
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}

const EditableCell = ({ editable, value, onChange }: $TSFixMe) => (
  <div>
    {editable ? (
      <MtdInput
        style={{ margin: "-5px 0" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      value
    )}
  </div>
);

type EditableTableState = $TSFixMe;

class EditableTable extends React.Component<{}, EditableTableState> {
  cacheData: $TSFixMe;
  columns: $TSFixMe;
  constructor(props: {}) {
    super(props);
    this.columns = [
      {
        title: "name",
        dataIndex: "name",
        width: "25%",
        render: (text: $TSFixMe, record: $TSFixMe) =>
          this.renderColumns(text, record, "name"),
      },
      {
        title: "age",
        dataIndex: "age",
        width: "15%",
        render: (text: $TSFixMe, record: $TSFixMe) =>
          this.renderColumns(text, record, "age"),
      },
      {
        title: "address",
        dataIndex: "address",
        width: "40%",
        render: (text: $TSFixMe, record: $TSFixMe) =>
          this.renderColumns(text, record, "address"),
      },
      {
        title: "operation",
        dataIndex: "operation",
        render: (text: $TSFixMe, record: $TSFixMe) => {
          const { editable } = record;
          return (
            <div className="editable-row-operations">
              {editable ? (
                <span>
                  <a
                    onClick={() => this.save(record.key)}
                    style={{ color: "#C2C2C2" }}
                  >
                    Save
                  </a>
                  <Popconfirm
                    title="Sure to cancel?"
                    onConfirm={() => this.cancel(record.key)}
                  >
                    <a style={{ color: "#C2C2C2" }}>Cancel</a>
                  </Popconfirm>
                </span>
              ) : (
                <a
                  onClick={() => this.edit(record.key)}
                  style={{ color: "#C2C2C2" }}
                >
                  Edit
                </a>
              )}
            </div>
          );
        },
      },
    ];
    this.state = { data };
    this.cacheData = data.map((item: $TSFixMe) => ({
      ...item,
    }));
  }
  renderColumns(text: $TSFixMe, record: $TSFixMe, column: $TSFixMe) {
    return (
      <EditableCell
        editable={record.editable}
        value={text}
        onChange={(value: $TSFixMe) =>
          this.handleChange(value, record.key, column)
        }
      />
    );
  }
  handleChange(value: $TSFixMe, key: $TSFixMe, column: $TSFixMe) {
    const newData = [...this.state.data];
    const target = newData.filter((item) => key === item.key)[0];
    if (target) {
      target[column] = value;
      this.setState({ data: newData });
    }
  }
  edit(key: $TSFixMe) {
    const newData = [...this.state.data];
    const target = newData.filter((item) => key === item.key)[0];
    if (target) {
      target.editable = true;
      this.setState({ data: newData });
    }
  }
  save(key: $TSFixMe) {
    const newData = [...this.state.data];
    const target = newData.filter((item) => key === item.key)[0];
    if (target) {
      delete target.editable;
      this.setState({ data: newData });
      this.cacheData = newData.map((item) => ({ ...item }));
    }
  }
  cancel(key: $TSFixMe) {
    const newData = [...this.state.data];
    const target = newData.filter((item) => key === item.key)[0];
    if (target) {
      Object.assign(
        target,
        this.cacheData.filter((item: $TSFixMe) => key === item.key)[0]
      );
      delete target.editable;
      this.setState({ data: newData });
    }
  }
  render() {
    return (
      <Table
        bordered
        dataSource={this.state.data}
        columns={this.columns}
        pagination={false}
      />
    );
  }
}
export default EditableTable;

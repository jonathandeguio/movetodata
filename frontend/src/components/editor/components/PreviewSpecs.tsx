import { InputNumber } from "antd";
import React, { useEffect, useState } from "react";
import { getPreviewSpecsAPI, putPreviewSpecsAPI } from "../editor.api";

interface IProps {
  id: string;
  branch: string;
}

interface IPreviewSpecsModel {
  repositoryId: string;
  branch: string;
  rowLimit?: number;
}

const PreviewSpecs = ({ id, branch }: IProps) => {
  const [previewRowLimit, setPreviewRowLimit] = useState<number>();

  const getPreviewLimit = () => {
    getPreviewSpecsAPI(id, branch).then(
      ({ data }: { data: IPreviewSpecsModel }) => {
        setPreviewRowLimit(data.rowLimit);
      }
    );
  };

  const setPreviewLimit = (rowLimit: number) => {
    putPreviewSpecsAPI(id, branch, rowLimit);
  };

  useEffect(() => {
    getPreviewLimit();
  }, []);

  return (
    <div>
      <div className="MtdHeader1">Input Row Limit</div>
      <InputNumber
        value={previewRowLimit}
        disabled={!previewRowLimit}
        min={10}
        max={100000}
        onChange={(value: number | null) => {
          if (value) {
            setPreviewLimit(value);
            setPreviewRowLimit(value);
          }
        }}
      />
    </div>
  );
};

export default PreviewSpecs;

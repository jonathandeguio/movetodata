import { Tooltip } from "antd";
import { EyeOpenIcon } from "assets/icons/mtdInterfaceIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { WarningState } from "assets/Illustrations/EmptyState";
import axios, { AxiosResponse } from "axios";
import NoData from "components/CommonUI/NoData";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";

interface Props {
  children?: ReactNode;
  removeHandler: (e: any) => void;
  chartId: string;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorType = {
  pageNotFound: "pageNotFound",
  retry: "retry",
  error: "error",
};

const logError = (body: any): Promise<AxiosResponse<any, any>> => {
  return axios.post(`/errors`, body);
};

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ChartErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError({
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Update state with the error and errorInfo
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.error) {
      return (
        <>
          <NoData
            icon={<WarningState />}
            heading={"Oops chart failed to load!"}
          />
          <div className="editableElementBorder-delete">
          <Tooltip title={getLanguageLabel("openInNewTab")}>
            <Link
              to={`/portal/kepler/CHART/${this.props.chartId}`}
              target={`_blank${this.props.chartId}`}
              className="text-and-icon-center"
            >
              
                <EyeOpenIcon />
              
            </Link>
            </Tooltip>
            <Tooltip title={getLanguageLabel("remove")}>
            <div
              className="text-and-icon-center"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => this.props.removeHandler(e)}
            >
              
                <TrashIcon />
              
            </div>
            </Tooltip>
          </div>
        </>
      );
    }
    return this.props.children;
  }
}

export default ChartErrorBoundary;

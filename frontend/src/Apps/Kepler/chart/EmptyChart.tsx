import { EmptyChartIcon } from "assets/icons/mtdMiscellaneousIcons";
import React from "react";
interface Props {
  data: any;
  dataSecondary?: any;
  icon?: any;
}
const EmptyChart: React.FC<Props> = (props) => {
  return (
    <div className="empty_chart">
      {props.icon ?? <EmptyChartIcon size={160} />}
      <>{props.data}</>
      {props.dataSecondary ?? <></>}
    </div>
  );
};

export default EmptyChart;

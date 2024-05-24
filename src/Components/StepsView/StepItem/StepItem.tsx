import React, { useContext } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import { Target, TargetEnum } from "../../../Types/eventComponents";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../Types/targetContext";

interface StepItemProps {
  data: RecordedEvent;
  target: any;
}

const StepItem: React.FC<StepItemProps> = ({ data, target }) => {
  const value = () => {
    if (data.value instanceof Object) {
      // Add your statement here
      return (
        <p className="sub_content">
          x = {data.value.x} y = {data.value.y}
        </p>
      );
    } else {
      return <p className="sub_content">{data.value}</p>;
    }
  };

  const preferedTarget = () => {
    console.log("dsada");
    switch (target) {
      case TargetEnum.css:
        return <p>{data.target.css}</p>;
      case TargetEnum["x-path"]:
        return <p>{data.target.xpath}</p>;
      default:
        return <p>{data.target.css}</p>;
    }
  };

  return (
    <div className="stepitem__container">
      <div className="oneline_spacebetween_flex">
        <h4>{data.type}</h4>
        {value()}
      </div>
      {preferedTarget()}
      <div className="divider"></div>
    </div>
  );
};

export default StepItem;

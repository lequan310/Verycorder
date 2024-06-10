import React, { useContext } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import { TargetEnum } from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

interface StepItemProps {
  data: RecordedEvent;
}

const StepItem: React.FC<StepItemProps> = ({ data }) => {
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

  const targetContext = useContext(TargetContext);

  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }

  const preferedTarget = () => {
    switch (targetContext) {
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

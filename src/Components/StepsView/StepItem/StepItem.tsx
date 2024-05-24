import React from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";

interface StepItemProps {
  data: RecordedEvent; // Define the appropriate type for `data`
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
  return (
    <div className="stepitem__container">
      <div className="oneline_spacebetween_flex">
        <h5>{data.type}</h5>
        {value()}
      </div>
      <p>{data.target.css}</p>
      <div className="divider"></div>
    </div>
  );
};

export default StepItem;

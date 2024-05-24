import React from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";

interface StepItemProps {
  data: RecordedEvent; // Define the appropriate type for `data`
}

const StepItem: React.FC<StepItemProps> = ({ data }) => {
  return (
    <div className="stepitem__container">
      <p>{data.type}</p>
      <h5>{data.target.css}</h5>
      <div className="divider"></div>
    </div>
  );
};

export default StepItem;

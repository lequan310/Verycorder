import React, { useContext } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import { TargetEnum } from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

import { LegacyRef } from "react";
import { Channel } from "../../../Others/listenerConst";

interface StepItemProps {
  data: RecordedEvent;
  state: boolean;
  current: boolean;
  prevState: boolean;
  // ref: LegacyRef<HTMLDivElement>;
}

const StepItem: React.FC<StepItemProps> = ({
  data,
  state,
  current,
  prevState,
  // ref,
}) => {
  const ipcRenderer = window.api;
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
    switch (targetContext.target) {
      case TargetEnum.css:
        return <p>{data.target.css}</p>;
      case TargetEnum["x-path"]:
        return <p>{data.target.xpath}</p>;
      default:
        return <p>{data.target.css}</p>;
    }
  };

  const handleCaseState = () => {
    if (current && targetContext.replayState) {
      return "grey";
    } else if (prevState) {
      return "green";
    } else if (state == false) {
      return "red_background";
    } else return "";
  };

  return (
    <div
      // ref={ref}
      className={`stepitem__container ${handleCaseState()}`}
    >
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

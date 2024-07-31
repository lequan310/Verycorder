import React, { useContext, useEffect, useState } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import {
  EventEnum,
  getEnumValues,
  TargetEnum,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

import { LegacyRef } from "react";
import { Channel } from "../../../Others/listenerConst";
import ControllerItem from "../../../Components/ControllerItem/ControllerItem";

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
  const [editMode, setEditMode] = useState(false);
  const eventOptions = getEnumValues(EventEnum);
  const [selectedEvent, setSelectedEvent] = useState<string>(data.type); // Default selected option

  const targetContext = useContext(TargetContext);
  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }

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
    switch (targetContext.target) {
      case TargetEnum.css:
        return data.target.css;
      case TargetEnum["x-path"]:
        return data.target.xpath;
      default:
        return data.target.css;
    }
  };

  const [target, setTarget] = useState(preferedTarget());

  const handleCaseState = () => {
    if (current && targetContext.replayState) {
      return "grey";
    } else if (prevState) {
      return "green";
    } else if (state == false) {
      return "red_background";
    } else return "";
  };

  useEffect(() => {
    const handleUpdateTarget = (data: any) => {
      setTarget(data);
      ipcRenderer.on(Channel.TEST_LOG, data);
    };
    const updateTarget = ipcRenderer.on(
      Channel.SEND_TARGET,
      handleUpdateTarget
    );

    return () => {
      updateTarget();
    };
  });

  const handleEditMode = () => {
    if (editMode) {
      return (
        <div
          // ref={ref}
          className={` stepitem__wrapper grey`}
        >
          <div className={`stepitem__container`}>
            <h5>Event type</h5>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              {eventOptions.map((event: string, index) => (
                <option key={index} value={event}>
                  {event}
                </option>
              ))}
            </select>
            <h5>Location</h5>
            <div contentEditable className="stepitem_target_location">
              <p>{target}</p>
            </div>
          </div>

          <div className="stepitem_flex_col">
            <button onClick={() => setEditMode(!editMode)}>
              <span className="material-symbols-rounded">close</span>
            </button>
            <button>
              <span className="material-symbols-rounded">save</span>
            </button>
          </div>

          <div className="divider fixed_bottom"></div>
        </div>
      );
    } else {
      return (
        <div
          // ref={ref}
          className={` stepitem__wrapper ${handleCaseState()}`}
        >
          <div className={`stepitem__container`}>
            <div className="oneline_spacebetween_flex">
              <h4>{data.type}</h4>
              {value()}
            </div>
            <p>{preferedTarget()}</p>
          </div>

          <button
            onClick={() => {
              ipcRenderer.send(Channel.CLICK_EDIT);
              setEditMode(!editMode);
            }}
          >
            <span className="material-symbols-rounded">edit</span>
          </button>

          <div className="divider fixed_bottom"></div>
        </div>
      );
    }
  };

  return handleEditMode();
};

export default StepItem;

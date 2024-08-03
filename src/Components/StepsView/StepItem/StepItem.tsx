import React, { forwardRef, useContext, useEffect, useState } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import {
  EventEnum,
  getEnumValues,
  Target,
  TargetEnum,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

import { LegacyRef } from "react";
import { Channel } from "../../../Others/listenerConst";

interface StepItemProps {
  itemKey: number;
  data: RecordedEvent;
  state: boolean;
  current: boolean;
  prevState: boolean;
  selectedIndex: (index: number) => void;
  doneEditing: () => void;
  ref: LegacyRef<HTMLDivElement>;
}

const StepItem = forwardRef<HTMLDivElement, StepItemProps>(
  (
    { itemKey, data, state, current, prevState, selectedIndex, doneEditing },
    ref
  ) => {
    const ipcRenderer = window.api;
    const [editMode, setEditMode] = useState(false);
    const eventOptions = getEnumValues(EventEnum);
    const [selectedEvent, setSelectedEvent] = useState<string>(data.type); // Default selected option
    // const [target, setTarget] = useState("");

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

    const handleCaseState = () => {
      if (current && targetContext.replayState) {
        return "grey";
      } else if (prevState) {
        return "green";
      } else if (state == false) {
        return "red_background";
      } else return "";
    };

    const handleToggleEditMode = () => {
      ipcRenderer.send(Channel.win.CLICK_EDIT);
      setEditMode(!editMode);
      if (!editMode) {
        selectedIndex(itemKey);
      } else {
        selectedIndex(-1);
      }
    };

    const handleEditMode = () => {
      if (editMode) {
        return (
          <div ref={ref} className={` stepitem__wrapper grey`}>
            <div className={`stepitem__container`}>
              <h5>Event type</h5>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                {eventOptions.map((event: string, index) =>
                  event === "Scroll" ? null : (
                    <option key={index} value={event}>
                      {event}
                    </option>
                  )
                )}
              </select>
              <h5>Location</h5>
              <div contentEditable className="stepitem_target_location">
                <p>{preferedTarget()}</p>
              </div>
            </div>

            <div className="stepitem_flex_col">
              {/* <button onClick={() => handleToggleEditMode()}>
              <span className="material-symbols-rounded">close</span>
            </button> */}

              <button
                onClick={() => {
                  handleToggleEditMode();
                  doneEditing();
                }}
              >
                <span className="material-symbols-rounded">save</span>
              </button>
            </div>

            <div className="divider fixed_bottom"></div>
          </div>
        );
      } else {
        return (
          <div ref={ref} className={` stepitem__wrapper ${handleCaseState()}`}>
            <div className={`stepitem__container`}>
              <div className="oneline_spacebetween_flex">
                <h4>{data.type}</h4>
                {value()}
              </div>
              <p>{preferedTarget()}</p>
            </div>

            {data.type !== EventEnum.scroll ? (
              <button
                disabled={!targetContext.editState}
                onClick={() => handleToggleEditMode()}
              >
                <span className="material-symbols-rounded">edit</span>
              </button>
            ) : null}
            <div className="divider fixed_bottom"></div>
          </div>
        );
      }
    };

    return handleEditMode();
  }
);

export default StepItem;

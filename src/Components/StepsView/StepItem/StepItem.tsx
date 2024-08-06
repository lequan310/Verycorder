import React, { forwardRef, useContext, useEffect, useState } from "react";
import "./StepItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import {
  EventEnum,
  getEnumValues,
  Target,
  TargetEnum,
  Value,
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
  doneEditing: (
    type: EventEnum,
    index: number,
    target: Target | null,
    value: Value | null,
    inputValue: string | null
  ) => void;
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

    //Edit data
    const [selectedEvent, setSelectedEvent] = useState<string>(data.type); // Default selected option
    const [editedScrollValue, setEditedScrollValue] = useState(
      data.type === EventEnum.scroll ? data.scrollValue : { x: 0, y: 0 }
    ); // Default edited target
    const [editedInputValue, setEditedInputValue] = useState(
      data.type === EventEnum.input ? data.value : ""
    );

    const targetContext = useContext(TargetContext);
    if (!targetContext) {
      throw new Error("UserContext must be used within UserProvider");
    }

    const value = () => {
      if (data.type === EventEnum.input) {
        return <p className="sub_content">{data.value}</p>;
      } else if (
        data.type === EventEnum.scroll &&
        typeof data.scrollValue === "object"
      ) {
        return (
          <p className="sub_content">
            x = {data.scrollValue.x} y = {data.scrollValue.y}
          </p>
        );
      } else {
        return null;
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
      setEditMode((prev) => !prev);
      selectedIndex(editMode ? -1 : itemKey);
    };

    const handleSave = () => {
      handleToggleEditMode();
      doneEditing(
        EventEnum[selectedEvent.toLowerCase() as keyof typeof EventEnum],
        itemKey,
        data.target,
        selectedEvent === EventEnum.scroll ? editedScrollValue : null,
        selectedEvent === EventEnum.input ? editedInputValue : null
      );
    };

    const handleEventEditType = () => {
      const commonContent = (
        <>
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
          <h5>Target</h5>
          <div
            suppressContentEditableWarning={true}
            className="stepitem_target_location"
          >
            <p>{preferedTarget()}</p>
          </div>
        </>
      );

      const commonFooter = (
        <div className="stepitem_flex_col">
          <button onClick={handleSave}>
            <span className="material-symbols-rounded">save</span>
          </button>
        </div>
      );

      switch (selectedEvent) {
        case EventEnum.click:
        case EventEnum.hover:
          return (
            <div ref={ref} className={`stepitem__wrapper grey`}>
              <div className={`stepitem__container`}>{commonContent}</div>
              {commonFooter}
              <div className="divider fixed_bottom"></div>
            </div>
          );
        case EventEnum.scroll:
          return (
            <div ref={ref} className={`stepitem__wrapper grey`}>
              <div className={`stepitem__container`}>
                {commonContent}
                <h5>Scroll Values</h5>
                <div className="flex">
                  <p className="stepitem_target_title">x</p>
                  <p className="stepitem_target_title">y</p>
                </div>
                <div className="flex">
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={editedScrollValue.x}
                    onChange={(e) =>
                      setEditedScrollValue({
                        x: parseInt(e.target.value),
                        y: editedScrollValue.y,
                      })
                    }
                  />
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={editedScrollValue.y}
                    onChange={(e) =>
                      setEditedScrollValue({
                        x: editedScrollValue.x,
                        y: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              {commonFooter}
              <div className="divider fixed_bottom"></div>
            </div>
          );
        case EventEnum.input:
          return (
            <div ref={ref} className={`stepitem__wrapper grey`}>
              <div className={`stepitem__container`}>
                {commonContent}
                <h5>Input Data</h5>
                <input
                  className="stepitem_target_location"
                  value={editedInputValue}
                  onChange={(e) => setEditedInputValue(e.target.value)}
                />
              </div>
              {commonFooter}
              <div className="divider fixed_bottom"></div>
            </div>
          );
        default:
          handleToggleEditMode();
          return null;
      }
    };

    const handleEditMode = () => {
      if (editMode) {
        return handleEventEditType();
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

            {
              <button
                disabled={!targetContext.editState}
                onClick={() => handleToggleEditMode()}
              >
                <span className="material-symbols-rounded">edit</span>
              </button>
            }
            <div className="divider fixed_bottom"></div>
          </div>
        );
      }
    };

    return handleEditMode();
  }
);

export default StepItem;

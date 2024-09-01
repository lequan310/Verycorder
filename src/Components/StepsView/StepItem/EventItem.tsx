import React, { forwardRef, useContext, useState } from "react";
import "./EventItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import {
  EventEnum,
  Target,
  TargetEnum,
  Value,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

import { LegacyRef } from "react";
import { Channel } from "../../../Others/listenerConst";
import HandleEventEditType from "./handleEventEditType";
import { CanvasEvent } from "../../../Types/canvasEvent";
import { DetectMode } from "../../../Types/detectMode";

interface EventItemProps {
  itemKey: number;
  data: RecordedEvent | CanvasEvent;
  selectedIndex: (index: number) => void;
  doneEditing: (
    type: EventEnum,
    target: string | Target,
    value: Value | null,
    inputValue: string | null
  ) => void;
  ref: LegacyRef<HTMLDivElement>;
  deleteItem: (index: number) => void;
  currentReplayState: {
    index: number;
    state: boolean;
  };
}

const EventItem = forwardRef<HTMLDivElement, EventItemProps>(
  (
    {
      itemKey,
      data,
      // state,
      // current,
      // prevState,
      selectedIndex,
      doneEditing,
      deleteItem,
      currentReplayState,
    },
    ref
  ) => {
    const ipcRenderer = window.api;
    const [editMode, setEditMode] = useState(false);

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
      //Check type for only Target
      if (typeof data.target !== "string") {
        switch (targetContext.target) {
          case TargetEnum.css:
            return data.target.css;
          case TargetEnum["x-path"]:
            return data.target.xpath;
          default:
            return data.target.css;
        }
      } else if (typeof data.target === "string") {
        return data.target;
      }

      //Fail safe
      return "";
    };

    const handleCaseState = () => {
      if (currentReplayState.index == itemKey && targetContext.replayState) {
        return "grey";
      } else if (currentReplayState.index > itemKey) {
        return "green";
      } else if (
        currentReplayState.index == itemKey &&
        !currentReplayState.state
      ) {
        return "red_background";
      } else return "";
    };

    const handleToggleEditMode = () => {
      if (targetContext.detectMode !== DetectMode.AI) {
        ipcRenderer.send(Channel.win.CLICK_EDIT);
      }
      setEditMode((prev) => !prev);
      selectedIndex(editMode ? -1 : itemKey);
    };

    const handleSave = (
      data: {
        type: EventEnum;
        target: string | Target | null;
        value: Value | null;
        inputValue: string | null;
      } | null
    ) => {
      if (data === null) return;
      handleToggleEditMode();
      doneEditing(data.type, data.target, data.value, data.inputValue);
    };

    const handleEditMode = () => {
      if (editMode) {
        return (
          <HandleEventEditType
            scrollRef={ref}
            handleSave={handleSave}
            dataPacket={data}
          />
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
            <div>
              {targetContext.editState ? (
                <div className="stepitem_flex_col hidden">
                  <button
                    disabled={!targetContext.editState}
                    onClick={() => deleteItem(itemKey)}
                    className="close_save_button"
                  >
                    <span className="material-symbols-rounded">delete</span>
                    Delete
                  </button>
                  <button
                    disabled={!targetContext.editState}
                    onClick={() => handleToggleEditMode()}
                    className="edit_save_button"
                  >
                    <span className="material-symbols-rounded">edit</span>
                    Edit
                  </button>
                </div>
              ) : null}
            </div>
            <div className="divider fixed_bottom"></div>
          </div>
        );
      }
    };

    return handleEditMode();
  }
);

export default EventItem;

import React, { LegacyRef, useContext, useRef, useState } from "react";
import {
  EventEnum,
  getEnumValues,
  Target,
  TargetEnum,
  Value,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";
import { DetectMode } from "../../../Types/detectMode";
import { RecordedEvent } from "../../../Types/recordedEvent";
import { CanvasEvent } from "../../../Types/canvasEvent";

interface HandleEventEditTypeProps {
  ref: LegacyRef<HTMLDivElement>;
  handleSave: (
    data: {
      type: EventEnum;
      target: string | Target;
      value: Value | null;
      inputValue: string | null;
    } | null
  ) => void;
  dataPacket: RecordedEvent | CanvasEvent;
}

const HandleEventEditType: React.FC<HandleEventEditTypeProps> = ({
  ref,
  handleSave,
  dataPacket,
}) => {
  const eventOptions = getEnumValues(EventEnum);
  const [eventType, setEventType] = useState(dataPacket.type);
  const [scrollValue, setScrollValue] = useState(
    dataPacket.type === EventEnum.scroll
      ? dataPacket.scrollValue
      : { x: 0, y: 0 }
  );
  const [inputValue, setInputValue] = useState(
    dataPacket.type === EventEnum.input ? dataPacket.value : ""
  );
  const [targetAI, setTargetAI] = useState(
    typeof dataPacket.target === "string" ? dataPacket.target : ""
  );

  const targetContext = useContext(TargetContext);
  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }

  const preferedTarget = () => {
    //Check type for only Target
    if (typeof dataPacket.target !== "string" && "css" in dataPacket.target) {
      switch (targetContext.target) {
        case TargetEnum.css:
          return dataPacket.target.css;
        case TargetEnum["x-path"]:
          return dataPacket.target.xpath;
        default:
          return dataPacket.target.css;
      }
    } else if (typeof dataPacket.target === "string") {
      return dataPacket.target;
    }

    //Fail safe
    return "";
  };

  const editableDivRef = useRef<HTMLDivElement>(null);
  const handleInput = () => {
    if (editableDivRef.current) {
      setTargetAI(editableDivRef.current.innerText);
    }
  };

  const commonContent = (
    <>
      <div className="event_type_wrapper">
        <h5>Event type</h5>
        <select
          value={eventType}
          onChange={(e) =>
            setEventType(
              EventEnum[e.target.value.toLowerCase() as keyof typeof EventEnum]
            )
          }
        >
          {eventOptions.map((event: string, index) => (
            <option key={index} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div className="content_type_wrapper">
        <h5>Target</h5>
        {targetContext.detectMode === DetectMode.DOM ? (
          <div
            suppressContentEditableWarning={true}
            className="stepitem_target_location"
          >
            <p>{preferedTarget()}</p>
          </div>
        ) : (
          <div
            ref={editableDivRef}
            contentEditable
            suppressContentEditableWarning={true}
            className="stepitem_target_location"
            onInput={handleInput}
          >
            <p>{targetAI}</p>
          </div>
        )}
      </div>
    </>
  );

  const saveFuncHandler = () => {
    const data = {
      type: eventType,
      target:
        targetContext.detectMode === DetectMode.DOM
          ? dataPacket.target
          : targetAI, //Get a string or css/x-path
      value: scrollValue,
      inputValue: inputValue,
    };
    handleSave(data);
  };

  const commonFooter = (
    <div className="stepitem_flex_col">
      {targetContext.addNewEventManually ? (
        <button onClick={() => handleSave(null)} className="close_save_button">
          <span className="material-symbols-rounded">close</span>
          Close
        </button>
      ) : null}
      <button onClick={saveFuncHandler} className="edit_save_button">
        <span className="material-symbols-rounded">
          {targetContext.addNewEventManually ? "add" : "save"}
        </span>
        {targetContext.addNewEventManually ? "Add" : "Save"}
      </button>
    </div>
  );

  switch (eventType) {
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
            <div className="content_type_wrapper">
              <h5>Scroll Values</h5>
              <div className="event_type_wrapper">
                <div className="scroll_value_wrapper">
                  <h5 className="stepitem_target_title">x</h5>
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={scrollValue.x}
                    onChange={(e) =>
                      setScrollValue({
                        x: parseInt(e.target.value),
                        y: scrollValue.y,
                      })
                    }
                  />
                </div>
                <div className="scroll_value_wrapper">
                  <h5 className="stepitem_target_title">y</h5>
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={scrollValue.y}
                    onChange={(e) =>
                      setScrollValue({
                        x: scrollValue.x,
                        y: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
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
            <div className="content_type_wrapper">
              <h5>Input Data</h5>
              <input
                className="stepitem_target_location"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
          {commonFooter}
          <div className="divider fixed_bottom"></div>
        </div>
      );
    default:
      return null;
  }
};

export default HandleEventEditType;

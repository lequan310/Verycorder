import React, {
  LegacyRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  scrollRef: LegacyRef<HTMLDivElement>;
  handleSave: (
    data: {
      type: EventEnum;
      target: string | Target;
      value: Value | null;
      inputValue: string | null;
    } | null
  ) => void;
  dataPacket: RecordedEvent | CanvasEvent | null;
}

const HandleEventEditType: React.FC<HandleEventEditTypeProps> = ({
  scrollRef,
  handleSave,
  dataPacket,
}) => {
  const eventOptions = getEnumValues(EventEnum);
  const [eventType, setEventType] = useState(
    dataPacket.type ?? EventEnum.click
  );
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

  //handle auto height for the text area
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height to auto to calculate the new height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scroll height
    }
  }, [targetAI]); // Adjust height whenever content changes

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

  const setContent = (data: string) => {
    console.log(data);
    setTargetAI(data);
  };

  const commonContent = (
    <>
      <div className="event_type_wrapper" ref={scrollRef}>
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
          <textarea
            ref={textareaRef}
            className="stepitem_target_location"
            onChange={(e) => setContent(e.target.value)}
            value={targetAI}
            style={{
              width: "100%",
              overflow: "hidden", // Hide scrollbars
              resize: "none", // Disable manual resizing
              boxSizing: "border-box", // Include padding in the width/height
            }}
          />
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
    console.log(data);
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
        <div className={`stepitem__wrapper grey`}>
          <div className={`stepitem__container`}>{commonContent}</div>
          {commonFooter}
          <div className="divider fixed_bottom"></div>
        </div>
      );
    case EventEnum.scroll:
      return (
        <div className={`stepitem__wrapper grey`}>
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
        <div className={`stepitem__wrapper grey`}>
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

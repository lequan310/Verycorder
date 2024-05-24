import React, { useContext, useEffect, useRef, useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent";
import { TargetContext } from "../../Types/targetContext";

const StepsView = () => {
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState([]);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventList]); // This hook runs whenever eventList changes

  const addEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
  };

  ipcRenderer.on(`add-event`, (event: RecordedEvent) => {
    addEvent(event);
  });

  ipcRenderer.on(`toggle-record`, (recording: boolean) => {
    if (recording) setEventList([]); // Reset event list when recording starts
    else ipcRenderer.send("update-test-case", eventList); // Send recorded events to main process when finish recording
  });

  const targetContext = useContext(TargetContext);

  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }
  return (
    <div ref={listRef} className="stepview__container">
      {eventList.map((event, index) => {
        return <StepItem key={index} data={event} target={targetContext} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default StepsView;

import React, { useEffect, useRef, useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent";
import { Channel } from "../../Others/listenerConst";

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

  ipcRenderer.on(Channel.ADD_EVENT, (event: RecordedEvent) => {
    addEvent(event);
  });

  ipcRenderer.on(Channel.TOGGLE_RECORD, (recording: boolean) => {
    if (recording) setEventList([]); // Reset event list when recording starts
    else ipcRenderer.send(Channel.UPDATE_TEST_CASE, eventList); // Send recorded events to main process when finish recording
  });

  return (
    <div ref={listRef} className="stepview__container">
      {eventList.map((event, index) => {
        return <StepItem key={index} data={event} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default StepsView;

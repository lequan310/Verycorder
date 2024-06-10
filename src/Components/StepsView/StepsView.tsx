import React, { useEffect, useRef, useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent";
import { Channel } from "../../Others/listenerConst";

const StepsView = () => {
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
  };

  const toggleRecord = (recording: boolean) => {
    if (recording) setEventList([]); // Reset event list when recording starts
    else ipcRenderer.send(Channel.UPDATE_TEST_CASE, eventList); // Send recordedevents to main process when finish recording
  }

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventList]); // This hook runs whenever eventList changes

  // Clean up stuff
  useEffect(() => {
    const removeAddEvent = ipcRenderer.on(Channel.ADD_EVENT, addEvent);
    const removeToggleRecord = ipcRenderer.on(Channel.TOGGLE_RECORD, toggleRecord);

    return () => {
      removeAddEvent();
      removeToggleRecord();
      // ipcRenderer.removeAllListeners(Channel.TOGGLE_RECORD);
    };
  }, [eventList]);

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

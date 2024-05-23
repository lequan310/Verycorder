import React, { useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent"

const StepsView = () => {
    const ipcRenderer = (window as any).api;
    const [eventList, setEventList] = useState([]);

    const addEvent = (event: RecordedEvent) => {
        setEventList([...eventList, event]);
    };

    ipcRenderer.on(`add-event`, (event: RecordedEvent) => {
        addEvent(event);
    });

    ipcRenderer.on(`toggle-record`, (recording: boolean) => {
        if (recording) setEventList([]); // Reset event list when recording starts
        else ipcRenderer.send('update-test-case', eventList); // Send recorded events to main process when finish recording
    });

    return (
        <div className="stepview__container">
            {eventList.map((event, index) => {
                return (
                    <StepItem key={index} />
                );
            })}
            {/* <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem />
            <StepItem /> */}
        </div>
    );
};

export default StepsView;
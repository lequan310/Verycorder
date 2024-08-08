import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { StepsView } from "./Components";
import {
  reducer,
  TargetContext,
  TargetDispatchContext,
} from "./Types/targetContext";
import { TargetEnum } from "./Types/eventComponents";
import { Channel } from "./Others/listenerConst";
import { AppMode } from "./Types/appMode";
import TitleBar from "./Components/TitleBar/TitleBar";
import SideBar from "./Components/SideBar/SizeBar";

const App = () => {
  const [responseMessage, setResponseMessage] = useState(
    "Please enter a link to continue"
  );
  const [enableSeachBar, setEnableSeachBar] = useState(true);
  const [enableResize, setEnableResize] = useState(true);
  const ipcRenderer = window.api;

  //This is to handle if URL is invalid
  function handleResponse(object: { success: boolean; message: string }) {
    setResponseMessage(object.message);
    setRecordingButtonEnable(object.success);
  }

  //GLOBAL REDUCER----------------
  const initialState: TargetContext = {
    target: TargetEnum.css,
    replayState: false,
    recordState: false,
    replayingButtonEnable: false,
    recordingButtonEnable: false,
    editState: false,
    testCaseSize: 0,
    addNewEventManually: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  //USECONTEXT FUNC HERE---------------------------------
  const targetContext = useContext(TargetContext);

  const setRecordState = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_RECORD_STATE", payload: newRecordState });
    }
  };

  const setReplayState = (newReplayState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_REPLAY_STATE", payload: newReplayState });
    }
  };

  const setRecordingButtonEnable = (newRecording: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_RECORDING_BUTTON_ENABLE", payload: newRecording });
    }
  };

  const setReplayingButtonEnable = (newReplaying: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_REPLAYING_BUTTON_ENABLE", payload: newReplaying });
    }
  };

  const setEditState = (newEditState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_EDIT_STATE", payload: newEditState });
    }
  };

  useEffect(() => {
    //handle state change --------------
    const updateStateHandler = (mode: AppMode) => {
      const disableAll = () => {
        setRecordingButtonEnable(false);
        setReplayingButtonEnable(false);
        setEnableSeachBar(false);
        setEnableResize(false);
        setEditState(false);
      };

      switch (mode) {
        case AppMode.normal:
          setRecordingButtonEnable(!targetContext.recordingButtonEnable);
          setRecordState(false);
          setReplayState(false);
          setEnableSeachBar(true);
          setEnableResize(true);
          setEditState(true);
          break;

        case AppMode.record:
          setRecordState(!targetContext.recordState);
          disableAll();
          setRecordingButtonEnable(true);
          break;

        case AppMode.replay:
          setReplayState(!targetContext.replayState);
          disableAll();
          setReplayingButtonEnable(true);
          break;

        case AppMode.edit:
          setEditState(false);
          setReplayingButtonEnable(false);
          break;

        default:
          setRecordState(false);
          setReplayState(false);
          disableAll();
          setEnableSeachBar(true);
          break;
      }
    };

    const updateState = ipcRenderer.on(
      Channel.win.UPDATE_STATE,
      updateStateHandler
    );

    return () => {
      updateState();
    };
  }, []);

  // Handle resize-----------------------
  const [leftWidth, setLeftWidth] = useState(260); // Initial width as percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    // ipcRenderer.invoke(Channel.BEGIN_RESIZE).catch((error: Error) => {
    //   console.log(error);
    // });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;

      // Get screen width
      const screenWidth = window.innerWidth;

      // Ensure the new width is within the limits of 250 and screen width - 200
      const finalLeftWidth = Math.min(
        Math.max(newLeftWidth, 250),
        screenWidth - 400
      );

      setLeftWidth(finalLeftWidth);
      ipcRenderer.send(Channel.win.END_RESIZE, finalLeftWidth); // Limit the width between 100px and container width - 100px
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    // const containerRect = containerRef.current.getBoundingClientRect();
    // console.log(e.clientX);
    // const newLeftWidth = e.clientX - containerRect.left;
  };

  return (
    <TargetContext.Provider value={state}>
      <TargetDispatchContext.Provider value={dispatch}>
        <TitleBar response={handleResponse} disable={enableSeachBar} />
        <div className="app__container">
          <SideBar />
          <div className="main__wrapper" ref={containerRef}>
            <div
              className="main-content__wrapper"
              style={{ width: `${leftWidth}px` }}
            >
              <div className="controller__content">
                <div className="commands__wrapper">
                  <div className="commands__wrapper__title">
                    <h4>Commands</h4>
                    <span className="material-symbols-rounded">tune</span>
                  </div>
                  <StepsView />
                </div>
              </div>
            </div>
            <button
              className={`${"draggable_wrapper"} ${
                isDragging ? "dragging" : ""
              }`}
              onMouseDown={enableResize ? handleMouseDown : undefined}
              disabled={!enableResize}
            >
              <span className="material-symbols-rounded">drag_handle</span>
            </button>
            <div
              className="searchbar__wrapper"
              style={{ width: `${100 - leftWidth}px` }}
            >
              <div className="message__wrapper">
                <h2 className="message">{responseMessage}</h2>
              </div>
            </div>
          </div>
        </div>
      </TargetDispatchContext.Provider>
    </TargetContext.Provider>
  );
};

export default App;

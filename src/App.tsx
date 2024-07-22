import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ControllerItem,
  HeaderComponent,
  SearchBar,
  StepsView,
} from "./Components";
import {
  reducer,
  TargetContext,
  TargetDispatchContext,
} from "./Types/targetContext";
import { TargetEnum } from "./Types/eventComponents";
import { Channel } from "./Others/listenerConst";
import { AppMode } from "./Types/appMode";
import PopupSettings from "./Components/PopupSettings/PopupSettings";
import TitleBar from "./Components/TitleBar/TitleBar";
import SideBar from "./Components/SideBar/SizeBar";

const App = () => {
  const [shrink, setShrink] = useState(false);
  const [responseMessage, setResponseMessage] = useState(
    "Please enter a link to continue"
  );
  const [enableSeachBar, setEnableSeachBar] = useState(true);
  const ipcRenderer = window.api;
  const [settingState, setSettingState] = useState(false);

  //This is to handle if URL is invalid
  function handleResponse(object: { success: boolean; message: string }) {
    setResponseMessage(object.message);
    setRecordingButtonEnable(object.success);
  }

  const handleButtonClick = () => {
    setShrink((prev) => {
      return !prev;
    });
  };

  //GLOBAL REDUCER----------------
  const initialState: TargetContext = {
    target: TargetEnum.css,
    replayState: false,
    recordState: false,
    replayingButtonEnable: false,
    recordingButtonEnable: false,
    testCaseSize: 0,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  //State for target css or x-path
  const setTarget = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = event.target.value as TargetEnum;
    dispatch({ type: "SET_TARGET", payload: newTarget });
  };

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

  useEffect(() => {
    //handle state change --------------
    const updateStateHandler = (mode: AppMode) => {
      ipcRenderer.send(Channel.TEST_LOG, mode);
      switch (mode) {
        case AppMode.normal:
          setRecordingButtonEnable(!targetContext.recordingButtonEnable);
          //record will be handled in Step view
          setRecordState(false);
          setReplayState(false);
          setEnableSeachBar(true);
          break;
        case AppMode.record:
          setRecordState(!targetContext.recordState);
          setReplayingButtonEnable(false);
          setEnableSeachBar(false);
          break;
        case AppMode.replay:
          setReplayState(!targetContext.replayState);
          setRecordingButtonEnable(false);
          setEnableSeachBar(false);
          break;
        default:
          setRecordState(false);
          setReplayState(false);
          setReplayingButtonEnable(false);
          setRecordingButtonEnable(false);
          setEnableSeachBar(true);
          break;
      }
    };
    const updateState = ipcRenderer.on(
      Channel.UPDATE_STATE,
      updateStateHandler
    );

    return () => {
      updateState();
    };
  }, []);

  // Handle resize-----------------------
  const [leftWidth, setLeftWidth] = useState(350); // Initial width as percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
      console.log(e.clientX);
      const newLeftWidth = e.clientX - containerRect.left;
      const finalLeftWidth = Math.min(
        Math.max(newLeftWidth, 350),
        containerRect.width - 250
      );
      setLeftWidth(finalLeftWidth);
      ipcRenderer.send(Channel.END_RESIZE, finalLeftWidth); // Limit the width between 100px and container width - 100px
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
              <div className="header__wrapper">
                {/* <button>hello</button> */}
              </div>
              <div className="controller__content">
                <div className="commands__wrapper">
                  <div className="commands__wrapper__title">
                    <h3>Commands</h3>
                    <div className="select_box__wrapper">
                      {settingState && (
                        <PopupSettings popupState={setSettingState} />
                      )}
                      <button
                        onClick={() => {
                          setSettingState(!settingState);
                        }}
                      >
                        <span className="material-symbols-rounded">
                          settings
                        </span>
                      </button>
                    </div>
                  </div>
                  <StepsView />
                </div>
                <div
                  className={`controllers__wrapper ${
                    shrink ? "shrink" + " change-padding-bottom" : "expand"
                  }`}
                >
                  <button className="collapse_btn" onClick={handleButtonClick}>
                    {shrink ? "^ Expand" : " v Collapse"}
                  </button>
                  <ControllerItem hide={shrink ? "hide" : ""}></ControllerItem>
                  <ControllerItem hide={shrink ? "hide" : ""}></ControllerItem>
                  <textarea placeholder={"Comment"} />
                </div>
              </div>
            </div>
            <div
              className={`${"draggable_wrapper"} ${
                isDragging ? "dragging" : ""
              }`}
              onMouseDown={handleMouseDown}
            >
              <span className="material-symbols-rounded">drag_handle</span>
            </div>
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

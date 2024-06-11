import React, { useReducer, useRef, useState } from "react";
import {
  ControllerItem,
  HeaderComponent,
  SearchBar,
  StepsView,
} from "./Components";
import Logo from "./Assets/katalon_logo.svg";
import { TargetContext, TargetDispatchContext } from "./Types/targetContext";
import { TargetEnum } from "./Types/eventComponents";
import { targetReducer } from "./Others/reducer";

const App = () => {
  const [shrink, setShrink] = useState(false);
  const [responseMessage, setResponseMessage] = useState(
    "Please enter a link to continue"
  );
  const [enableRecord, setEnableRecord] = useState(false);

  const handleButtonClick = () => {
    setShrink((prev) => {
      return !prev;
    });
  };

  const [state, dispatch] = useReducer(targetReducer, TargetEnum.css);

  function handleChangeTarget(e: React.ChangeEvent<HTMLSelectElement>) {
    dispatch({
      type: "changed",
      targetValue:
        TargetEnum[e.target.value.toLowerCase() as keyof typeof TargetEnum],
    });
  }

  function handleResponse(object: { success: boolean; message: string }) {
    setResponseMessage(object.message);
    setEnableRecord(!object.success);
  }

  const [leftWidth, setLeftWidth] = useState(350); // Initial width as percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      console.log(e.clientX);
      const newLeftWidth = e.clientX - containerRect.left;
      setLeftWidth(Math.min(Math.max(newLeftWidth, 350), containerRect.width)); // Limit the width between 100px and container width - 100px
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="main__wrapper" ref={containerRef}>
      <div
        className="main-content__wrapper"
        style={{ width: `${leftWidth}px` }}
      >
        <div className="header__wrapper">
          {/* <button>hello</button> */}
          <img src={Logo} alt="React Logo" style={{ width: "100px" }} />
          <HeaderComponent enableRecord={enableRecord}></HeaderComponent>
        </div>
        <div className="commands__wrapper">
          <div className="commands__wrapper__title">
            <h3>Commands</h3>
            <div className="select_box__wrapper">
              <p>Target: </p>
              <select
                name="target"
                id="target"
                value={state}
                onChange={(e) => {
                  handleChangeTarget(e);
                }}
              >
                <option value={TargetEnum.css}>{TargetEnum.css}</option>
                <option value={TargetEnum["x-path"]}>
                  {TargetEnum["x-path"]}
                </option>
              </select>
            </div>
          </div>
          <TargetContext.Provider value={state}>
            <TargetDispatchContext.Provider value={dispatch}>
              <StepsView />
            </TargetDispatchContext.Provider>
          </TargetContext.Provider>
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
      <div
        className={`${"draggable_wrapper"} ${isDragging ? "dragging" : ""}`}
        onMouseDown={handleMouseDown}
      >
        <span className="material-symbols-rounded">drag_handle</span>
      </div>
      <div
        className="searchbar__wrapper"
        style={{ width: `${100 - leftWidth}px` }}
      >
        <SearchBar response={handleResponse} />
        <div className="message__wrapper">
          <h2 className="message">{responseMessage}</h2>
        </div>
      </div>
    </div>
  );
};

export default App;

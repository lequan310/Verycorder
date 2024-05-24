import React, { useReducer, useState } from "react";
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

  function handleResponse(object: any) {
    setResponseMessage(object.message);
  }

  return (
    <div className="main__wrapper">
      <div className="searchbar__wrapper">
        <SearchBar response={handleResponse} />
        <div className="message__wrapper">
          <h2 className="message">{responseMessage}</h2>
        </div>
      </div>
      <div className="header__wrapper">
        {/* <button>hello</button> */}
        <img src={Logo} alt="React Logo" style={{ width: "100px" }} />
        <HeaderComponent></HeaderComponent>
      </div>
      <div className="commands__wrapper">
        <div className="commands__wrapper__title">
          <h3>Commands</h3>
          <select
            name="target"
            id="target"
            value={state}
            onChange={(e) => {
              handleChangeTarget(e);
            }}
          >
            <option value={TargetEnum.css}>{TargetEnum.css}</option>
            <option value={TargetEnum["x-path"]}>{TargetEnum["x-path"]}</option>
          </select>
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
  );
};

export default App;

import React, { useState } from "react";
import {
    ControllerItem,
    HeaderComponent,
    SearchBar,
    StepsView,
} from "./Components";
import Logo from "./Assets/katalon_logo.svg";

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
                <h3>Commands</h3>
                <StepsView />
            </div>
            <div
                className={`controllers__wrapper ${shrink ? "shrink" + " change-padding-bottom" : "expand"
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
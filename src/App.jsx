import React from "react";
import { HeaderComponent, StepsView } from "./Components";
import Logo from "./Assets/katalon_logo.svg";

const App = () => {
  return (
    <div className="main__wrapper">
      <div className="header__wrapper">
        {/* <button>hello</button> */}
        <img src={Logo} alt="React Logo" style={{ width: "100px" }} />
        <HeaderComponent></HeaderComponent>
      </div>
      <div className="commands__wrapper">
        <h3>Commands</h3>
        <StepsView />
      </div>
      <div className="controllers__wrapper">Controllers</div>
    </div>
  );
};

export default App;

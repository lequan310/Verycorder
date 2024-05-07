import React from "react";
import { ButtonsView } from "./Components";

const App = () => {
  return (
    <div className="main__wrapper">
      <div className="buttonView__wrapper">
        {/* <button>hello</button> */}
        <ButtonsView></ButtonsView>
      </div>
      <div className="commands__wrapper">Commands</div>
      <div className="controllers__wrapper">Controllers</div>
    </div>
  );
};

export default App;

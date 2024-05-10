import React from "react";
import "./HeaderComponent.css";

const HeaderComponent = () => {
  return (
    <div className="header__container">
      <button>
        <span className="material-symbols-rounded">play_arrow</span>
      </button>
      <button>
        <span className="material-symbols-rounded">radio_button_checked</span>
      </button>
    </div>
  );
};

export default HeaderComponent;

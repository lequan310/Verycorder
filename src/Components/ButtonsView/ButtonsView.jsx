import React from "react";
import "./ButtonsView.css";

const ButtonsView = () => {
  return (
    <div className="buttonView__container">
      <button>
        <span className="material-symbols-rounded">play_arrow</span>
      </button>
      <button>
        <span class="material-symbols-rounded">radio_button_checked</span>
      </button>
    </div>
  );
};

export default ButtonsView;

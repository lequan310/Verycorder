import { useState } from "react";
import "./SizeBar.css";
import PopupSettings from "../PopupSettings/PopupSettings";
const SideBar = () => {
  const [settingState, setSettingState] = useState(false);
  return (
    <div className="sizeBar__wrapper">
      <button>
        <span className="material-symbols-rounded">add</span>
      </button>
      {settingState && <PopupSettings popupState={setSettingState} />}
      <button
        onClick={() => {
          setSettingState(!settingState);
        }}
      >
        <span className="material-symbols-rounded">settings</span>
      </button>
    </div>
  );
};

export default SideBar;

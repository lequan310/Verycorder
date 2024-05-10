import React from "react";

const ControllerItem = ({ hide }) => {
  return (
    <div className={`controllerItem__wrapper + ${hide}`}>
      <h5>Controllers</h5>
      <select>
        <option value="Firefox">Firefox</option>
        <option value="Firefox">Firefox</option>
        <option value="Firefox">Firefox</option>
        <option value="Firefox">Firefox</option>
      </select>
    </div>
  );
};

export default ControllerItem;

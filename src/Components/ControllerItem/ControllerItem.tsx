import React from "react";

const ControllerItem = (props: { hide: string }) => {
  return (
    <div className={`controllerItem__wrapper + ${props.hide}`}>
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

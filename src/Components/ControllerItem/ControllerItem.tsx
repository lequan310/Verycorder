import React from "react";

const ControllerItem = (props: { hide: string | null; title: string }) => {
  return (
    <div className={`controllerItem__wrapper + ${props.hide}`}>
      <h5>{props.title}</h5>
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

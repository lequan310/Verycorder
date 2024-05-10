import React from "react";
import StepItem from "./StepsItem/StepsItem.jsx";
import "./StepsView.css";

const StepsView = () => {
  return (
    <div className="stepview__container">
      <StepItem />
      <StepItem />
    </div>
  );
};

export default StepsView;
import React from "react";
import { TargetEnum } from "./eventComponents";

interface TargetContext {
  target: TargetEnum;
}

export const TargetContext = React.createContext(null);

export const TargetDispatchContext = React.createContext(null);

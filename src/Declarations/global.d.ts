import React from "react";
import { API } from "../Types/apiType";

declare global {
  interface Window {
    api: API;
  }
}

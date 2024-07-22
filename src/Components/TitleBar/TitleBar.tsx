import "./TitleBar.css";
import Logo from "../../Assets/katalon_logo.svg";
import SearchBar from "../SearchBar/SearchBar";

interface TitleBarProps {
  response: (response: { success: boolean; message: string }) => void;
  disable: boolean;
}

const TitleBar = ({ response, disable }: TitleBarProps) => {
  return (
    <div className="titleBar_wrapper">
      {/* <img src={Logo} alt="React Logo" style={{ width: "100px" }} /> */}
      <div className="drag__wrapper"></div>
      <SearchBar response={response} disable={disable} />
      <div className="drag__wrapper min-width-drag"></div>
    </div>
  );
};

export default TitleBar;

import "./TitleBar.css";
import Logo from "../../Assets/katalon_logo.svg";
import SearchBar from "../SearchBar/SearchBar";
import HeaderComponent from "../HeaderComponent/HeaderComponent";

interface TitleBarProps {
  response: (response: { success: boolean; message: string }) => void;
  disable: boolean;
}

const TitleBar = ({ response, disable }: TitleBarProps) => {
  return (
    <div className="titleBar_wrapper">
      <div className="titleBar_right_header">
        {/* <img src={Logo} alt="React Logo" style={{ width: "60px" }} />
        <p>ML Recoder base</p>
        <div className="drag__wrapper fill_gap"></div> */}
      </div>
      <div className="search__wrapper">
        <SearchBar response={response} disable={disable} />
      </div>

      <div className="header_wrapper">
        <div className="drag__wrapper min-width-drag"></div>
        <HeaderComponent />
        <div className="drag__wrapper fill_gap"></div>
      </div>
    </div>
  );
};

export default TitleBar;

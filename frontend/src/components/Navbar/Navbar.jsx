import { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { ThemeContext } from "../context/ThemeContext";
import { getAvatarOption } from "../../utils/avatarOptions";

const Navbar = () => {
  const {
    getTotalCartAmount,
    token,
    setToken,
    setCartItems,
    role,
    setRole,
    userInfo,
    setUserInfo,
  } =
    useContext(StoreContext);

  const { theme, toggleTheme } =
    useContext(ThemeContext);

  const navigate = useNavigate();
  const location = useLocation();
  const currentAvatar = getAvatarOption(userInfo?.avatar);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("userInfo");
    setToken("");
    setCartItems({});
    setRole("user");
    setUserInfo(null);
    navigate("/");
  };

  return (
    <div className="navbar">
      <Link to="/" tabIndex={-1}>
        <img src={assets.logo} alt="" className="logo" tabIndex={-1} />
      </Link>

      <ul className="navbar-menu">
        <Link to="/" tabIndex={-1} className={location.pathname === "/" ? "active" : ""}>home</Link>
        <Link to="/menu" tabIndex={-1} className={location.pathname === "/menu" ? "active" : ""}>menu</Link>
        <a href={location.pathname === "/" ? "#app-download" : "/#app-download"} tabIndex={-1}>mobile-app</a>
        <a href={location.pathname === "/" ? "#footer" : "/#footer"} tabIndex={-1}>contact us</a>
      </ul>

      <div className="navbar-right">
        {/* 🌙 Theme Toggle */}
        <button
          className="theme-toggle"
          tabIndex={-1}
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <div className="navbar-search-icon">
          <Link to="/cart" tabIndex={-1}>
            <img src={assets.basket_icon} alt="" tabIndex={-1} />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"} />
        </div>

        <div className="navbar-profile">
          <div
            className="navbar-avatar"
            style={{ background: currentAvatar.gradient }}
            tabIndex={-1}
            aria-hidden="true"
          >
            <span>{currentAvatar.emoji}</span>
          </div>
          <ul className="nav-profile-dropdown">
            <li onClick={() => navigate("/myorders")}>
              <img src={assets.bag_icon} alt="" />
              <p>Orders</p>
            </li>
            <hr />
            <li onClick={logout}>
              <img src={assets.logout_icon} alt="" />
              <p>Logout</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

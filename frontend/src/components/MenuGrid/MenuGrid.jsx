import PropTypes from "prop-types";

const MenuGrid = ({ children }) => {
  return <div className="menu-grid">{children}</div>;
};

MenuGrid.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MenuGrid;

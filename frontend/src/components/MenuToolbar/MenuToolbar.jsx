import PropTypes from "prop-types";

const MenuToolbar = ({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="menu-toolbar">
      <div className="menu-toolbar-copy">
        <p className="menu-eyebrow">Dynamic Menu</p>
        <h1>Browse the full digital menu</h1>
        <p>
          Explore dishes, search by name, and filter by category without leaving the current site style.
        </p>
      </div>

      <div className="menu-toolbar-controls">
        <label className="menu-search">
          <span className="sr-only">Search menu items</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search dishes, categories, or flavours"
          />
        </label>

        <div className="menu-categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "active" : ""}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

MenuToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};

export default MenuToolbar;

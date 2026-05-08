import { useContext, useEffect, useMemo, useState } from "react";
import MenuToolbar from "../../components/MenuToolbar/MenuToolbar";
import MenuGrid from "../../components/MenuGrid/MenuGrid";
import MenuCard from "../../components/MenuCard/MenuCard";
import { StoreContext } from "../../components/context/StoreContext";
import useMockMenu from "../../hooks/useMockMenu";
import "./Menu.css";

const Menu = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { registerDynamicFoods } = useContext(StoreContext);
  const { items, loading, error, categories, isConfigured } = useMockMenu();

  useEffect(() => {
    registerDynamicFoods(items);
  }, [items, registerDynamicFoods]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, categories]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, searchQuery]);

  return (
    <section className="menu-page">
      <MenuToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {loading ? (
        <div className="menu-state">
          <div className="menu-spinner" />
          <p>Loading menu items...</p>
        </div>
      ) : error ? (
        <div className="menu-state menu-state-error">
          <h3>Unable to load the menu</h3>
          <p>{error}</p>
        </div>
      ) : !isConfigured ? (
        <div className="menu-state">
          <h3>Menu API not configured yet</h3>
          <p>Set `VITE_MENU_API_URL` with your MockAPI endpoint to populate this page.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="menu-state">
          <h3>No dishes match your filters</h3>
          <p>Try another category or clear the search to see more menu items.</p>
        </div>
      ) : (
        <MenuGrid>
          {filteredItems.map((item) => (
            <MenuCard key={item._id} item={item} />
          ))}
        </MenuGrid>
      )}
    </section>
  );
};

export default Menu;

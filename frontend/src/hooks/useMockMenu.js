import { useEffect, useMemo, useState } from "react";

const FALLBACK_API_URL = "PASTE_MY_API_URL_HERE";

const inferVeg = (item) => {
  const explicitValue = item.isVeg ?? item.veg ?? item.vegetarian ?? item.isVegetarian;
  if (typeof explicitValue === "boolean") {
    return explicitValue;
  }

  const text = `${item.name || item.title || ""} ${item.category || item.type || ""}`.toLowerCase();
  const nonVegKeywords = ["chicken", "mutton", "fish", "egg", "beef", "prawn", "shrimp", "meat"];
  return !nonVegKeywords.some((keyword) => text.includes(keyword));
};

const normalizeMenuItem = (item, index) => {
  const ratingValue = Number(item.rating ?? item.stars ?? item.review ?? 4.2);
  const priceValue = Number(item.price ?? item.cost ?? item.amount ?? item.rate ?? 0);

  return {
    _id: `mock-${item.id ?? index}`,
    name: item.name || item.title || `Menu Item ${index + 1}`,
    image:
      item.image ||
      item.imageUrl ||
      item.thumbnail ||
      item.photo ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    price: Number.isFinite(priceValue) && priceValue > 0 ? priceValue : 199,
    rating: Number.isFinite(ratingValue) ? Math.min(5, Math.max(1, ratingValue)) : 4.2,
    category: item.category || item.type || item.cuisine || "Chef Specials",
    isVeg: inferVeg(item),
    description:
      item.description ||
      item.subtitle ||
      "Freshly prepared dish from our rotating digital menu.",
  };
};

const useMockMenu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_MENU_API_URL || FALLBACK_API_URL;
  const isConfigured = apiUrl && apiUrl !== FALLBACK_API_URL;

  useEffect(() => {
    let isActive = true;

    const loadMenu = async () => {
      if (!isConfigured) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Unable to load menu data");
        }

        const data = await response.json();
        const source = Array.isArray(data) ? data : data.items || data.data || [];
        const normalized = source.map(normalizeMenuItem);

        if (isActive) {
          setItems(normalized);
        }
      } catch (fetchError) {
        if (isActive) {
          setError(fetchError.message || "Unable to load menu");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      isActive = false;
    };
  }, [apiUrl, isConfigured]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(items.map((item) => item.category).filter(Boolean));
    return ["All", ...Array.from(uniqueCategories)];
  }, [items]);

  return {
    items,
    loading,
    error,
    categories,
    isConfigured,
    apiUrl,
  };
};

export default useMockMenu;

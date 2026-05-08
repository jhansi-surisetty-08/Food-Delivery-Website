import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { food_list as initialFoodList } from "../../assets/assets";
import { fetchFoodFromAPI } from "../../utils/mealdbAPI";

export const StoreContext = createContext(null);

const DYNAMIC_FOOD_STORAGE_KEY = "dynamic-food-catalog";

const readDynamicFoods = () => {
  try {
    const raw = localStorage.getItem(DYNAMIC_FOOD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log("Dynamic food catalog restore failed", error);
    return [];
  }
};

const persistDynamicFoods = (items) => {
  try {
    localStorage.setItem(DYNAMIC_FOOD_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.log("Dynamic food catalog persist failed", error);
  }
};

const mergeFoodLists = (baseList, nextList) => {
  const map = new Map(baseList.map((item) => [item._id, item]));
  nextList.forEach((item) => {
    map.set(item._id, { ...map.get(item._id), ...item });
  });
  return Array.from(map.values());
};

const baseFoodIds = new Set(initialFoodList.map((item) => item._id));

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});

  const enrichFoods = (list) => {
    return list.map((item, idx) => ({
      ...item,
      rating: item.rating ?? (Math.floor(Math.random() * 3) + 3),
      quantity: item.quantity ?? (Math.floor(Math.random() * 50) + 1),
      createdAt: item.createdAt ?? new Date(Date.now() - idx * 86400000).toISOString(),
    }));
  };

  const [foodList, setFoodList] = useState(enrichFoods(initialFoodList));
  const [filteredFoodList, setFilteredFoodList] = useState(enrichFoods(initialFoodList));
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const url = import.meta.env.VITE_API_URL || "http://localhost:4001";
  const [token, setToken] = useState("");
  const [role, setRole] = useState("user");

  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    if (token) {
      await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      );
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = foodList.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchFoodList = async () => {
    try {
      await axios.get(url + "/api/food/list");
    } catch (error) {
      console.log("Backend food list not available, using default");
    }
  };

  const loadCartData = async (activeToken) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token: activeToken } }
      );
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.log("Cart data fetch failed");
    }
  };

  const loadAdditionalFoods = async () => {
    try {
      setIsLoadingAPI(true);
      const apiFoods = await fetchFoodFromAPI(15);
      const savedDynamicFoods = readDynamicFoods();

      if (apiFoods && apiFoods.length > 0) {
        const enrichedBase = enrichFoods(initialFoodList);
        const enrichedApi = enrichFoods(apiFoods);
        const combinedFoodList = [...enrichedBase, ...enrichedApi];
        setFoodList(mergeFoodLists(combinedFoodList, savedDynamicFoods));
        setFilteredFoodList(combinedFoodList);
      } else {
        const enrichedBase = enrichFoods(initialFoodList);
        setFoodList(mergeFoodLists(enrichedBase, savedDynamicFoods));
        setFilteredFoodList(enrichedBase);
      }
    } catch (error) {
      console.error("Error loading additional foods:", error);
      const enrichedBase = enrichFoods(initialFoodList);
      setFoodList(mergeFoodLists(enrichedBase, readDynamicFoods()));
      setFilteredFoodList(enrichedBase);
    } finally {
      setIsLoadingAPI(false);
    }
  };

  const registerDynamicFoods = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) {
      return;
    }

    const normalizedItems = items.map((item) => ({
      ...item,
      rating: item.rating ?? 4.2,
      quantity: item.quantity ?? 1,
      createdAt: item.createdAt ?? new Date().toISOString(),
    }));

    setFoodList((previous) => {
      const merged = mergeFoodLists(previous, normalizedItems);
      const dynamicFoods = merged.filter((item) => !baseFoodIds.has(item._id));
      persistDynamicFoods(dynamicFoods);
      return merged;
    });
  }, []);

  const setSearchFilters = (filtered) => {
    setFilteredFoodList(filtered);
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await loadAdditionalFoods();
    }
    loadData();
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    const savedRole = localStorage.getItem("role") || sessionStorage.getItem("role") || "user";
    const savedUserInfo = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole);
      if (savedUserInfo) {
        try {
          setUserInfo(JSON.parse(savedUserInfo));
        } catch {
          setUserInfo(null);
        }
      }
      loadCartData(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadCartData(token);
      return;
    }
    setCartItems({});
  }, [token]);

  const contextValue = {
    food_list: filteredFoodList,
    allFoods: foodList,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    role,
    setRole,
    userInfo,
    setUserInfo,
    setSearchFilters,
    isLoadingAPI,
    registerDynamicFoods,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;

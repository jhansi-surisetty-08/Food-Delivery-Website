import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import PropTypes from "prop-types";
import "./Categories.css";

const Categories = ({ url }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(null);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    }
  }, [url]);

  const addCategory = async (event) => {
    event.preventDefault();
    if (!name.trim() || !icon) {
      toast.error("Category name and icon are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("icon", icon);

    try {
      const response = await axios.post(`${url}/api/category/add`, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setName("");
        setIcon(null);
        loadCategories();
      } else {
        toast.error(response.data.message || "Add failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Add failed");
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditName(category.name);
    setEditIcon(null);
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", editName.trim());
    if (editIcon) formData.append("icon", editIcon);

    try {
      const response = await axios.post(`${url}/api/category/update/${editingId}`, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setEditingId("");
        setEditName("");
        setEditIcon(null);
        loadCategories();
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  const removeCategory = async (id) => {
    try {
      const response = await axios.post(`${url}/api/category/remove`, { id });
      if (response.data.success) {
        toast.success(response.data.message);
        loadCategories();
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(text));
  }, [categories, query]);

  return (
    <div className="categories add flex-col">
      <h3>Category Management</h3>

      <form className="category-form" onSubmit={addCategory}>
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="cat-icon" className="category-icon-upload">
          <img src={icon ? URL.createObjectURL(icon) : assets.upload_area} alt="" />
        </label>
        <input
          id="cat-icon"
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => setIcon(e.target.files?.[0] || null)}
        />
        <button type="submit">Add Category</button>
      </form>

      <input
        className="category-search"
        type="text"
        placeholder="Search categories"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="category-list">
        {filteredCategories.map((category) => (
          <div className="category-row" key={category._id}>
            <img src={`${url}/images/${category.icon}`} alt="" />
            <p>{category.name}</p>
            <div className="category-actions">
              <button type="button" onClick={() => startEdit(category)}>Edit</button>
              <button type="button" className="danger" onClick={() => removeCategory(category._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editingId ? (
        <form className="category-edit" onSubmit={saveEdit}>
          <h4>Edit Category</h4>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Category name"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setEditIcon(e.target.files?.[0] || null)}
          />
          <div className="category-actions">
            <button type="submit">Save</button>
            <button type="button" className="danger" onClick={() => setEditingId("")}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

Categories.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Categories;

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import "./Users.css";

const Users = ({ url }) => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/user/list`);
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load users");
    }
  }, [url]);

  const toggleBan = async (id) => {
    try {
      const response = await axios.post(`${url}/api/user/ban-toggle`, { id });
      if (response.data.success) {
        toast.success(response.data.message);
        loadUsers();
      } else {
        toast.error(response.data.message || "Action failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed");
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await axios.post(`${url}/api/user/remove`, { id });
      if (response.data.success) {
        toast.success(response.data.message);
        loadUsers();
      } else {
        toast.error(response.data.message || "Delete failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(text) ||
        u.email.toLowerCase().includes(text)
    );
  }, [users, query]);

  return (
    <div className="users add flex-col">
      <h3>User Management</h3>
      <input
        className="users-search"
        type="text"
        placeholder="Search users by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="users-table">
        <div className="users-row users-title">
          <b>Name</b>
          <b>Email</b>
          <b>Status</b>
          <b>Joined</b>
          <b>Actions</b>
        </div>

        {filteredUsers.map((user) => (
          <div key={user._id} className="users-row">
            <p>{user.name}</p>
            <p>{user.email}</p>
            <p>{user.isBanned ? "Banned" : "Active"}</p>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
            <div className="users-actions">
              <button type="button" onClick={() => toggleBan(user._id)}>
                {user.isBanned ? "Unban" : "Ban"}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => deleteUser(user._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Users.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Users;

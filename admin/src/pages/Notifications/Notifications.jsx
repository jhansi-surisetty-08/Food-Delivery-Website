import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import "./Notifications.css";

const Notifications = ({ url }) => {
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", message: "", type: "offer" });

  const loadNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/notification/list`);
      if (response.data.success) {
        setList(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load notifications");
    }
  }, [url]);

  const sendNotification = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${url}/api/notification/send`, form);
      if (response.data.success) {
        toast.success(response.data.message);
        setForm({ title: "", message: "", type: "offer" });
        loadNotifications();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return list;
    return list.filter((n) => n.title.toLowerCase().includes(text) || n.message.toLowerCase().includes(text));
  }, [list, query]);

  return (
    <div className="notifications add flex-col">
      <h3>Notifications</h3>

      <form className="notify-form" onSubmit={sendNotification}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          required
        />
        <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
          <option value="offer">Send offer notification</option>
          <option value="new-item">New item alert</option>
          <option value="festival">Festival discount message</option>
        </select>
        <textarea
          rows="3"
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          required
        />
        <button type="submit">Send</button>
      </form>

      <input
        className="notify-search"
        type="text"
        placeholder="Search notifications"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="notify-list">
        {filtered.map((n) => (
          <div key={n._id} className="notify-card">
            <p className="notify-type">{n.type}</p>
            <h4>{n.title}</h4>
            <p>{n.message}</p>
            <small>{new Date(n.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

Notifications.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Notifications;

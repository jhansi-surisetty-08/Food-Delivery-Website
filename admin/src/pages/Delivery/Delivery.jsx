import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import "./Delivery.css";

const Delivery = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState([]);
  const [query, setQuery] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    }
  }, [url]);

  const loadStats = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/order/delivery-stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load delivery stats");
    }
  }, [url]);

  const assignDelivery = async (orderId, deliveryBoyName, deliveryBoyPhone) => {
    try {
      const response = await axios.post(`${url}/api/order/assign-delivery`, {
        orderId,
        deliveryBoyName,
        deliveryBoyPhone,
      });
      if (response.data.success) {
        toast.success("Assigned successfully");
        loadOrders();
        loadStats();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Assignment failed");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const response = await axios.post(`${url}/api/order/status`, { orderId, status });
      if (response.data.success) {
        toast.success("Status updated");
        loadOrders();
        loadStats();
      }
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [loadOrders, loadStats]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(text) ||
        (o.deliveryBoyName || "").toLowerCase().includes(text)
    );
  }, [orders, query]);

  return (
    <div className="delivery add flex-col">
      <h3>Delivery Management</h3>

      <input
        className="delivery-search"
        type="text"
        placeholder="Search order number or delivery boy"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="delivery-table">
        <div className="delivery-row delivery-title">
          <b>Order #</b>
          <b>Customer</b>
          <b>Status</b>
          <b>Assign Delivery Boy</b>
          <b>Update</b>
        </div>
        {filtered.map((order) => (
          <div className="delivery-row" key={order._id}>
            <p>{order.orderNumber}</p>
            <p>{order.address?.firstName} {order.address?.lastName}</p>
            <p>{order.status}</p>
            <div className="assign-box">
              <input id={`name-${order._id}`} placeholder="Boy name" defaultValue={order.deliveryBoyName || ""} />
              <input id={`phone-${order._id}`} placeholder="Phone" defaultValue={order.deliveryBoyPhone || ""} />
              <button
                type="button"
                onClick={() => {
                  const name = document.getElementById(`name-${order._id}`)?.value || "";
                  const phone = document.getElementById(`phone-${order._id}`)?.value || "";
                  assignDelivery(order._id, name, phone);
                }}
              >Assign</button>
            </div>
            <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}>
              <option value="Order Placed">Order Placed</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>

      <div className="delivery-stats">
        <h4>Completed Deliveries Count</h4>
        {stats.length ? (
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.deliveryBoyName} className="stats-card">
                <p>{s.deliveryBoyName}</p>
                <h3>{s.completedDeliveries}</h3>
              </div>
            ))}
          </div>
        ) : (
          <p>No completed deliveries yet.</p>
        )}
      </div>
    </div>
  );
};

Delivery.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Delivery;

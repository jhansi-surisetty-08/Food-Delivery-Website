import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import "./Dashboard.css";

const Dashboard = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    kpis: {
      totalOrders: 0,
      totalRevenue: 0,
      totalUsers: 0,
      pendingDeliveries: 0,
    },
    topSellingFoods: [],
    recentOrders: [],
  });

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${url}/api/admin/dashboard`);
      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <div className="dashboard add">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard add">
      <h2>Admin Dashboard</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p>Total Orders</p>
          <h3>{dashboard.kpis.totalOrders}</h3>
        </div>
        <div className="kpi-card">
          <p>Total Revenue</p>
          <h3>₹{Number(dashboard.kpis.totalRevenue || 0).toLocaleString()}</h3>
        </div>
        <div className="kpi-card">
          <p>Total Users</p>
          <h3>{dashboard.kpis.totalUsers}</h3>
        </div>
        <div className="kpi-card">
          <p>Pending Deliveries</p>
          <h3>{dashboard.kpis.pendingDeliveries}</h3>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="panel">
          <div className="panel-header">
            <h3>Top Selling Foods</h3>
          </div>
          <div className="panel-body">
            {dashboard.topSellingFoods.length ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Qty Sold</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topSellingFoods.map((food) => (
                    <tr key={food.foodName}>
                      <td>{food.foodName}</td>
                      <td>{food.totalQuantity}</td>
                      <td>₹{Number(food.totalSales || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No sales data available.</p>
            )}
          </div>
        </div>

        <div className="panel panel-wide">
          <div className="panel-header">
            <h3>Recent Orders</h3>
          </div>
          <div className="panel-body">
            {dashboard.recentOrders.length ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrders.map((order) => (
                    <tr key={order.orderNumber}>
                      <td>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>₹{order.amount}</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{new Date(order.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Dashboard;

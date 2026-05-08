import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Reports.css";

const Reports = ({ url }) => {
  const [reports, setReports] = useState({
    dailyOrders: [],
    monthlyRevenue: [],
    topProducts: [],
    peakOrderingTimes: [],
  });

  const loadReports = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/admin/reports`);
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, [url]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="reports add flex-col">
      <h3>Reports & Analytics</h3>

      <div className="report-grid">
        <div className="report-card">
          <h4>Daily Orders</h4>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reports.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h4>Monthly Revenue</h4>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reports.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <h4>Top Products</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                </tr>
              </thead>
              <tbody>
                {reports.topProducts.map((p) => (
                  <tr key={p.product}>
                    <td>{p.product}</td>
                    <td>{p.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-card">
          <h4>Peak Ordering Times</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {reports.peakOrderingTimes.map((p) => (
                  <tr key={p.hour}>
                    <td>{p.hour}</td>
                    <td>{p.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

Reports.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Reports;

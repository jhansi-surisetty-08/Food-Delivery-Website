import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentFailed.css";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;
  const reason = location.state?.reason || "Payment failed. Please try again.";

  return (
    <div className="payment-failed">
      <div className="payment-failed-card">
        <h2>Payment Failed</h2>
        <p>{reason}</p>
        {orderId ? <p className="payment-order-id">Order ID: {orderId}</p> : null}
        <div className="payment-actions">
          <button onClick={() => navigate("/order")}>Try Again</button>
          <button className="secondary" onClick={() => navigate("/myorders")}>
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;

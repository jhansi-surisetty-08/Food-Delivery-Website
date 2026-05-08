import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="payment-success">
      <div className="payment-success-card">
        <h2>Payment Successful</h2>
        <p>Your order has been placed successfully.</p>
        {orderId ? <p className="payment-order-id">Order ID: {orderId}</p> : null}
        <div className="payment-actions">
          <button onClick={() => navigate("/myorders")}>Track Order</button>
          <button className="secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

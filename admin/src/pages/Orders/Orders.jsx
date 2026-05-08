import React from 'react'
import './Orders.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { assets } from './../../../../frontend/src/assets/assets';

const Orders = ({url}) => {

  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [driverData, setDriverData] = useState({ orderId: "", lat: "", lng: "", etaMinutes: "" })
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchAllOrders = async () =>{
    const response = await axios.get(url+"/api/order/list");
    if(response.data.success){
      setOrders(response.data.data);
      console.log(response.data.data);
    }else{
      toast.error("Error")
    }
  }

  const fetchPayments = async () => {
    const response = await axios.get(url + "/api/order/payments");
    if (response.data.success) {
      setPayments(response.data.data);
    }
  }

  const statusHandler = async (event,orderId) =>{
    const response = await axios.post(url+"/api/order/status",{
      orderId,
      status:event.target.value
    })
    if(response.data.success){
      await fetchAllOrders();
    }
  }

  const sendDriverLocation = async (event) => {
    event.preventDefault();
    if (!driverData.orderId || driverData.lat === "" || driverData.lng === "") {
      toast.error("Order ID, lat, lng required");
      return;
    }
    const payload = {
      orderId: driverData.orderId,
      lat: Number(driverData.lat),
      lng: Number(driverData.lng),
      etaMinutes: driverData.etaMinutes ? Number(driverData.etaMinutes) : undefined
    };
    const response = await axios.post(url + "/api/order/location", payload);
    if (response.data.success) {
      toast.success("Driver location updated");
      setDriverData({ orderId: "", lat: "", lng: "", etaMinutes: "" });
    } else {
      toast.error("Failed to update driver location");
    }
  }

  useEffect(()=>{
    fetchAllOrders()
    fetchPayments()
  },[])
  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <form className="driver-sim" onSubmit={sendDriverLocation}>
        <h4>Driver Simulator</h4>
        <div className="driver-fields">
          <input
            type="text"
            placeholder="Order ID"
            value={driverData.orderId}
            onChange={(e) => setDriverData({ ...driverData, orderId: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={driverData.lat}
            onChange={(e) => setDriverData({ ...driverData, lat: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={driverData.lng}
            onChange={(e) => setDriverData({ ...driverData, lng: e.target.value })}
          />
          <input
            type="number"
            placeholder="ETA (min)"
            value={driverData.etaMinutes}
            onChange={(e) => setDriverData({ ...driverData, etaMinutes: e.target.value })}
          />
        </div>
        <button type="submit">Send Location</button>
      </form>
      <div className="order-list">
        {orders.map((order, index)=>(
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item,index)=>{
                  if(index===order.items.length-1){
                    return item.name + " x " + item.quantity
                  }else{
                    return item.name + " x " + item.quantity + " , "
                  }
                })}
              </p>
              <p className="order-item-name">{order.address.firstName + " "+order.address.lastName}</p>
              <div className="order-item-address">
                <p>{order.address.state + ","}</p>
                <p>{order.address.city+" ,"+ order.address.state+" ,"+order.address.country+" ,"+order.address.zipcode}</p>
              </div>
              <p className='order-item-phone'>{order.address.phone}</p>
              <p className='payment-status-row'>
                Payment:
                <span className={`payment-badge ${order.paymentStatus || 'pending'}`}>
                  {order.paymentStatus || 'pending'}
                </span>
              </p>
            </div>
            <p>Itmes: {order.items.length}</p>
            <p>₹{order.amount}</p>
            <div className='order-actions'>
              <select onChange={(event)=> statusHandler(event,order._id)} value={order.status} >
                <option value="Order Placed">Order Placed</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button type='button' className='details-btn' onClick={() => setSelectedOrder(order)}>Details</button>
            </div>
          </div>
        ))}
      </div>
      <div className="payment-list">
        <h3>Razorpay Test Payments</h3>
        {payments.map((pay) => (
          <div className="payment-item" key={pay._id}>
            <p>Order: {pay.orderId}</p>
            <p>Payment ID: {pay.paymentId || "N/A"}</p>
            <p>Razorpay Order: {pay.razorpayOrderId || "N/A"}</p>
            <p>Amount: ₹{pay.amount}</p>
            <p>Status: {pay.status}</p>
            <p>{new Date(pay.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {selectedOrder ? (
        <div className='order-modal-overlay' onClick={() => setSelectedOrder(null)}>
          <div className='order-modal' onClick={(e) => e.stopPropagation()}>
            <div className='order-modal-header'>
              <h3>Order Details</h3>
              <button type='button' onClick={() => setSelectedOrder(null)}>X</button>
            </div>

            <div className='order-modal-grid'>
              <p><b>Order #:</b> {selectedOrder.orderNumber}</p>
              <p><b>Status:</b> {selectedOrder.status}</p>
              <p><b>Payment:</b> {selectedOrder.paymentStatus || 'pending'}</p>
              <p><b>Amount:</b> ₹{selectedOrder.amount}</p>
              <p><b>Customer:</b> {selectedOrder.address.firstName} {selectedOrder.address.lastName}</p>
              <p><b>Phone:</b> {selectedOrder.address.phone}</p>
            </div>

            <div className='order-modal-section'>
              <h4>Delivery Address</h4>
              <p>
                {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state}, {selectedOrder.address.country} - {selectedOrder.address.zipcode}
              </p>
            </div>

            <div className='order-modal-section'>
              <h4>Items</h4>
              <ul>
                {selectedOrder.items.map((item, idx) => (
                  <li key={`${item.name}-${idx}`}>{item.name} x {item.quantity}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Orders

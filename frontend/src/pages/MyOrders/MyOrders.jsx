import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import { assets } from './../../assets/assets';
import { io } from 'socket.io-client';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MyOrders = () => {

const {url, token} = useContext(StoreContext);
const [data, setData] = useState([]);
const [expandedOrderId, setExpandedOrderId] = useState(null);
const [transactions, setTransactions] = useState([]);
const socketRef = useRef(null);

const DEFAULT_HUB_LOCATION = { lat: 12.9716, lng: 77.5946 };
const DELIVERY_CREW = [
  { id: 'd1', name: 'Ravi', vehicle: 'Bike', offsetLat: 0.0023, offsetLng: 0.0014 },
  { id: 'd2', name: 'Akash', vehicle: 'Scooter', offsetLat: -0.0016, offsetLng: 0.0022 },
  { id: 'd3', name: 'Irfan', vehicle: 'Van', offsetLat: 0.0011, offsetLng: -0.0025 },
];

const deliveryVehicleIcon = L.divIcon({
  className: 'delivery-vehicle-icon',
  html: '<span class="delivery-vehicle-emoji">🚚</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destinationIcon = L.divIcon({
  className: 'delivery-destination-icon',
  html: '<span class="delivery-destination-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const trackingSteps = useMemo(() => ([
  { value: "Order Placed", label: "Order placed" },
  { value: "Accepted", label: "Accepted" },
  { value: "Preparing", label: "Preparing" },
  { value: "Out for Delivery", label: "Out for delivery" },
  { value: "Delivered", label: "Delivered" },
]), []);

const normalizeStatus = (status) => (status || "").toLowerCase();

const getStatusIndex = (status) => {
  const normalized = normalizeStatus(status);
  const index = trackingSteps.findIndex(
    step => step.value.toLowerCase() === normalized
  );
  if (index !== -1) return index;

  if (normalized === "food processing") return 2;
  if (normalized === "out for delivery") return 3;
  return 0;
};

const fetchOrders = async () =>{
    const response = await axios.post(url+'/api/order/userorders',{},{headers:{token}})
    if (response.data.success) {
      setData(response.data.data);
    }
}

const fetchTransactions = async () => {
  const response = await axios.get(url + "/api/order/transactions", { headers: { token } });
  if (response.data.success) {
    setTransactions(response.data.data);
  }
}

const fetchOrderById = async (orderId) => {
  const response = await axios.get(url+`/api/order/track/${orderId}`,{headers:{token}})
  if (response.data.success) {
    const updated = response.data.data;
    setData(prev => prev.map(order => (order._id === updated._id ? updated : order)));
  }
}

useEffect(()=>{
    if(token){
        fetchOrders();
        fetchTransactions();
    }
},[token])

useEffect(() => {
  if (!token || socketRef.current) return;
  const socket = io(url, { transports: ["websocket"] });
  socketRef.current = socket;

  socket.on("order:update", (updatedOrder) => {
    if (!updatedOrder?._id) return;
    setData(prev => prev.map(order => (order._id === updatedOrder._id ? updatedOrder : order)));
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [token, url]);

useEffect(() => {
  if (!expandedOrderId) return;
  fetchOrderById(expandedOrderId);
  const socket = socketRef.current;
  if (socket) {
    socket.emit("order:join", expandedOrderId);
  }
  return () => {
    if (socket) socket.emit("order:leave", expandedOrderId);
  };
}, [expandedOrderId]);

const toggleTracking = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
}

const getEtaText = (order) => {
  if (!order?.etaMinutes || !order?.date) return "ETA: TBD";
  const etaMs = order.etaMinutes * 60000;
  const etaTime = new Date(new Date(order.date).getTime() + etaMs);
  return `ETA: ${etaTime.toLocaleTimeString()}`;
}

const getCrewForOrder = (order) => {
  const baseLocation = order?.deliveryLocation?.lat && order?.deliveryLocation?.lng
    ? order.deliveryLocation
    : DEFAULT_HUB_LOCATION;

  return DELIVERY_CREW.map((person) => ({
    ...person,
    lat: baseLocation.lat + person.offsetLat,
    lng: baseLocation.lng + person.offsetLng,
  }));
}

  return (
    <div className='my-orders'>
        <h2>My Orders</h2>
        <div className="container">
            {data.map((order, index)=>{
                    const statusIndex = getStatusIndex(order.status);
                    const mapCenter = order.deliveryLocation?.lat && order.deliveryLocation?.lng
                      ? order.deliveryLocation
                      : DEFAULT_HUB_LOCATION;
                    const crew = getCrewForOrder(order);
                    return (
                        <div key={order._id || index} className="my-orders-order">
                            <img src={assets.parcel_icon} alt="" />
                            <p>{order.items.map((item, itemIndex)=>{
                                if(itemIndex === order.items.length-1){
                                    return item.name+" x "+item.quantity
                                }else{
                                    return item.name+" x "+item.quantity + ","
                                }
                            })}</p>
                            <p>₹{order.amount}.00</p>
                            <p>Items: {order.items.length}</p>
                            <p><span>&#x25cf;</span><b>{order.status}</b></p>
                            <button onClick={() => toggleTracking(order._id)}>
                              {expandedOrderId === order._id ? "Hide Tracking" : "Track Order"}
                            </button>
                            {expandedOrderId === order._id && (
                              <div className="order-tracking">
                                <div className="tracking-header">
                                  <div>
                                    <p className="tracking-title">Tracking</p>
                                    <p className="tracking-sub">Order ID: {order.orderNumber || order._id}</p>
                                  </div>
                                  <button className="tracking-refresh" onClick={() => fetchOrderById(order._id)} type="button">
                                    Refresh status
                                  </button>
                                </div>
                                <div className="tracking-meta">
                                  <span>Placed: {new Date(order.date).toLocaleString()}</span>
                                  <span>{getEtaText(order)}</span>
                                </div>
                                <div className="tracking-progress">
                                  <div className="tracking-bar">
                                    <span style={{ width: `${(statusIndex / (trackingSteps.length - 1)) * 100}%` }} />
                                  </div>
                                  <div className="tracking-steps">
                                    {trackingSteps.map((step, stepIndex) => {
                                      const state =
                                        stepIndex < statusIndex
                                          ? "complete"
                                          : stepIndex === statusIndex
                                          ? "current"
                                          : "upcoming";
                                      return (
                                        <div key={step.value} className={`tracking-step ${state}`}>
                                          <span className="tracking-dot" />
                                          <span className="tracking-label">{step.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="tracking-map">
                                  <MapContainer
                                    center={[mapCenter.lat, mapCenter.lng]}
                                    zoom={14}
                                    scrollWheelZoom={false}
                                    className="tracking-leaflet-map"
                                  >
                                    <TileLayer
                                      attribution='&copy; OpenStreetMap contributors'
                                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker
                                      position={[mapCenter.lat, mapCenter.lng]}
                                      icon={destinationIcon}
                                    >
                                      <Popup>Delivery destination</Popup>
                                    </Marker>
                                    {crew.map((person) => (
                                      <Marker
                                        key={`${order._id}-${person.id}`}
                                        position={[person.lat, person.lng]}
                                        icon={deliveryVehicleIcon}
                                      >
                                        <Popup>{person.name} - {person.vehicle}</Popup>
                                      </Marker>
                                    ))}
                                  </MapContainer>
                                  {!order.deliveryLocation?.lat || !order.deliveryLocation?.lng ? (
                                    <p className="tracking-map-empty">Using default zone location until driver GPS is available.</p>
                                  ) : null}
                                </div>
                              </div>
                            )}
                        </div>
                    )
            })}
        </div>
        {transactions.length ? (
          <div className="transactions">
            <h3>Transaction History</h3>
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div className="transaction-item" key={tx._id}>
                  <p>Payment ID: {tx.paymentId || "N/A"}</p>
                  <p>Order ID: {tx.orderId}</p>
                  <p>Amount: ₹{tx.amount}</p>
                  <p>Status: {tx.status}</p>
                  <p>{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
    </div>
  )
}

export default MyOrders

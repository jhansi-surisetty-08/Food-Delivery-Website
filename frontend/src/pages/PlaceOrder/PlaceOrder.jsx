import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../components/context/StoreContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const {getTotalCartAmount, token, allFoods, cartItems, url} = useContext(StoreContext);

  const [data, setData] = useState({
    firstName:"",
    lastName:"",
    email:"",
    street:"",
    city:"",
    state:"",
    zipcode:"",
    country:"",
    phone:""
  });
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);

  const onChangeHandler = (event) =>{
    const name = event.target.name;
    const value = event.target.value;
    setData(data =>({...data,[name]:value}))
  }

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const openRazorpayCheckout = async (paymentData) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentError("Failed to load payment gateway");
      setIsPaying(false);
      return;
    }

    const options = {
      key: paymentData.key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: "Food Delivery",
      description: "Order Payment",
      order_id: paymentData.razorpayOrderId,
      handler: async (res) => {
        try {
          const verifyResponse = await axios.post(
            url + "/api/order/verify",
            {
              orderId: paymentData.orderId,
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
            },
            { headers: { token } }
          );
          if (verifyResponse.data.success) {
            navigate("/payment-success", { state: { orderId: paymentData.orderId } });
          } else {
            navigate("/payment-failed", { state: { orderId: paymentData.orderId, reason: verifyResponse.data.message || "Payment verification failed" } });
          }
        } catch (err) {
          navigate("/payment-failed", { state: { orderId: paymentData.orderId, reason: "Payment verification failed" } });
        } finally {
          setIsPaying(false);
        }
      },
      prefill: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        contact: data.phone,
      },
      modal: {
        ondismiss: async () => {
          try {
            await axios.post(
              url + "/api/order/payment-failed",
              {
                orderId: paymentData.orderId,
                razorpay_order_id: paymentData.razorpayOrderId,
                reason: "Payment cancelled by user",
              },
              { headers: { token } }
            );
          } catch (err) {
          } finally {
            setPendingOrder({ orderId: paymentData.orderId });
            setPaymentError("Payment cancelled. You can retry payment.");
            setIsPaying(false);
          }
        },
      },
      theme: { color: "#8b5cf6" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", async (res) => {
      try {
        await axios.post(
          url + "/api/order/payment-failed",
          {
            orderId: paymentData.orderId,
            razorpay_order_id: paymentData.razorpayOrderId,
            reason: res?.error?.description || "Payment failed",
          },
          { headers: { token } }
        );
      } catch (err) {
      } finally {
        setPendingOrder({ orderId: paymentData.orderId });
        navigate("/payment-failed", { state: { orderId: paymentData.orderId, reason: res?.error?.description || "Payment failed" } });
        setIsPaying(false);
      }
    });
    rzp.open();
  };

  const retryPendingPayment = async () => {
    if (!pendingOrder?.orderId || isPaying) return;
    setPaymentError("");
    try {
      setIsPaying(true);
      const response = await axios.post(
        url + "/api/order/retry-payment",
        { orderId: pendingOrder.orderId },
        { headers: { token } }
      );

      if (!response.data.success) {
        setPaymentError(response.data.message || "Retry payment failed");
        setIsPaying(false);
        return;
      }

      await openRazorpayCheckout(response.data);
    } catch (error) {
      setPaymentError(error?.response?.data?.message || "Retry payment failed");
      setIsPaying(false);
    }
  };

  const placeOrder = async (event) =>{
    event.preventDefault();
    setPaymentError("");
    try {
      setIsPaying(true);
      let orderItems = [];
      allFoods.map((item, index)=>{
        if(cartItems[item._id]>0){
          let itemInfo = item;
          itemInfo["quantity"] = cartItems[item._id];
          orderItems.push(itemInfo);
        }
      })
      let orderData = {
        address:data,
        items:orderItems,
        amount:getTotalCartAmount()+2,
        deliveryLocation: deliveryLocation || undefined,
      }

      if (!orderItems.length) {
        setPaymentError("Your cart is empty");
        setIsPaying(false);
        return;
      }

      const response = await axios.post(url+'/api/order/place', orderData,{headers:{token}})
      if(response.data.success && response.data.razorpayOrderId){
        setPendingOrder({ orderId: response.data.orderId });
        await openRazorpayCheckout(response.data);
      }
      else{
        setPaymentError(response.data.message || 'Error starting payment')
        setIsPaying(false);
      }
    } catch (error) {
      setPaymentError(error?.response?.data?.message || 'Error starting payment')
      setIsPaying(false);
    }
  }

  const navigate = useNavigate();

  useEffect(()=>{
    if(!token){
      navigate('/cart')
    }else if(getTotalCartAmount()===0){
      navigate('/cart')
    }
  },[token])

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setDeliveryLocation(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First Name'/>
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last Name'/>
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address'/>
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street'/>
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city}  type="text" placeholder='City'/>
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State'/>
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code'/>
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country'/>
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' />
      </div>
      <div className="place-order-left">
      <div className="cart-total">
          <h2>Cart Total</h2>
          <div>
          <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount()===0?0:2}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>${getTotalCartAmount()===0?0:getTotalCartAmount()+2}</b>
            </div> 
          </div>
          {paymentError ? <p className="payment-error">{paymentError}</p> : null}
          <button type='submit' disabled={isPaying}>
            {isPaying ? "Processing..." : "PAY NOW"}
          </button>
          {pendingOrder?.orderId ? (
            <button type='button' disabled={isPaying} onClick={retryPendingPayment}>
              {isPaying ? "Processing..." : "RETRY PAYMENT"}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder

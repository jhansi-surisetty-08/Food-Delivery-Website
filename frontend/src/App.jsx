import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home/Home'
import Menu from './pages/Menu/Menu'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import ScrollNav from './components/ScrollNav/ScrollNav'
import Verify from './pages/Verify/Verify'
import MyOrders from './pages/MyOrders/MyOrders'
import AiAssistant from './components/AiAssistant/AiAssistant'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'
import { StoreContext } from './components/context/StoreContext'
import Auth from './pages/Auth/Auth'
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed/PaymentFailed'

const App = () => {
  const location = useLocation();
  const { token } = React.useContext(StoreContext);

  if (!token) {
    const defaultMode = location.pathname === '/signup' ? 'signup' : 'login';
    return <Auth defaultMode={defaultMode} />;
  }

  return (
    <>
    <div className='app'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/menu' element={<Menu/>}/>
        <Route path='/cart' element={<PrivateRoute token={token}><Cart/></PrivateRoute>}/>
        <Route path='/order' element={<PrivateRoute token={token}><PlaceOrder/></PrivateRoute>}/>
        <Route path='/verify' element={<PrivateRoute token={token}><Verify/></PrivateRoute>}/>
        <Route path='/payment-success' element={<PrivateRoute token={token}><PaymentSuccess/></PrivateRoute>}/>
        <Route path='/payment-failed' element={<PrivateRoute token={token}><PaymentFailed/></PrivateRoute>}/>
        <Route path='/myorders' element={<PrivateRoute token={token}><MyOrders/></PrivateRoute>}/>
        <Route path='/login' element={<Navigate to='/' replace />} />
        <Route path='/signup' element={<Navigate to='/' replace />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </div>
    <Footer/>
    <ScrollNav />
    <AiAssistant />
    </>
  )
}

export default App

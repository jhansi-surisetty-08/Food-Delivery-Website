import React from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Navigate, Route, Routes } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Categories from './pages/Categories/Categories';
import Coupons from './pages/Coupons/Coupons';
import Delivery from './pages/Delivery/Delivery';
import Notifications from './pages/Notifications/Notifications';
import Reports from './pages/Reports/Reports';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import AdminLogin from './pages/Auth/AdminLogin.jsx';
import AdminSignup from './pages/Auth/AdminSignup.jsx';
import AdminForgotPassword from './pages/Auth/AdminForgotPassword.jsx';
import { useAuth } from './context/AuthContext.jsx';

const AdminLayout = ({ url }) => (
  <div>
    <Navbar/>
    <hr/>
    <div className="app-content">
      <Sidebar/>
      <Routes>
        <Route path='/' element={<Navigate to="/dashboard" replace />} />
        <Route path='/dashboard' element={<Dashboard url={url} />} />
        <Route path='/add' element={<Add url={url} />} />
        <Route path='/list' element={<List url={url}/>} />
        <Route path='/orders' element={<Orders url={url}/>} />
        <Route path='/users' element={<Users url={url}/>} />
        <Route path='/categories' element={<Categories url={url}/>} />
        <Route path='/coupons' element={<Coupons url={url}/>} />
        <Route path='/delivery' element={<Delivery url={url}/>} />
        <Route path='/notifications' element={<Notifications url={url}/>} />
        <Route path='/reports' element={<Reports url={url}/>} />
        <Route path='*' element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  </div>
)

const App = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:4001';
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ToastContainer/>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AdminLogin />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AdminSignup />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AdminForgotPassword />}
        />
        <Route
          path="/*"
          element={(
            <ProtectedRoute>
              <AdminLayout url={url} />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </>
  )
}

export default App

import React, {  useContext, useEffect, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from './../context/StoreContext';
import axios from 'axios'
import { avatarOptions } from '../../utils/avatarOptions';

const LoginPopup = ({setShowLogin}) => {

    const {url, setToken, setRole, setUserInfo} = useContext(StoreContext)

    const [currentState, setCurrentState] = useState('Login')
    const [errorMessage, setErrorMessage] = useState("")
    const [data, setData] = useState({
        name:"",
        email:"",
        password:"",
        avatar: avatarOptions[0].id,
    })

    const onChangeHandler = (event) =>{
        const name = event.target.name
        const value = event.target.value 
        setData(data=>({...data,[name]:value}))
    }

   const onLogin = async (event) =>{
        event.preventDefault()
        let newUrl = url;
        if(currentState==='Login'){
            newUrl+= "/api/user/login"
        }else{
            newUrl += "/api/user/register"
        }

       try {
        let response;
        if (currentState === 'Login') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          response = await axios.post(newUrl,data, { signal: controller.signal });
          clearTimeout(timeoutId);
        } else {
          response = await axios.post(newUrl,data);
        }

            if(response.data.success){
                setToken(response.data.token);
                setRole(response.data.role || "user");
                setUserInfo({name: response.data.name, email: response.data.email, avatar: response.data.avatar, role: response.data.role || "user"});
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("role", response.data.role || "user");
                localStorage.setItem("userInfo", JSON.stringify({name: response.data.name, email: response.data.email, avatar: response.data.avatar, role: response.data.role || "user"}));
                setShowLogin(false);
            }else{
                setErrorMessage(currentState === 'Login' ? "Invalid credentials" : (response.data.message || "Signup failed"));
            }
       } catch (error) {
            setErrorMessage(currentState === 'Login' ? "Invalid credentials" : (error?.response?.data?.message || "Signup failed"));
       }
   }

   useEffect(() => {
        if (!errorMessage) return;
        const timeout = setTimeout(() => setErrorMessage(""), 3000);
        return () => clearTimeout(timeout);
   }, [errorMessage]);

  return (
    <div className='login-popup'>
        {errorMessage ? (
            <div className="login-toast" role="alert">
                {errorMessage}
            </div>
        ) : null}
        <form onSubmit={onLogin} className="login-popup-container">
            <div className="login-popup-title">
                <h2>{currentState}</h2>
                <img onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt="" />
            </div>
            <div className="login-popup-inputs">
                {currentState==='Login'?<></>: <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
               
                {currentState==='Login' ? null : (
                  <div className="login-popup-avatar-picker">
                    <p>Choose avatar</p>
                    <div className="login-popup-avatar-grid">
                      {avatarOptions.map((avatarOption) => (
                        <button
                          key={avatarOption.id}
                          type="button"
                          className={`login-popup-avatar-option ${data.avatar === avatarOption.id ? 'selected' : ''}`}
                          style={{ background: avatarOption.gradient }}
                          onClick={() => setData((previous) => ({ ...previous, avatar: avatarOption.id }))}
                        >
                          <span>{avatarOption.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
                <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
            </div>

            <button type='submit'>{currentState==='Sign Up'?'Create account':'Login'}</button>
            <div className="login-popup-condition">
                <input type="checkbox" required />
                <p>By continuing, I agree to the terms of use & privacy policy</p>
            </div>
            {currentState==='Login'?
             <p>Create a new account? <span onClick={()=> setCurrentState('Sign Up')}>Click here</span></p>
             :<p>Already have an account? <span onClick={()=> setCurrentState('Login')}>Login here</span></p>}
            
            
        </form>
    </div>
  )
}

export default LoginPopup

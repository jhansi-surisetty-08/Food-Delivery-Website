import React, { useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Verify = () => {

    const [searchParams] = useSearchParams();
    const success = searchParams.get("success")
    const navigate = useNavigate();

    useEffect(()=>{
        const timeout = setTimeout(() => {
            if (success === "true") {
                navigate('/myorders');
            } else {
                navigate('/');
            }
        }, 800);
        return () => clearTimeout(timeout);
    },[])
   
  return (
    <div className='verify'>
        <div className="spinner"></div>
    </div>
  )
}

export default Verify

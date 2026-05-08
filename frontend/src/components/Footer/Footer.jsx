import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className="footer-content">
            <div className="footer-content-left">
                <img src={assets.logo} alt="" />
                <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsum in, beatae dolorem non optio cupiditate, quam sunt dicta dolores minima exercitationem ducimus totam aut asperiores inventore harum laudantium. Distinctio, libero.</p>
                <div className="footer-social-icons">
                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Open Facebook">
                        <img src={assets.facebook_icon} alt="Facebook" />
                    </a>
                    <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Open Twitter">
                        <img src={assets.twitter_icon} alt="Twitter" />
                    </a>
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Open LinkedIn">
                        <img src={assets.linkedin_icon} alt="LinkedIn" />
                    </a>
                </div>
            </div>
            <div className="footer-content-center">
                <h2>COMPANY</h2>
                <ul>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Delivery</li>
                    <li>Privacy Policy</li>
                </ul>
            </div>
            <div className="footer-content-right">
                <h2>GET IN TOUCH</h2>
                <ul>
                    <li>+91 7987654321</li>
                    <li>sample.foodapp@protonmail.com</li>
                </ul>
            </div>
           
        </div>
        <hr />
        <p className="footer-copyright">
            Copyright 2024 &copy; Dulanjali - All Right Reserved.
        </p>
    </div>
  )
}

export default Footer
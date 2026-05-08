import React from 'react'
import './AppDownlaod.css'
import { assets } from '../../assets/assets'

const AppDownload = () => {
  return (
    <div className='app-download' id='app-download'>
        <p>For Better Experience <br/>Purple Food App</p>
        <div className="app-download-platforms">
        <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" aria-label="Open Google Play Store">
          <img src={assets.play_store} alt="Google Play Store" />
        </a>
        <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" aria-label="Open Apple App Store">
          <img src={assets.app_store} alt="Apple App Store" />
        </a>
        </div>
    </div>
  )
}

export default AppDownload
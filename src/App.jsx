import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route, NavLink} from 'react-router-dom';
import ChatBookApp from './ChatBookApp';




function App(){
  return (
    <>
    <div>
    <BrowserRouter>
      <h1>Eli GPT</h1>
      <div className='nav-links'>
        <NavLink to='/chatbook'>Chat Book</NavLink>
      </div>
      <div className="content">
        <Routes>
          <Route path="/chatbook" element={<ChatBookApp />} />
        </Routes>
      </div>
    </BrowserRouter>   
    </div> 
    </>
  )
}



export default App;
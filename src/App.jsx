import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route, NavLink} from 'react-router-dom';
import ChatBookApp from './ChatBookApp';
import ApiCheck from './ApiCheck';
import ChatGPT from './ChatGPT';




function App(){
  return (
    <>
    <div>
    <BrowserRouter>
      <h1>Eli GPT</h1>
      <div className='nav-links'>
        <NavLink to='/chatBook'>Chat Book</NavLink>
        <NavLink to='/apiCheck'>API Check</NavLink>
        <NavLink to='/chatGPT'>Chat GPT</NavLink>
      </div>
      <div className="content">
        <Routes>
          <Route path="/chatBook" element={<ChatBookApp />} />
          <Route path="/apiCheck" element={<ApiCheck />} />
          <Route path="/chatGPT" element={<ChatGPT />} />
        </Routes>
      </div>
    </BrowserRouter>   
    </div> 
    </>
  )
}



export default App;
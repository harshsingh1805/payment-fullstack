import { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {Dashboard} from './pages/Dashboard';
import {Signup} from './pages/Signup';
import {Signin} from './pages/SignIn';
import {SendMoney} from './pages/SendMoney';
import {ProtectedRoute} from './components/ProtectedRoute';
function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signin/>} />
          <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute>  }/>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />  
          <Route path="/send" element={ <ProtectedRoute> <SendMoney /></ProtectedRoute> } /> 
        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App

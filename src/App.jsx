import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import AddMovement from './components/AddMovement';
import MovementList from './components/MovementList';
import Analysis from './components/Analysis';


function App () {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/add-movement" element={<AddMovement />} />
          <Route path="/movement-list" element={<MovementList />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App;
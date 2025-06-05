import { Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import App from '../App';

const RouterProvider = () => {
  return (
    <Routes>
      <Route path='/'>
        <Route index element={<Login />} />
        <Route path='/' element={<App />}>
          <Route path='home' element={<Home />} />
          <Route path='dashboard' element={<Dashboard />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default RouterProvider;

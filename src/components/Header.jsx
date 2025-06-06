import { LogOut, User } from 'lucide-react';
import Logo from './Logo';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div id='header' className='bg-white sticky top-0 w-full z-50 p-2'>
      <div className='container p-4 w-[95%] max-w-[1400px] mx-auto flex justify-between items-center'>
        <Logo />
        <h1 className='text-3xl font-semibold text-[#fcbc19]'>
          Evolve Middle Office Knowledge Assistant
        </h1>
        <div className='flex items-center gap-4'>
          <h1 className='border border-gray-100 bg-gray-100 font-semibold hover:border-[#174a7e] text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 transition-colors'>
            <User />
            {user ? user.name : 'Test User'}
          </h1>
          <button
            onClick={handleLogout}
            className='border border-[#174a7e] bg-white font-semibold text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 hover:bg-[#082340] hover:text-white transition-colors'
          >
            <span>Logout</span>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

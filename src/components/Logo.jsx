import { Link } from 'react-router-dom';
import logoImg from '../assets/group_logo.png';

const Logo = () => {
  return (
    <h1 className='text-md flex items-center gap-2 font-semibold text-[#004AAD]'>
      <Link to='/'>
        <img src={logoImg} alt='logo' className='w-36' />
      </Link>
    </h1>
  );
};

export default Logo;

import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className='flex justify-center items-center flex-col min-h-screen'>
      <h1 className='font-extrabold text-6xl md:text-8xl mb-2'>404</h1>
      <p className='text-lg'>Page not found!</p>
      <Link to='/' className='text-blue-600 mt-4'>
        Home
      </Link>
    </div>
  );
};

export default NotFound;

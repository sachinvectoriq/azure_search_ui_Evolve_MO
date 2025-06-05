import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useEffect } from 'react';
import { isTokenValid } from '../utils/isTokenValid';

const Login = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // console.log('token: ', token);
    // if (token) console.log('is token valid: ', isTokenValid(token));
    // if (token) {
    navigate('/home');
    // } else {
    //   window.location.href =
    //     import.meta.env.VITE_LOGIN_URI ||
    //     'https://qa-azure-search.azurewebsites.net/saml/login';
    // }
  }, [token]);

  return (
    <div className='min-h-screen flex items-center flex-col gap-4 justify-center'>
      <div className='h-10 w-10 bg-[#021A32] rounded-full animate-bounce'></div>
      <h1>Loading...</h1>
    </div>
  );
};

export default Login;

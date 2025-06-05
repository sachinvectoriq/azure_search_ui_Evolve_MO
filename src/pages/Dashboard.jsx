import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import { isTokenValid } from '../utils/isTokenValid';

const Dashboard = () => {
  const navigate = useNavigate();
  const { token, updateToken, loginUser } = useAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromURL = queryParams.get('token');

    if (tokenFromURL && isTokenValid(tokenFromURL)) {
      updateToken(tokenFromURL);
    } else {
      navigate('/');
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let res;
        if (import.meta.env.VITE_TOKEN_EXTRACT) {
          res = await apiClient.post(import.meta.env.VITE_TOKEN_EXTRACT, {
            token,
          });
          console.log('res data=> ', res.data);
          if (res.status === 200) {
            const { name, group } = res.data;
            loginUser({ name, group, token });

            navigate('/home');
          }
        } else {
          res = await apiClient.post('/saml/token/extract', null, {
            params: {
              token,
            },
          });
          console.log('res data=> ', res.data);
          if (res.status === 200) {
            const { name, group } = res.data.user_data;
            loginUser({ name, group, token });

            navigate('/home');
          }
        }

        // const logResponse = await apiClient.post('/pto_user_login_log', {
        //   user_name: res.data.name
        //     ? res.data.name
        //     : res.data.user_data.name.toString(),
        // });

        // storeSession(logResponse.data.session_id);

        // console.log('Login data logged');
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/');
      }
    };

    token && fetchUserData();
  }, [token]);

  return (
    <div className='min-h-screen flex items-center flex-col gap-4 justify-center'>
      <div className='h-10 w-10 bg-[#021A32] rounded-full animate-bounce'></div>
      <h1>Loading...</h1>
    </div>
  );
};

export default Dashboard;

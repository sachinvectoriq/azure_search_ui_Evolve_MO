import { jwtDecode } from 'jwt-decode';

export const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);

    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp > currentTime) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

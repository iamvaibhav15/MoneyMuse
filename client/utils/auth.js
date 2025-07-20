import Cookies from 'js-cookie';

const TOKEN_KEY = 'finance_token';
const USER_KEY = 'finance_user';

export const auth = {
  getToken() {
    return Cookies.get(TOKEN_KEY);
  },

  setToken(token) {
    Cookies.set(TOKEN_KEY, token, { 
      expires: 7, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  },

  removeToken() {
    Cookies.remove(TOKEN_KEY);
  },

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  removeUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  logout() {
    this.removeToken();
    this.removeUser();
  }
};
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../components/app_variables';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Loading_Comp from '../components/Loading';

const Login: React.FC = () => {
  const history = useHistory();
  const [user_name, setuser_name] = useState<string>('');
  const [password, setpassword] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [error, seterror] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { setid, setusername } = useAppContext();
  const [isUserNameFocused, setIsUserNameFocused] = useState<boolean>(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false);
  const [isRoleFocused, setIsRoleFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds
      sessionStorage.setItem("toggle_side_bar", "false")
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  // const fetchfull = async (id: number) => {
  //   try {
  //     setLoading(true)
  //     const response = await fetch('http://159.89.160.186/api/full_data/', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ id }),
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       set_all_invoices_number(data['all_invoices']['len']);
  //       set_all_invoices_data(data['all_invoices']);
  //       set_pending_invoices_number(data['pending_invoices']['len']);
  //       set_pending_invoices_data(data['pending_invoices']);
  //       set_to_do_invoices_number(data['to_do_invoices']['len']);
  //       set_to_do_invoices_data(data['to_do_invoices']);
  //       set_paid_invoices_number(data['paid_invoices']['len']);
  //       set_paid_invoices_data(data['paid_invoices']);
  //       if (role === 'Manager') {
  //         history.push('/manager/dashboard');
  //       } else {
  //         history.push('/user')
  //       }
  //       setLoading(false)
  //     } else {
  //       console.error('Failed to fetch data');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // };

  const Login = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://159.89.160.186/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user_name,
          password: password,
          role : role,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setid(data['id']);
        setusername(data['username']);
        // fetchfull(data['id']);
        if (role === 'Manager') {
          history.push('/manager/dashboard')
        } else {
          history.push('/accountant/dashboard')
        }
        setLoading(false)
      } else {
        setLoading(false)
        console.error('Failed to log in');
        seterror(true);
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-400 to-purple-600">
      {loading && <Loading_Comp />}
      <h1 className="text-5xl font-bold text-white mb-6 animate-bounce">Vasool.ai</h1>
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white shadow-lg rounded-xl p-10 space-y-8">
          <div className="relative">
            <input
              id="username"
              type="text"
              className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out"
              autoComplete="off"
              onChange={(e) => setuser_name(e.target.value)}
              value={user_name}
              onFocus={() => setIsUserNameFocused(true)}
              onBlur={() => setIsUserNameFocused(false)}
            />

            <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
            <label
              htmlFor="password"
              className={`absolute left-4 text-gray-600 transition-all duration-300 ease-in-out ${
                isUserNameFocused || user_name ? 'transform -translate-y-6 scale-70 text-blue-500' : 'top-4'
              }`}
            >
              Username
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out"
              autoComplete="off"
              onChange={(e) => setpassword(e.target.value)}
              value={password}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
            <label
              htmlFor="password"
              className={`absolute left-4 text-gray-600 transition-all duration-300 ease-in-out ${
                isPasswordFocused || password ? 'transform -translate-y-6 scale-70 text-blue-500' : 'top-4'
              }`}
            >
              Password
            </label>
            <span
              className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>
          <div className="relative">
            <select
              id="role"
              className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={() => setIsRoleFocused(true)}
              onBlur={() => setIsRoleFocused(false)}
            >
              <option value="" disabled></option>
              <option value="Manager">Manager</option>
              <option value="Accountant">Accountant</option>
            </select>

            <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
            <label
              htmlFor="password"
              className={`absolute left-4 text-gray-600 transition-all duration-300 ease-in-out ${
                isRoleFocused || role ? 'transform -translate-y-6 scale-70 text-blue-500' : 'top-4'
              }`}
            >
              Role
            </label>
          </div>
          {error && <div className="text-red-600 text-center">Incorrect username or password.</div>}
            <button
              onClick={() => Login()}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l text-white font-bold py-3 rounded-lg transition-all duration-300 ease-in-out"
              disabled={!password || !user_name || !role}
            >
              Login
            </button>
            <div className="text-center mt-4">
              <span className="text-gray-700">Don't have an account? </span>
              <a href="/signup" className="text-blue-500 hover:text-blue-700 font-semibold transition-all duration-300">
                SignUp
              </a>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Login;

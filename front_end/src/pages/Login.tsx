import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../components/app_variables';

const Login: React.FC = () => {
  const history = useHistory();
  const [user_name, setuser_name] = useState<string>('');
  const [password, setpassword] = useState<string>('');
  const [error, seterror] =useState<boolean>(false);
  const { user_id, setuser_id, username, setusername } = useAppContext();
  const Login = async () => {
    try {
        const response = await fetch('http://165.232.188.250:8080/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: user_name,
                password: password
            }),
        });
        if (response.ok) {
            const data = await response.json();
            // Handle successful login
            setuser_id(data['id'])
            setusername(data['username'])
            console.log('Logged in user:', data);
            setTimeout
            setTimeout(() => {
                history.push('/csv_add')
              }, 1000);
        } else {
            console.error('Failed to log in');
            seterror(true)
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
};

  const update_user_name = (user_name: string) => {
    setuser_name(user_name)
  };

  const update_password = (password: string) => {
    setpassword(password)
  };


  return (
    <div className="flex flex-col space-y-10 w-screen h-screen justify-center items-center">
        <div className='flex flex-col w-full justify-center items-center '>
            <div>
                <div>Username : </div>
                <input
                    id='username'
                    type="text"
                    className="w-72 border border-gray-300 rounded p-2"
                    onChange={(e) => update_user_name(e.target.value)}
                />
            </div>
        </div>
        <div className='flex flex-col w-full justify-center items-center'>
            <div>
                <div>Password : </div>
                <input
                    id='Password'
                    type="text"
                    className="w-72 border border-gray-300 rounded p-2"
                    onChange={(e) => update_password(e.target.value)}
                />
            </div>
        </div>
        {error && (<div className='text-red-600'>Incorrect username or password. </div>)}
      <button onClick={() => Login()} className="bg-blue-500 hover:bg-green-500 text-white font-bold w-52 py-2 px-4 rounded" disabled={!password && !user_name}>
        Login
      </button>
    </div>
  );
};

export default Login;

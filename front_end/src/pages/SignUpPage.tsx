import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import Loading_Comp from '../components/Loading';

const SignUpPage: React.FC = () => {
  const history = useHistory();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFirstNameFocused, setIsFirstNameFocused] = useState<boolean>(false);
  const [isLastNameFocused, setIsLastNameFocused] = useState<boolean>(false);
  const [isEmailFocused, setIsEmailFocused] = useState<boolean>(false);
  const [isPhoneNumberFocused, setIsPhoneNumberFocused] = useState<boolean>(false);
  const [isUserNameFocused, setIsUserNameFocused] = useState<boolean>(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    firstName : firstName,
    lastName : lastName,
    email : email,
    phoneNumber : phoneNumber,
    userName : userName,
    password : password,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds
    }, 100);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const passwordRequirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'At least one uppercase letter', regex: /[A-Z]/ },
    { label: 'At least one lowercase letter', regex: /[a-z]/ },
    { label: 'At least one number', regex: /[0-9]/ },
    { label: 'At least one special character', regex: /[^A-Za-z0-9]/ },
  ];

  const checkPassword = (requirement: { label: string; regex: RegExp }) => requirement.regex.test(password);

  const handleSignUp = () => {
    history.push('/business_information', {
      firstName,
      lastName,
      email,
      phoneNumber,
      userName,
      password,
    });
  };
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      {loading && <Loading_Comp />}
      <h1 className="text-5xl font-extrabold text-white mb-10 animate-bounce">Vasool.ai</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-8">
        <div className="flex space-x-4">
          <div className="relative flex-grow">
            <input
              id="firstName"
              type="text"
              className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
              autoComplete="off"
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
              onFocus={() => setIsFirstNameFocused(true)}
              onBlur={() => setIsFirstNameFocused(false)}
            />
            <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
            <label
              htmlFor="firstName"
              className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
                isFirstNameFocused || firstName ? '-top-6 left-3 text-md' : 'top-3'
              }`}
            >
              First Name
            </label>
          </div>
          <div className="relative flex-grow">
            <input
              id="lastName"
              type="text"
              className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
              autoComplete="off"
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              onFocus={() => setIsLastNameFocused(true)}
              onBlur={() => setIsLastNameFocused(false)}
            />
            <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
            <label
              htmlFor="lastName"
              className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
                isLastNameFocused || lastName ? '-top-6 left-3 text-md' : 'top-3'
              }`}
            >
              Last Name
            </label>
          </div>
        </div>
        <div className="relative">
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
          />
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="email"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              isEmailFocused || email ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Email
          </label>
        </div>
        <div className="relative">
          <input
            id="phoneNumber"
            type="tel"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setPhoneNumber(e.target.value)}
            value={phoneNumber}
            onFocus={() => setIsPhoneNumberFocused(true)}
            onBlur={() => setIsPhoneNumberFocused(false)}
          />
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="phoneNumber"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              isPhoneNumberFocused || phoneNumber ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Phone Number
          </label>
        </div>
        <div className="relative">
          <input
            id="userName"
            type="text"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
            onFocus={() => setIsUserNameFocused(true)}
            onBlur={() => setIsUserNameFocused(false)}
          />
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="userName"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              isUserNameFocused || userName ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Username
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
          />
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="password"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              isPasswordFocused || password ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Password
          </label>
          <span
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </span>
        </div>
        <div className="flex flex-col items-start mt-2 text-sm">
          {passwordRequirements.map((requirement, index) => (
            <div key={index} className="flex items-center">
              <span className={`mr-2 ${checkPassword(requirement) ? 'text-green-500' : 'text-red-500'}`}>
                {checkPassword(requirement) ? '✓' : '✗'}
              </span>
              <span>{requirement.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleSignUp}
          className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l text-white font-bold py-3 rounded-lg transition-all duration-300 ease-in-out"
          disabled={!password || !userName || !email || !phoneNumber || !firstName || !lastName}
        >
          Sign Up
        </button>
        <div className="text-center mt-4">
          <span className="text-gray-700">Already have an account? </span>
          <a href="/" className="text-blue-500 hover:text-blue-700 font-semibold transition-all duration-300">
            Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

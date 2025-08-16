import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { useHistory, useLocation } from 'react-router-dom';
import Loading_Comp from '../components/Loading';
import { AppProvider, useAppContext } from '../components/app_variables';

const BusinessInfoPage: React.FC = () => {
  const history = useHistory();
  const {setusername, setid} = useAppContext();
  const location = useLocation<{ firstName: string; lastName: string; email: string; phoneNumber: string; userName: string; password: string }>();

  const { firstName, lastName, email, phoneNumber, userName, password } = location.state;

  const [company, setCompany] = useState<string>('');
  const [address_1, setaddress_1] = useState<string>('');
  const [address_2, setAddress_2] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [type, settype] = useState<string>('');
  const [companies, setCompanies] = useState<Array<{ company: string, type: string, address_1: string, address_2: string, state: string, pincode: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds
    }, 100);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const handleAddCompany = () => {
    if (company && type) {
      setCompanies([...companies, { company, type, address_1, address_2, state, pincode }]);
      setCompany('');
      settype('');
      setaddress_1('')
      setAddress_2('')
      setPincode('')
      setState('')
    }
  };

  const handleSubmit = async() => {
    const data = {
      manager_data  :{first_name :firstName,
        last_name : lastName,
        email,
        phone_number :phoneNumber,
        username :userName,
        password},
      companies,
    };
    const create_manager = async () => {
      try {
        const response = await fetch('http://159.89.160.186/create_account/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
          
        })
        if (response.ok) {
          const data = await response.json();
          setusername(data['username'])
          setid(data['id'])
          history.push('/manager/dashboard')
    
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    create_manager()
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      {loading && <Loading_Comp />}
      <h1 className="text-5xl font-extrabold text-white mb-7 animate-bounce">Vasool.ai</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Business Information</h2>
        <div className="relative">
          <input
            id="company"
            type="text"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setCompany(e.target.value)}
            value={company}
          />
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="company"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              company ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Company Name
          </label>
        </div>

        <div className="relative">
          <input
            id="address_1"
            type="text"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setaddress_1(e.target.value)}
            value={address_1}
          />
          <label
            htmlFor="address_1"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              address_1 ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Address Line 1
          </label>
        </div>

        <div className="relative">
          <input
            id="address_2"
            type="text"
            className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            autoComplete="off"
            onChange={(e) => setAddress_2(e.target.value)}
            value={address_2}
          />
          <label
            htmlFor="address_2"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              address_2 ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Address Line 2
          </label>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              id="state"
              type="text"
              className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
              autoComplete="off"
              onChange={(e) => setState(e.target.value)}
              value={state}
            />
            <label
              htmlFor="state"
              className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
                state ? '-top-6 left-3 text-md' : 'top-3'
              }`}
            >
              State
            </label>
          </div>
          <div className="relative flex-1">
            <input
              id="pincode"
              type="text"
              className="w-full border border-gray-300 rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
              autoComplete="off"
              onChange={(e) => setPincode(e.target.value)}
              value={pincode}
            />
            <label
              htmlFor="pincode"
              className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
                pincode ? '-top-6 left-3 text-md' : 'top-3'
              }`}
            >
              Pincode
            </label>
          </div>
        </div>

        <div className="relative">
          <select
            id="type"
            className="w-full border border-gray-300 bg-white rounded p-3 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 outline-none"
            value={type}
            onChange={(e) => settype(e.target.value)}
          >
            <option value="" disabled></option>
            <option value="LLP">LLP</option>
            <option value="Sole-Proprietorship">Sole-Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Private Limited">Private Limited</option>
          </select>
          <h1 className='text-xl transform -translate-y-6 scale-75 text-red-600 absolute right-0 top-0'>*</h1>
          <label
            htmlFor="type"
            className={`absolute left-3 text-gray-600 transition-all duration-300 ease-in-out ${
              type ? '-top-6 left-3 text-md' : 'top-3'
            }`}
          >
            Company Type
          </label>
        </div>

        <div className="relative  max-w-24 italic">
          <table className='w-full max-h-24 overflow-y-auto no-scrollbar'>
            <thead>
              <tr>
                <th className='px-2 w-40 border-r border-gray-400 text-left'>Name</th>
                <th className='px-2 w-40 border-l border-gray-400 text-left'>Type</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr key={company.company}>
                  <th className='px-2 w-40 font-thin text-left border-r border-gray-400 border-t border-t-gray-100'>{company.company}</th>
                  <th className='px-2 w-40 font-thin text-left border-l border-gray-400 border-t border-t-gray-100'>{company.type}</th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleAddCompany}
          className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l text-white font-bold py-3 rounded-lg transition-all duration-300 ease-in-out"
        >
          Add Company
        </button>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:bg-gradient-to-l text-white font-bold py-3 rounded-lg transition-all duration-300 ease-in-out"
          disabled={companies.length < 1}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default BusinessInfoPage;

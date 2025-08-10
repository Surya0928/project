import React, { useState, useEffect } from 'react';
import Loading_Comp from '../../components/Loading';
import Manager_Side_Bar from '../../components/Manager_Components/Manager_Side_Bar';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../../components/app_variables';
import ManagerHeadBar from '../../components/Manager_Components/Manager_Head_Bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faBullseye, faUserPlus, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Accountant {
  id: number;
  username: string;
  password: string;
  address: string;
  target_collection: number;
  name : string;
  phone_number : string
}

const formatNumberToINR = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });
};

const usernameRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'At least one special character', regex: /[^A-Za-z0-9]/ },
];

const passwordRequirements = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'At least one uppercase letter', regex: /[A-Z]/ },
  { label: 'At least one lowercase letter', regex: /[a-z]/ },
  { label: 'At least one number', regex: /[0-9]/ },
  { label: 'At least one special character', regex: /[^A-Za-z0-9]/ },
];

const checkRequirement = (input: string, requirement: { label: string; regex: RegExp }) =>
  requirement.regex.test(input);

const Manager_Accountants: React.FC = () => {
  const history = useHistory();
  const { id } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [inp_username, set_inp_username] = useState<string>('');
  const [inp_password, set_inp_password] = useState<string>('');
  const [inp_name, set_inp_name] = useState<string>('');
  const [inp_phone_number, set_inp_phone_number] = useState<string>('');
  const [inp_address, set_inp_address] = useState<string>('');
  const [inp_target_collection, set_inp_target_collection] = useState<string>('');
  const [isedit, set_is_edit] = useState<boolean>(false);
  const [edit_target_coll, set_edit_target_coll] = useState<boolean>(false);
  const [selected_acccountant, set_selected_accountant] = useState<number>(0);

  const isFormValid = (): boolean => {
    return (
      usernameRequirements.every((requirement) =>
        checkRequirement(inp_username, requirement)
      ) &&
      passwordRequirements.every((requirement) =>
        checkRequirement(inp_password, requirement)
      )
    );
  };
  

  const get_accountants = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://159.89.160.186:8000/accountants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
        })
      });
      if (response.ok) {
        const data = await response.json();
        const sortedAccountants = data.sort((a: Accountant, b: Accountant) => a.id - b.id);
        setAccountants(sortedAccountants);
        setLoading(false)
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const create_accountant = async (method : string, accountant_id : number) => {
    setLoading(true)
    try {
      const response = await fetch('http://159.89.160.186:8000/create_accountant/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id : accountant_id,
            method : method,
            manager : id,
            name : inp_name,
            phone_number : inp_phone_number,
            username : inp_username,
            password : inp_password,
            address : inp_address,
            target_collection : Number(inp_target_collection)
        }),
      });
      if (response.ok) {
        set_inp_username('')
        set_inp_password('')
        set_inp_address('')
        set_inp_name('')
        set_inp_phone_number('')
        set_inp_target_collection('')
        set_is_edit(false)
        set_edit_target_coll(false)
        get_accountants()
        setLoading(false)
      } else {
        console.error('Failed to fetch users data');
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  const cancel = ()=> {
    set_is_edit(false)
    set_selected_accountant(0)
    set_inp_username('')
    set_inp_password('')
    set_inp_address('')
    set_inp_name('')
    set_inp_phone_number('')
    set_edit_target_coll(false)
    set_inp_target_collection('')
  }

  const edit = (accountant : Accountant) => {
    set_selected_accountant(accountant.id); 
    set_inp_username(accountant.username)
    set_inp_password(accountant.password)
    set_inp_name(accountant.name)
    set_inp_phone_number(accountant.phone_number)
    set_inp_address(accountant.address)
    set_is_edit(true); 
    set_edit_target_coll(false)
  }

  const target_coll = (accountant : Accountant) => {
    set_selected_accountant(accountant.id); 
    set_inp_target_collection(String(accountant.target_collection))
    set_is_edit(false); 
    set_edit_target_coll(true)
  }
  
  const confirm = (accountant_id: number) => {
    if (edit_target_coll) {
      create_accountant('Target Collection', accountant_id);
    }
    if (isedit) {
      create_accountant('Update', accountant_id);
    console.log("in")
    } else {
      console.log('Username or password requirements not met');
    }
  };  

  useEffect(() => {
    const timer = setTimeout(() => {
      get_accountants();
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div className='font-sans flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Manager_Side_Bar current_page='A/R Accountants' />
      <div className='flex flex-col w-full h-screen'>
        <ManagerHeadBar />
        <div className='h-full overflow-y-auto no-scrollbar w-full flex flex-col py-6 space-y-6'>
          {/* Header Section */}
          <div className='flex w-full h-auto items-center justify-between px-10'>
              <div className='text-4xl font-bold'>Accountants</div>
              <div className='text-xl'>No of Accountants : {accountants.length}</div>
          </div>

          {/* Table Section */}
          <table className='w-full overflow-x-auto border border-gray-300 italic'>
              <thead>
                  <tr>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          USERNAME
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          PASSWORD
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          NAME
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          PHONE NUMBER
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          ADDRESS
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          TARGET COLLECTION
                      </th>
                      <th className='w-24 px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          
                      </th>
                  </tr>
              </thead>
              <tbody>
                {accountants.map((accountant, index) => (
                  <tr
                    key={accountant.id}
                    className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                  > 
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={accountant.username}
                            style={{ outline: 'none' }}
                            value={inp_username}
                            onChange={(e) => (set_inp_username(e.target.value))}
                          />
                        ) : (
                          accountant.username
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={accountant.password}
                            style={{ outline: 'none' }}
                            value={inp_password}
                            onChange={(e) => (set_inp_password(e.target.value))}
                          />
                        ) : (
                          accountant.password
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={accountant.name}
                            style={{ outline: 'none' }}
                            value={inp_name}
                            onChange={(e) => (set_inp_name(e.target.value))}
                          />
                        ) : (
                          accountant.name
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={accountant.phone_number}
                            type='text'  // Change this to 'text'
                            style={{ outline: 'none' }}
                            value={inp_phone_number}
                            onChange={(e) => {
                              const phone = e.target.value;
                              if (/^\d*$/.test(phone) && phone.length <= 10) { // Allow only digits and max length of 10
                                set_inp_phone_number(phone);
                              }
                            }}
                            maxLength={10}
                          />
                        ) : (
                          accountant.phone_number
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={accountant.address}
                            style={{ outline: 'none' }}
                            value={inp_address}
                            onChange={(e) => (set_inp_address(e.target.value))}
                          />
                        ) : (
                          accountant.address
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_acccountant===accountant.id && edit_target_coll ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={String(accountant.target_collection)}
                            style={{ outline: 'none' }}
                            type='number'
                            value={inp_target_collection}
                            onChange={(e) => (set_inp_target_collection(e.target.value))}
                          />
                        ) : (
                          formatNumberToINR(accountant.target_collection)
                        )}
                    </td>
                    {(selected_acccountant == accountant.id)&&(isedit || edit_target_coll) ? (
                      <td className='flex w-24 items-center justify-between space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        <FontAwesomeIcon className='text-lg hover:text-red-500 cursor-pointer' icon={faXmark} onClick={()=>{cancel()}}/>
                        <FontAwesomeIcon className='text-lg hover:text-green-500 cursor-pointer' icon={faCheck} onClick={()=>{confirm(accountant.id)}}/>
                      </td>
                    ) : (
                      <td className='flex w-24 items-center justify-between space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        <FontAwesomeIcon className='text-lg hover:text-blue-500 cursor-pointer' icon={faPencil} onClick={()=>{edit(accountant)}}/>
                        <FontAwesomeIcon className='text-lg hover:text-blue-500 cursor-pointer' icon={faBullseye} onClick={()=>{target_coll(accountant)}}/>
                      </td>
                    )}
                  </tr>
                ))}
                {(!isedit && !edit_target_coll) && (
                  <tr className={`${accountants.length % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Username'
                        style={{ outline: 'none' }}
                        value={inp_username}
                        onChange={(e) => (set_inp_username(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Password'
                        style={{ outline: 'none' }}
                        value={inp_password}
                        onChange={(e) => (set_inp_password(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Name'
                        style={{ outline: 'none' }}
                        value={inp_name}
                        onChange={(e) => (set_inp_name(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                    <input 
                      className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                      placeholder="Add Phone Number"
                      type='text'  // Change this to 'text'
                      style={{ outline: 'none' }}
                      value={inp_phone_number}
                      onChange={(e) => {
                        const phone = e.target.value;
                        if (/^\d*$/.test(phone) && phone.length <= 10) { // Allow only digits and max length of 10
                          set_inp_phone_number(phone);
                        }
                      }}
                      maxLength={10}
                    />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Address'
                        style={{ outline: 'none' }}
                        value={inp_address}
                        onChange={(e) => (set_inp_address(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Target Collection'
                        value = {inp_target_collection}
                        style={{ outline: 'none' }}
                        onChange={(e) => (set_inp_target_collection((e.target.value)))}
                        type='number'
                      />
                    </td>
                    <td className='flex w-24 items-center justify-between space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                    <FontAwesomeIcon className="text-lg text-gray-500 w-full text-center hover:text-blue-500 cursor-pointer" icon={faUserPlus} onClick={() => {if (isFormValid()) {create_accountant("Create", 0);} else {console.log('Username or password requirements not met');}}}/>
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
          <div className="w-full flex italic justify-between mt-10 px-10">
            {/* Username Requirements */}
            <div className="flex flex-col w-1/2 items-center">
              <h2 className="text-xl font-semibold">Username Requirements</h2>
              <div className="flex flex-col items-start mt-2 text-lg">
                {usernameRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center">
                    <span
                      className={`mr-2 ${
                        checkRequirement(inp_username, requirement)
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {checkRequirement(inp_username, requirement) ? '✓' : '✗'}
                    </span>
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2">
              <h2 className="text-xl font-semibold">Password Requirements</h2>
              <div className="flex flex-col items-start mt-2 text-lg">
                {passwordRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center">
                    <span
                      className={`mr-2 ${
                        checkRequirement(inp_password, requirement)
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {checkRequirement(inp_password, requirement) ? '✓' : '✗'}
                    </span>
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager_Accountants;

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faRightFromBracket, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../app_variables';

const Accountant_Head_Bar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const history = useHistory();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {username} = useAppContext();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      closeDropdown();
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = () => {
    closeDropdown();
    history.push('/'); // Navigate to the logout or home page
  };
  

  return (
    <div className="relative top-0 w-full bg-white border-b border-gray-200 py-4 px-6 h-16 flex justify-between items-center">
      <div className='text-2xl'>{username}</div>
      <div className='flex space-x-4 justify-center items-center'>
        <div className='flex w-8 h-8 rounded-lg items-center justify-center border border-gray-300 text-gray-400 hover:text-black cursor-pointer'>
          <FontAwesomeIcon icon={faBell} />
        </div>
        <div className="relative" ref={dropdownRef}>
          <div
            className="bg-red-400 flex w-9 h-9 rounded-full items-center justify-center text-white cursor-pointer"
            onClick={toggleDropdown}
          >
            {username && (username[0].toUpperCase())}
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="relative space-y-2">
                <div className='flex w-full cursor-pointer px-3 py-2 space-x-4 items-center hover:bg-gray-200 rounded-xl' onClick={() => (history.push('/manager/profile'), closeDropdown())}>
                    <FontAwesomeIcon icon={faCircleUser} className='w-5 h-5'/>
                    <div className=''>My Profile</div>
                </div>
                <div className='flex w-full cursor-pointer px-3 py-2 space-x-4 items-center text-red-400 hover:bg-red-400 hover:text-white rounded-xl' onClick={() => handleSignOut()}>
                    <FontAwesomeIcon icon={faRightFromBracket} className='w-5 h-5'/>
                    <div className=''>Sign Out</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accountant_Head_Bar;

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faHome, faClock, faList, faSquareCheck} from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from '../components/app_variables';
import { useHistory, } from 'react-router-dom';

interface SearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pagename: string;
}

const HeadBar: React.FC<SearchProps> = ({ searchQuery, setSearchQuery, pagename }) => {
  const visiblePages = ['Home', 'Pending', 'To_Do', 'Paid'];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {username, all_invoices_number, pending_invoices_number, to_do_invoices_number, paid_invoices_number} = useAppContext();
  const history = useHistory();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="fixed top-0 pl-56 w-screen bg-white border border-gray-200 py-4 px-6 h-16 flex justify-center items-center">
      <div className="flex w-full justify-between items-center">
        <div>
          {visiblePages.includes(pagename) && (
            <div className='relative w-92'>
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search the account"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <FontAwesomeIcon
                  icon={faTimes}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>
          )}
        </div>
        <div className="absolute right-7">
          <div className="bg-red-400 flex w-10 h-10 rounded-full items-center justify-center text-white cursor-pointer" onClick={toggleDropdown}>
            {username && (<div>{username[0].toUpperCase()}</div>)}
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-6 pt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-md">
              <div className="absolute right-2 -top-2 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-200"></div>
              <div className=" grid grid-cols-2 gap-1 p-1 justify-center items-center">
                <div className='flex flex-col w-full hover:bg-black hover:text-white rounded-xl h-12 justify-center items-center space-y-2 cursor-pointer' onClick={() => (history.push('/home'))}>
                  <FontAwesomeIcon icon={faHome} />
                  <div className='text-xs'>{all_invoices_number}</div>
                </div>
                <div className='flex flex-col w-full hover:bg-black hover:text-white rounded-xl h-12 justify-center items-center space-y-2 cursor-pointer' onClick={() => (history.push('/pending'))}>
                  <FontAwesomeIcon icon={faClock} />
                  <div className='text-xs'>{pending_invoices_number}</div>
                </div>
                <div className='flex flex-col w-full hover:bg-black hover:text-white rounded-xl h-12 justify-center items-center space-y-2 cursor-pointer' onClick={() => (history.push('/to_do'))}>
                  <FontAwesomeIcon icon={faList} />
                  <div className='text-xs'>{to_do_invoices_number}</div>
                </div>
                <div className='flex flex-col w-full hover:bg-black hover:text-white rounded-xl h-12 justify-center items-center space-y-2 cursor-pointer' onClick={() => (history.push('/paid'))}>
                  <FontAwesomeIcon icon={faSquareCheck} />
                  <div className='text-xs'>{to_do_invoices_number}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HeadBar;

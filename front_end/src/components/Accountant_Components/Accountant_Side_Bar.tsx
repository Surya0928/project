import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownLeftAndUpRightToCenter, faUpRightAndDownLeftFromCenter, faGear, faAngleUp, faAngleDown, faVault, faClock, faUsers, faMoneyBills } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../app_variables';

interface Accountant_Side_Bar_Props {
  current_page: 'DashBoard' | 'All_Customers' | 'All_Invoices' |  'Pending_Customers' | 'Pending_Invoices' | 'Paid';
}

const Accountant_Side_Bar: React.FC<Accountant_Side_Bar_Props> = ({ current_page }) => {
  const history = useHistory();
  const [toggle_side_bar, set_toggle_side_bar] = useState<string | null>(sessionStorage.getItem("toggle_side_bar"));
  const [toggle_show_companies, set_toggle_show_companies] = useState<boolean>(false);
  const [toggle_show_receivables, set_toggle_show_receivables] = useState<boolean>(false);
  const [toggle_show_team, set_toggle_show_team] = useState<boolean>(false);
  const {id} = useAppContext();

  const handleToggleShowAll = () => {
    set_toggle_show_receivables(!toggle_show_receivables);
    set_toggle_show_team(false);
  };

  const handleToggleShowTeam = () => {
    set_toggle_show_receivables(false);
    set_toggle_show_team(!toggle_show_team);
  };

  return (
    <div>
      {toggle_side_bar =="false" ? (
        <div className='relative pt-4 h-screen w-52 text-sm bg-gray-800 text-white tracking-widest'>
          <div className='flex flex-col h-full justify-between items-center'>
            <div className='flex flex-col h-full space-y-3 items-center'>
              <div className='flex w-52 h-12 justify-between items-center border-b border-gray-900 px-4'>
                <div className='text-2xl font-semibold'>Vasool.ai</div>
                <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500' onClick={() => { set_toggle_side_bar("true"); sessionStorage.setItem("toggle_side_bar", "true") }}>
                  <FontAwesomeIcon
                    icon={faDownLeftAndUpRightToCenter}
                    className='font-normal'
                  />
                </div>
              </div>
              <div className='flex w-full flex-col space-y-3 px-2'>
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'DashBoard' ? 'bg-green-600' : ''}`} onClick={() => history.push('/accountant/dashboard')}>
                  <FontAwesomeIcon icon={faVault} style={{ height: '18px' }} />
                  <div>DashBoard</div>
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'All_Customers' && current_page!=='All_Invoices' ? '' : 'bg-green-600'}`} onClick={handleToggleShowAll}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faUsers} style={{ height: '18px' }} />
                      <div>All</div>
                    </div>
                    {toggle_show_receivables ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_receivables && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'All_Customers' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/customers'))}>
                        <div style={{ paddingLeft: '35px' }}>Customers</div>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'All_Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/invoices'))}>
                        <div style={{ paddingLeft: '35px' }}>Invoices</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'Pending_Customers' && current_page !=='Pending_Invoices' ? '' : 'bg-green-600'}`}  onClick={handleToggleShowTeam}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faClock} style={{ height: '18px' }} />
                      <div>Pending</div>
                    </div>
                    {toggle_show_team ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_team && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Pending_Customers' ? 'bg-green-600' : ''}`} onClick={()=> {history.push('/accountant/pending_customers')}}>
                        <div style={{ paddingLeft: '35px' }}>Customers</div>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Pending_Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/pending_invoices'))}>
                        <div style={{ paddingLeft: '35px' }}>Invoices</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Paid' ? 'bg-green-600' : ''}`} onClick={() => history.push('/accountant/paid_invoices')}>
                  <FontAwesomeIcon icon={faMoneyBills} style={{ height: '18px' }} />
                  <div>Paid</div>
                </div>
              </div>
            </div>
            <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500 mb-8' onClick={() => { history.push('/accountant/settings') }}>
              <FontAwesomeIcon
                icon={faGear}
                className='font-normal'
              />
            </div>
          </div>
        </div>
      ) : (
        <div className='relative pt-4 h-screen w-16 text-sm bg-gray-800 text-white tracking-widest'>
          <div className='flex flex-col h-full justify-between items-center'>
            <div className='flex flex-col h-full space-y-3 items-center'>
              <div className='flex w-auto h-12 items-center border-b border-gray-900 px-2'>
                <div className='container cursor-pointer w-full items-center justify-center rounded-lg p-2 hover:bg-green-500' onClick={() => { set_toggle_side_bar("false"); sessionStorage.setItem("toggle_side_bar", "false")}}>
                  <FontAwesomeIcon
                    icon={faUpRightAndDownLeftFromCenter}
                    className='font-normal'
                  />
                </div>
              </div>
              <div className='flex w-full flex-col space-y-3 px-2'>
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'DashBoard' ? 'bg-green-600' : ''}`} onClick={() => history.push('/accountant/dashboard')}>
                  <FontAwesomeIcon icon={faVault} style={{ height: '18px' }} />
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'All_Customers' && current_page!=='All_Invoices' ? '' : 'bg-green-600'}`} onClick={handleToggleShowAll}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faUsers} style={{ height: '18px' }} />
                    </div>
                    {toggle_show_receivables ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_receivables && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'All_Customers' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/customers'))}>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'All_Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/invoices'))}>
                      </div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'Pending_Customers' && current_page !=='Pending_Invoices' ? '' : 'bg-green-600'}`} onClick={handleToggleShowTeam}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faClock} style={{ height: '18px' }} />
                    </div>
                    {toggle_show_team ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_team && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Pending_Customers' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/pending_customers'))}>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Pending_Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/accountant/pending_invoices'))}>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Paid' ? 'bg-green-600' : ''}`} onClick={() => history.push('/accountant/paid_invoices')}>
                  <FontAwesomeIcon icon={faMoneyBills} style={{ height: '18px' }} />
                  <div></div>
                </div>
              </div>
            </div>
            <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500 mb-8' onClick={() => { history.push('/accountant/settings') }}>
              <FontAwesomeIcon
                icon={faGear}
                className='font-normal'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accountant_Side_Bar;

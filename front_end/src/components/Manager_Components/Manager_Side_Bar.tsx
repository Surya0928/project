import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownLeftAndUpRightToCenter, faUpRightAndDownLeftFromCenter, faGear, faAngleUp, faAngleDown, faVault, faArrowsDownToLine, faUsers, faLadderWater } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../app_variables';

interface Manager_Side_Bar_Props {
  current_page: 'DashBoard' | 'Profile' | 'Customers' | 'Invoices' | 'Activities' | 'Instructions' | 'A/R Accountants' | 'Sales Persons' | 'CEO';
}

const Manager_Side_Bar: React.FC<Manager_Side_Bar_Props> = ({ current_page }) => {
  const history = useHistory();
  const [toggle_side_bar, set_toggle_side_bar] = useState<string | null>(sessionStorage.getItem("toggle_side_bar"));
  const [toggle_show_receivables, set_toggle_show_receivables] = useState<boolean>(false);
  const [toggle_show_team, set_toggle_show_team] = useState<boolean>(false);
  const {id} = useAppContext();

  const handleToggleShowReceivables = () => {
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
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'DashBoard' ? 'bg-green-600' : ''}`} onClick={() => history.push('/manager/dashboard')}>
                  <FontAwesomeIcon icon={faVault} style={{ height: '18px' }} />
                  <div>DashBoard</div>
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'Customers' && current_page!=='Invoices' && current_page!=='Activities' ? '' : 'bg-green-600'}`} onClick={handleToggleShowReceivables}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faArrowsDownToLine} style={{ height: '18px' }} />
                      <div>Receivables</div>
                    </div>
                    {toggle_show_receivables ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_receivables && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Customers' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/customers'))}>
                        <div style={{ paddingLeft: '35px' }}>Customers</div>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/invoices'))}>
                        <div style={{ paddingLeft: '35px' }}>Invoices</div>
                      </div>
                      <div className='flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer'>
                        <div style={{ paddingLeft: '35px' }}>Activities</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'A/R Accountants' && current_page !=='Sales Persons' && current_page!='CEO' ? '' : 'bg-green-600'}`}  onClick={handleToggleShowTeam}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faUsers} style={{ height: '18px' }} />
                      <div>Team</div>
                    </div>
                    {toggle_show_team ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_team && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'A/R Accountants' ? 'bg-green-600' : ''}`} onClick={()=> {history.push('/manager/accountants')}}>
                        <div style={{ paddingLeft: '35px' }}>A/R Accountant</div>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Sales Persons' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/sales_persons'))}>
                        <div style={{ paddingLeft: '35px' }}>Sales Persons</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500 mb-8' onClick={() => { history.push('/manager/settings') }}>
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
                <div className={`flex rounded-lg px-2 w-full hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'DashBoard' ? 'bg-green-600' : ''}`} onClick={() => history.push('/manager/dashboard')}>
                  <FontAwesomeIcon icon={faVault} style={{ height: '18px' }} />
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'Customers' && current_page!=='Invoices' && current_page!=='Activities' ? '' : 'bg-green-600'}`} onClick={handleToggleShowReceivables}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faArrowsDownToLine} style={{ height: '18px' }} />
                    </div>
                    {toggle_show_receivables ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_receivables && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Customers' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/customers'))}>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Invoices' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/invoices'))}>
                      </div>
                      <div className='flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer'>
                      </div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col w-full h-auto space-y-3 justify-center items-center'>
                  <div className={`flex w-full justify-between items-center hover:bg-green-500 cursor-pointer rounded-lg px-2 ${current_page !== 'A/R Accountants' && current_page !=='Sales Persons' && current_page!='CEO' ? '' : 'bg-green-600'}`} onClick={handleToggleShowTeam}>
                    <div className='flex rounded-lg w-full hover:bg-green-500 py-2 text-sm items-center space-x-4'>
                      <FontAwesomeIcon icon={faUsers} style={{ height: '18px' }} />
                    </div>
                    {toggle_show_team ? (<FontAwesomeIcon icon={faAngleUp} className='w-3 h-3'/>) : (<FontAwesomeIcon icon={faAngleDown} className='w-3 h-3'/>)}
                  </div>
                  {toggle_show_team && (
                    <div className='flex flex-col text-sm w-full space-y-3 justify-self-center items-center'>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'A/R Accountants' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/accountants'))}>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'Sales Persons' ? 'bg-green-600' : ''}`} onClick={() => (history.push('/manager/sales_persons'))}>
                      </div>
                      <div className={`flex rounded-lg w-full px-2 hover:bg-green-500 py-2 text-sm items-center space-x-4 cursor-pointer ${current_page === 'A/R Accountants' ? 'bg-green-600' : ''}`}>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500 mb-8' onClick={() => { history.push('/manager/settings') }}>
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

export default Manager_Side_Bar;

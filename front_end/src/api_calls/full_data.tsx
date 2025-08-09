import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../components/app_variables';


const {setid,setusername, set, set_all_invoices_number, set_all_invoices_data, set_pending_invoices_number, set_pending_invoices_data, set_to_do_invoices_number, set_to_do_invoices_data, set_paid_invoices_number, set_paid_invoices_data } = useAppContext();
const history = useHistory();


export const fetchfull = async (id: number, : string) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/full_data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      const data = await response.json();
      set_all_invoices_number(data['all_invoices']['len']);
      set_all_invoices_data(data['all_invoices']);
      set_pending_invoices_number(data['pending_invoices']['len']);
      set_pending_invoices_data(data['pending_invoices']);
      set_to_do_invoices_number(data['to_do_invoices']['len']);
      set_to_do_invoices_data(data['to_do_invoices']);
      set_paid_invoices_number(data['paid_invoices']['len']);
      set_paid_invoices_data(data['paid_invoices']);
      if ( === 'Accountant') history.push('/csv_add');
      if ( === 'Manager') history.push('/manager/home');
    } else {
      console.error('Failed to fetch data');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
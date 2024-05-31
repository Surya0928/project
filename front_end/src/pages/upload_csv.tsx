import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';

const CSVUploadPage: React.FC = () => {
  const history = useHistory();
  const {user_id, username} = useAppContext();

  const handleUpload = async () => {
    const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    const file = csvFileInput.files?.[0];

    if (!file) {
      alert('Please select a CSV file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);
    {user_id && (
    formData.append('user_id', user_id.toString())
    )}

    try {
      const response = await fetch('http://165.232.188.250:8080/process_uploaded_csv/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
        alert('CSV file uploaded successfully!');
        history.push('/home');
      } else {
        console.error('Failed to upload CSV:', response.statusText);
        alert('Failed to upload CSV. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error uploading CSV. Please try again.');
    }
  };

  const handleUpdate = async () => {
    const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    const file = csvFileInput.files?.[0];

    if (!file) {
      alert('Please select a CSV file to update');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);
    {user_id && (
      formData.append('user_id', user_id.toString())
      )}

    try {
      const response = await fetch('http://165.232.188.250:8080/process_update_csv/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
        alert('CSV file updated successfully!');
        history.push('/home');
      } else {
        console.error('Failed to upload CSV:', response.statusText);
        alert('Failed to update CSV. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error updating CSV. Please try again.');
    }
  };

  return (
    <div className="flex flex-col space-y-10 w-screen h-screen justify-center items-center">
      <h1 className="text-5xl font-bold mb-4">Upload / Update CSV File</h1>
      <input
        type="file"
        id="csvFileInput"
        accept=".csv"
        className="border border-gray-300 rounded p-2 mb-4"
      />
      <div className='flex w-auto space-x-2'>
        <button onClick={handleUpload} className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 py-2 px-4 rounded">
          Create
        </button>
        <button onClick={handleUpdate} className="bg-green-500 hover:bg-green-700 text-white font-bold w-32 py-2 px-4 rounded">
          Update
        </button>
      </div>
      <button onClick={() => {history.push('/home')}} className="bg-red-500 hover:bg-red-700 text-white font-bold w-52 py-2 px-4 rounded">
        Go To Home
      </button>
    </div>
  );
};

export default CSVUploadPage;

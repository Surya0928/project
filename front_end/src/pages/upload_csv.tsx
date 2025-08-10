import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';

const CSVUploadPage: React.FC = () => {
  const history = useHistory();
  const { id, all_invoices_number } = useAppContext();

  useEffect(() => {
    console.log(all_invoices_number);
  }, []);

  const handleProcess = async (url: string) => {
    if (!id) {
      alert('User ID is not available');
      return;
    }

    const formData = new FormData();
    formData.append('id', id.toString());

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
        alert('Process completed successfully!');
        history.push('/review');
      } else {
        console.error('Failed to process:', response.statusText);
        alert('Failed to process. Please try again.');
      }
    } catch (error) {
      console.error('Error processing:', error);
      alert('Error processing. Please try again.');
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 space-y-10 w-screen h-screen justify-center items-center">
      <h1 className="text-5xl font-bold mb-4">Process Data</h1>
      <div className='flex w-auto space-x-2'>
        {all_invoices_number !== null && Number(all_invoices_number) === 0 && (
          <button 
            onClick={() => handleProcess('http://159.89.160.186:8000/process_uploaded_csv/')} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-32 py-2 px-4 rounded">
            Create
          </button>
        )}
        <button 
          onClick={() => handleProcess('http://159.89.160.186:8000/process_update_csv/')} 
          className="bg-green-500 hover:bg-green-700 text-white font-bold w-32 py-2 px-4 rounded">
          Update
        </button>
      </div>
      <button 
        onClick={() => history.push('/home')} 
        className="bg-red-500 hover:bg-red-700 text-white font-bold w-52 py-2 px-4 rounded">
        Go To Home
      </button>
    </div>
  );
};

export default CSVUploadPage;

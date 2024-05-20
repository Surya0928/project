import React from 'react';

const CSVUploadPage: React.FC = () => {
  const handleUpload = async () => {
    const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    const file = csvFileInput.files?.[0];

    if (!file) {
      alert('Please select a CSV file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/process_uploaded_csv/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);
        alert('CSV file uploaded successfully!');
      } else {
        console.error('Failed to upload CSV:', response.statusText);
        alert('Failed to upload CSV. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error uploading CSV. Please try again.');
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Upload CSV File</h1>
      <input
        type="file"
        id="csvFileInput"
        accept=".csv"
        className="border border-gray-300 rounded p-2 mb-4"
      />
      <button onClick={handleUpload} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Upload CSV
      </button>
    </div>
  );
};

export default CSVUploadPage;

'use client';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Loader from '@/components/common/Loader';

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Simulate connection
  const [files, setFiles] = useState([]); // Mock files

  // Simulate fetching files from GDrive via your MCP
  const fetchGDriveFiles = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be:
      // const response = await fetch('/api/gdrive/files');
      // const data = await response.json();
      // setFiles(data.files);
      
      // Mocking API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const mockFiles = [
        { id: 'file1', name: 'Competitor Analysis Q1.xlsx' },
        { id: 'file2', name: 'Keyword Research Data.xlsx' },
        { id: 'file3', name: 'Content Ideas.gsheet' },
      ];
      setFiles(mockFiles);
      updateProjectData({ gDriveFiles: mockFiles }); // Store in global context if needed
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to fetch GDrive files:", error);
      alert("Error fetching Google Drive files. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Simulate OAuth flow or connection trigger
    fetchGDriveFiles();
  };

  const handleFileSelect = (file) => {
    updateProjectData({ selectedGDriveFile: file });
    // You might automatically move to the next step or have a separate "Next" button
    // For now, let's assume selection is enough for this step
    alert(`Selected file: ${file.name}`);
  };

  const handleNext = () => {
    // Add validation if a file selection is mandatory
    // if (!projectData.selectedGDriveFile) {
    //   alert("Please select a file.");
    //   return;
    // }
    setActiveStep(STEPS[1].id);
  };

  return (
    <div className="step-component">
      <h3>1. Connect Google Drive & Select Source Data</h3>
      {!isConnected && !isLoading && (
        <>
          <p>Connect to your Google Drive to list spreadsheet files for data sourcing.</p>
          <button onClick={handleConnect}>Connect to Google Drive</button>
        </>
      )}
      {isLoading && <Loader />}
      {isConnected && !isLoading && (
        <>
          <h4>Available Spreadsheet Files:</h4>
          {files.length > 0 ? (
            <ul className="keyword-list"> {/* Reusing keyword-list style for simplicity */}
              {files.map((file) => (
                <li key={file.id}>
                  <span>{file.name}</span>
                  <button 
                    onClick={() => handleFileSelect(file)} 
                    className="secondary" 
                    style={{marginLeft: 'auto', padding: '5px 10px'}}>
                    Select
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No spreadsheet files found or accessible.</p>
          )}
          {projectData.selectedGDriveFile && (
            <p><strong>Selected:</strong> {projectData.selectedGDriveFile.name}</p>
          )}
        </>
      )}
      <button onClick={handleNext} disabled={isLoading}>Next: Keywords & LSI</button>
    </div>
  );
}
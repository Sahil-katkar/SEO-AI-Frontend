"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Simulate connection

  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate fetching files from GDrive via your MCP
  const fetchGDriveFiles = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be:
      // const response = await fetch('/api/gdrive/files');
      // const data = await response.json();
      // setFiles(data.files);

      // Mocking API call
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
      const mockFiles = [
        { id: "file1", name: "Competitor Analysis Q1.xlsx" },
        { id: "file2", name: "Keyword Research Data.xlsx" },
        { id: "file3", name: "Content Ideas.gsheet" },
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

  const handleListFiles = async () => {
    setLoading(true);
    setError(null);
    setFiles(null);
    try {
      const response = await fetch("/api/list-files");

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "API returned an error response:",
          response.status,
          errorData
        );
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const onlySpreadsheet = data.filter((item)=> item.mimeType === "application/vnd.google-apps.spreadsheet")

      setFiles(onlySpreadsheet);
      console.log("Successfully listed files:", data);
    } catch (e) {
      console.error("Failed to list files (caught error):", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-component">
      <h3>1. Connect Google Drive & Select Source Data</h3>
      <button
        onClick={handleListFiles}
        disabled={loading}
        className={`px-4 py-2 rounded text-white transition-colors ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading ? "Loading..." : "Connect to Google Drive and List Files"}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}
      {isLoading && <Loader />}
      {files !== null && error === null && (
        <div className="mt-4">
          <h4 className="text-xll text-[30px] font-semibold mb-2">Files:</h4>
          {files.length === 0 ? (
            <p>No files found in your Google Drive.</p>
          ) : (
            <ul className="space-y-1 keyword-list ">
              {files &&
                files.map((file, index) => (
                  <li
                    key={file.id || `${file.name}-${index}`}
                    className="break-words text-lg"
                  >
                    <strong>{file.name || "Unnamed File"}</strong>
                    {/* ({file.mimeType || "Unknown Type"}) */}
                    <button className="" onClick={handleNext}>Select</button>
                    {/* {file.webViewLink && file.webViewLink !== "N/A" && (
                      <>
                        {" - "}
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Online
                        </a>
                      </>
                    )} */}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
    // <div className="step-component">
    //   <h3>1. Connect Google Drive & Select Source Data</h3>
    //   {!isConnected && !isLoading && (
    //     <>
    //       <p>
    //         Connect to your Google Drive to list spreadsheet files for data
    //         sourcing.
    //       </p>
    //       {/* <button onClick={handleConnect}>Connect to Google Drive</button> */}
    //       <button
    //         onClick={handleListFiles}
    //         disabled={loading}
    //         className={`px-4 py-2 rounded text-white transition-colors ${
    //           loading
    //             ? "bg-gray-400 cursor-not-allowed"
    //             : "bg-blue-500 hover:bg-blue-600"
    //         }`}
    //       >
    //         {loading ? "Loading..." : "Connect to Google Drive and List Files"}
    //       </button>
    //     </>
    //   )}
    //   {isLoading && <Loader />}

    //   {isConnected && !isLoading && (
    //     <>
    //       <h4>Available Spreadsheet Files:</h4>
    //       {files.length > 0 ? (
    //         <ul className="keyword-list">
    //           {files.map((file) => (
    //             <li key={file.id}>
    //               <span>{file.name}</span>
    //               <button
    //                 onClick={() => handleFileSelect(file)}
    //                 className="secondary"
    //                 style={{ marginLeft: "auto", padding: "5px 10px" }}
    //               >
    //                 Select
    //               </button>
    //             </li>
    //           ))}
    //         </ul>
    //       ) : (
    //         <p>No spreadsheet files found or accessible.</p>
    //       )}
    //       {projectData.selectedGDriveFile && (
    //         <p>
    //           <strong>Selected:</strong> {projectData.selectedGDriveFile.name}
    //         </p>
    //       )}
    //     </>
    //   )}
    //   <button onClick={handleNext} disabled={isLoading}>
    //     Next: Keywords & LSI
    //   </button>
    // </div>
  );
}

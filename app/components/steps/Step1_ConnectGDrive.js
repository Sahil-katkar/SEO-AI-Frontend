"use client";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toastify styles

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingfirst, setLoadingFirst] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});

  // Handler to fetch file content by file_id
  const handleFetchFileContent = async (fileId) => {
    setLoadingFile(true);
    setError(null);
    setFileContent(null);
    try {
      const response = await fetch(
        `/api/file-content?file_id=${encodeURIComponent(fileId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error: ${response.status}`);
      }
      const data = await response.json();

      if (data.content) {
        setFileContent(data.content);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Unknown response from server.");
      }
    } catch (e) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFileToRepo = async (fileId, fileName) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [fileId]: "processing",
    }));
    setLoadingSave(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/file-content?file_id=${encodeURIComponent(fileId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched file content:", data.content);
      if (!data.content) {
        throw new Error(data.error || "No content found in file.");
      }

      const saveResponse = await fetch("/api/save-to-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName || `${fileId}.txt`,
          content: data.content,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(
          errorData.detail || `Save error: ${saveResponse.status}`
        );
      }

      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "processed",
      }));

      // Show toast notification
      toast.success("File processed successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      handleNext();
      updateProjectData({
        primaryKeyword: "football",
        primaryIntent: "This is intent.",
      });
    } catch (e) {
      console.error("Error saving file:", e);
      setError(e.message || "An unexpected error occurred");
      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "idle",
      }));
    } finally {
      setLoadingSave(false);
    }
  };

  // const fetchGDriveFiles = async () => {
  //   setIsLoading(true);
  //   try {
  //     await new Promise((resolve) => setTimeout(resolve, 1500));
  //     const mockFiles = [
  //       { id: "file1", name: "Competitor Analysis Q1.xlsx" },
  //       { id: "file2", name: "Keyword Research Data.xlsx" },
  //       { id: "file3", name: "Content Ideas.gsheet" },
  //     ];
  //     setFiles(mockFiles);
  //     updateProjectData({ gDriveFiles: mockFiles });
  //     setIsConnected(true);
  //   } catch (error) {
  //     console.error("Failed to fetch GDrive files:", error);
  //     alert("Error fetching Google Drive files. See console for details.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleConnect = () => {
  //   fetchGDriveFiles();
  // };

  // const handleFileSelect = (file) => {
  //   updateProjectData({ selectedGDriveFile: file });
  //   alert(`Selected file: ${file.name}`);
  // };

  const handleNext = () => {
    setActiveStep(STEPS[1].id);
  };

  const handleListFiles = async () => {
    setLoadingFirst(true);
    setIsLoading(true);
    setError(null);
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
      if (data) {
        updateProjectData({ isGDriveConnected: true });
        const onlySpreadsheet = data.filter(
          (item) => item.mimeType === "application/vnd.google-apps.spreadsheet"
        );
        updateProjectData({ gDriveFiles: onlySpreadsheet });
        setLoadingFirst(false);
        console.log("Successfully listed files:", data);
      }
    } catch (e) {
      console.error("Failed to list files (caught error):", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="step-component">
      <h3>1. Connect Google Drive & Select Source Data</h3>
      <button
        onClick={handleListFiles}
        disabled={loadingfirst}
        className={`px-4 py-2 rounded text-white transition-colors ${
          loadingfirst
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loadingfirst ? "Loading..." : "Connect to Google Drive and List Files"}
      </button>
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {isLoading && <Loader />}

      {projectData.isGDriveConnected ? (
        <>
          <div className="mt-4">
            {projectData.gDriveFiles.length === 0 ? (
              <>
                <h4 className="text-xll text-[30px] font-semibold mb-2">
                  Files:
                </h4>
                <p>No files found in your Google Drive.</p>
              </>
            ) : (
              <>
                <h4 className="text-xll text-[30px] font-semibold mb-2">
                  Files:
                </h4>
                <ul className="space-y-1 keyword-list">
                  {projectData?.gDriveFiles &&
                    projectData?.gDriveFiles.map((file, index) => {
                      const status = processingStatus[file.id] || "idle";
                      return (
                        <li
                          key={file.id || `${file.name}-${index}`}
                          className="break-words text-lg flex items-center justify-between"
                        >
                          <strong>{file.name || "Unnamed File"}</strong>
                          <button
                            onClick={() =>
                              handleSaveFileToRepo(file.id, file.name)
                            }
                            disabled={
                              status === "processing" || status === "processed"
                            }
                            className={`ml-4 px-3 py-1 rounded text-white transition-colors ${
                              status === "processing"
                                ? "bg-gray-400 cursor-not-allowed"
                                : status === "processed"
                                ? "bg-green-500 cursor-default"
                                : "bg-blue-500 hover:bg-blue-600"
                            }`}
                          >
                            {status === "processing"
                              ? "Processing..."
                              : status === "processed"
                              ? "File processed!"
                              : "Select"}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
          </div>
        </>
      ) : (
        <></>
      )}

      {/* {projectData.gDriveFiles !== null && error === null ? (
        <div className="mt-4">
          {projectData.gDriveFiles.length === 0 ? (
            <>
              <h4 className="text-xll text-[30px] font-semibold mb-2">
                Files:
              </h4>
              <p>No files found in your Google Drive.</p>
            </>
          ) : (
            <>
              <h4 className="text-xll text-[30px] font-semibold mb-2">
                Files:
              </h4>
              <ul className="space-y-1 keyword-list">
                {projectData?.gDriveFiles &&
                  projectData?.gDriveFiles.map((file, index) => {
                    const status = processingStatus[file.id] || "idle";
                    return (
                      <li
                        key={file.id || `${file.name}-${index}`}
                        className="break-words text-lg flex items-center justify-between"
                      >
                        <strong>{file.name || "Unnamed File"}</strong>
                        <button
                          onClick={() =>
                            handleSaveFileToRepo(file.id, file.name)
                          }
                          disabled={
                            status === "processing" || status === "processed"
                          }
                          className={`ml-4 px-3 py-1 rounded text-white transition-colors ${
                            status === "processing"
                              ? "bg-gray-400 cursor-not-allowed"
                              : status === "processed"
                              ? "bg-green-500 cursor-default"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          {status === "processing"
                            ? "Processing..."
                            : status === "processed"
                            ? "File processed!"
                            : "Select"}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>
      ) : (
        <></>
      )} */}

      {fileContent && (
        <div className="mt-4 p-3 border border-gray-300 rounded">
          <h2 className="font-semibold">File Content:</h2>
          <pre>{fileContent}</pre>
        </div>
      )}

      {/* Add ToastContainer to render toasts */}
      <ToastContainer />
    </div>
  );
}

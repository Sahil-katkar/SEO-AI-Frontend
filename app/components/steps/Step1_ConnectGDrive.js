// app/components/Step1_ConnectGDrive.jsx
"use client";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/Reactify.css"; // Corrected typo here, was Toastify.css

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [userId, setUserId] = useState("123"); // Assuming a default or fetched user ID

  // State to hold the output from the /api/agent_status call
  const [agentStatusOutput, setAgentStatusOutput] = useState(null);

  // In app/components/Step1_ConnectGDrive.jsx, update the statusFetchPromise in handleCallMainAgent

  const handleCallMainAgent = async () => {
    setIsLoading(true);
    setError(null);
    setAgentStatusOutput(null);

    try {
      console.log(
        "Initiating /api/call-main-agent and /api/agent_status simultaneously"
      );

      const gdriveFetchPromise = fetch("/api/call-main-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      // Updated to GET request with query parameter
      const statusFetchPromise = fetch(
        `/api/agent_status?PRIMARY_KEYWORD=${encodeURIComponent("Strapi CMS")}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const [gdriveResponse, statusResponse] = await Promise.all([
        gdriveFetchPromise,
        statusFetchPromise,
      ]);

      if (!gdriveResponse.ok) {
        const errorData = await gdriveResponse.json();
        throw new Error(
          errorData.detail ||
            `GDrive connection HTTP error! status: ${gdriveResponse.status}`
        );
      }

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(
          errorData.detail ||
            `Agent status HTTP error! status: ${statusResponse.status}`
        );
      }

      const gdriveData = await gdriveResponse.json();
      const statusData = await statusResponse.json();

      console.log("Response from /call_main_agent:", gdriveData);
      console.log("Response from /api/agent_status:", statusData);

      updateProjectData({
        isGDriveConnected: true,
        gDriveFiles: gdriveData.files || projectData.gDriveFiles || [],
        agentEvent: gdriveData,
      });

      setAgentStatusOutput(statusData);

      toast.success("Connection, processing, and status update completed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (e) {
      console.error("Error during simultaneous API calls:", e);
      setError(e.message || "An unexpected error occurred during the process.");
      setAgentStatusOutput(null);
      toast.error(`Error: ${e.message || "Failed to complete the process."}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // ... rest of the component (handleSaveFileToRepo, return JSX) remains the same
  // Make sure the JSX part correctly displays `agentStatusOutput`

  const handleSaveFileToRepo = async (fileId, fileName) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [fileId]: "processing",
    }));
    setIsLoading(true); // Keep main loader active
    setError(null);
    try {
      // Fetch file content
      const response = await fetch(
        `/api/file-content?file_id=${encodeURIComponent(fileId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            `HTTP error fetching file content: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("Fetched file content:", data.content);
      if (!data.content) {
        throw new Error(data.error || "No content found in file.");
      }

      // Save content to repo
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
          errorData.detail || `Save to repo error: ${saveResponse.status}`
        );
      }

      // Update status for this specific file
      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "processed",
      }));

      toast.success("File processed successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Assuming processing ONE file is enough to proceed to the next step
      // If multiple files need processing, you might move this state update
      // to a place that checks if all selected files are processed.
      updateProjectData({
        // Example updates - replace with actual data if available
        primaryKeyword: "football",
        primaryIntent: "This is intent.",
      });
      // Proceed to next step after successful file processing
      setActiveStep(STEPS[1].id);
    } catch (e) {
      console.error("Error processing file:", e);
      setError(e.message || "An unexpected error occurred");
      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "idle", // Reset status on error
      }));
      toast.error(`Error: ${e.message || "Failed to process file."}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false); // Ensure main loader is turned off
    }
  };

  return (
    <div className="step-component">
      <h3>1. Connect Google Drive & Select Source Data</h3>

      {/* UserId input - currently hardcoded in state */}
      {/* You might want to add an input field here to set the userId state */}
      {/*
      <div className="mb-4">
        <label htmlFor="userId" className="block text-sm font-medium text-gray-700">User ID:</label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter User ID"
        />
      </div>
      */}

      <button
        onClick={handleCallMainAgent}
        disabled={isLoading || !userId} // Button disabled if loading or userId is empty
        className={`px-4 py-2 rounded text-white transition-colors ${
          isLoading || !userId
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isLoading
          ? "Processing..."
          : "Connect to Google Drive & Update Status"}{" "}
        {/* Updated button text */}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Using a single Loader component controlled by isLoading */}
      {isLoading && <Loader />}

      {projectData.isGDriveConnected && (
        <div className="mt-4">
          {/* Files list is currently driven by projectData.gDriveFiles,
               which needs to be populated by the /call-main-agent response
               or another mechanism for this list to appear.
               You will need to modify your backend /api/call-main-agent to return
               the list of files and update the `updateProjectData` call above accordingly.
           */}
          {projectData.gDriveFiles && projectData.gDriveFiles.length > 0 ? (
            <>
              <h4 className="text-3xl font-semibold mb-2">Found Files:</h4>
              <ul className="space-y-1 keyword-list">
                {projectData.gDriveFiles.map((file, index) => {
                  const status = processingStatus[file.id] || "idle";
                  return (
                    <li
                      key={file.id || `${file.name}-${index}`} // Use unique key
                      className="break-words text-lg flex items-center justify-between border-b border-gray-200 py-2"
                    >
                      <span className="flex-grow pr-2">
                        {file.name || "Unnamed File"}
                      </span>
                      <button
                        onClick={() => handleSaveFileToRepo(file.id, file.name)}
                        disabled={
                          isLoading ||
                          status === "processing" ||
                          status === "processed" // Disable if overall loading or specific file processing
                        }
                        className={`ml-4 px-3 py-1 rounded text-white transition-colors text-sm ${
                          isLoading || status === "processing"
                            ? "bg-gray-400 cursor-not-allowed"
                            : status === "processed"
                            ? "bg-green-500 cursor-default"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {status === "processing"
                          ? "Processing..."
                          : status === "processed"
                          ? "Processed"
                          : "Select & Process"}{" "}
                        {/* Updated button text */}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            // Display message if isGDriveConnected is true but no files are listed
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <p>
                Connected to Google Drive. No files were found or listed from
                the initial connection process.
              </p>
              {/* Consider adding instructions on where to place files or a refresh mechanism */}
            </div>
          )}
        </div>
      )}

      {/* Display agent status output from the *second* API call */}
      {agentStatusOutput && (
        <div className="mt-4 p-3 border border-gray-300 rounded max-w-full overflow-auto">
          <h4 className="text-xl font-semibold mb-2">Agent Status Output:</h4>
          <pre className="text-sm bg-gray-50 p-2 rounded">
            {JSON.stringify(agentStatusOutput, null, 2)}
          </pre>
        </div>
      )}

      {/* This block is removed as requested */}
      {/*
      {projectData.agentEvent && (
        <div className="mt-4 p-3 border border-gray-300 rounded max-w-full overflow-auto">
          <h4 className="text-xl font-semibold mb-2">Agent Event Output (from /call-main-agent):</h4>
          <pre className="text-sm bg-gray-50 p-2 rounded">
            {JSON.stringify(projectData.agentEvent, null, 2)}
          </pre>
        </div>
      )}
      */}

      <ToastContainer />
    </div>
  );
}

"use client";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [userId, setUserId] = useState("123"); // Assuming a default or fetched user ID
  const [agentStatusOutput, setAgentStatusOutput] = useState(null);
  const pollingRef = useRef(null); // To store the polling interval ID

  const startPollingAgentStatus = () => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Start polling every 4 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch(
          `/api/agent_status?PRIMARY_KEYWORD=${encodeURIComponent(
            "Strapi CMS"
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(
            errorData.detail ||
              `Agent status HTTP error! status: ${statusResponse.status}`
          );
        }

        const statusData = await statusResponse.json();
        console.log("Polling /api/agent_status:", statusData);
        setAgentStatusOutput(statusData);
      } catch (e) {
        console.error("Error during polling /api/agent_status:", e);
        setError(e.message || "Failed to fetch agent status.");
        setAgentStatusOutput(null);
        clearInterval(pollingRef.current); // Stop polling on error
        pollingRef.current = null;
        setIsLoading(false);
        toast.error(
          `Polling Error: ${e.message || "Failed to fetch agent status."}`,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    }, 4000); // Poll every 4 seconds
  };

  const handleCallMainAgent = async () => {
    setIsLoading(true);
    setError(null);
    setAgentStatusOutput(null);

    try {
      console.log("Initiating /api/call-main-agent and starting polling");

      // Start polling immediately
      startPollingAgentStatus();

      // Initiate /api/call-main-agent
      const gdriveResponse = await fetch("/api/call-main-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      // Stop polling when /api/call-main-agent responds
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      if (!gdriveResponse.ok) {
        const errorData = await gdriveResponse.json();
        throw new Error(
          errorData.detail ||
            `GDrive connection HTTP error! status: ${gdriveResponse.status}`
        );
      }

      const gdriveData = await gdriveResponse.json();
      console.log("Response from /call_main_agent:", gdriveData);

      updateProjectData({
        isGDriveConnected: true,
        gDriveFiles: gdriveData.files || projectData.gDriveFiles || [],
        agentEvent: gdriveData,
      });

      setIsLoading(false); // Stop loading after main agent success
      toast.success("Google Drive connection completed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (e) {
      console.error("Error during /api/call-main-agent:", e);
      setError(e.message || "An unexpected error occurred during the process.");
      setAgentStatusOutput(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current); // Stop polling on main agent error
        pollingRef.current = null;
      }
      setIsLoading(false);
      toast.error(`Error: ${e.message || "Failed to initiate process."}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const handleSaveFileToRepo = async (fileId, fileName) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [fileId]: "processing",
    }));
    setIsLoading(true);
    setError(null);
    try {
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

      updateProjectData({
        primaryKeyword: "football",
        primaryIntent: "This is intent.",
      });
      setActiveStep(STEPS[1].id);
    } catch (e) {
      console.error("Error processing file:", e);
      setError(e.message || "An unexpected error occurred");
      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "idle",
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
      setIsLoading(false);
    }
  };

  return (
    <div className="step-component">
      <h3>1. Connect Google Drive & Select Source Data</h3>

      <button
        onClick={handleCallMainAgent}
        disabled={isLoading || !userId}
        className={`px-4 py-2 rounded text-white transition-colors ${
          isLoading || !userId
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isLoading ? "Processing..." : "Connect to Google Drive & Poll Status"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {isLoading && <Loader />}

      {projectData.isGDriveConnected && (
        <div className="mt-4">
          {projectData.gDriveFiles && projectData.gDriveFiles.length > 0 ? (
            <>
              <h4 className="text-3xl font-semibold mb-2">Found Files:</h4>
              <ul className="space-y-1 keyword-list">
                {projectData.gDriveFiles.map((file, index) => {
                  const status = processingStatus[file.id] || "idle";
                  return (
                    <li
                      key={file.id || `${file.name}-${index}`}
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
                          status === "processed"
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
                          : "Select & Process"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <p>
                Connected to Google Drive. No files were found or listed from
                the initial connection process.
              </p>
            </div>
          )}
        </div>
      )}

      {agentStatusOutput && (
        <div className="mt-4 p-3 border border-gray-300 rounded max-w-full overflow-auto">
          <h4 className="text-xl font-semibold mb-2">Agent Status Output:</h4>
          <pre className="text-sm bg-gray-50 p-2 rounded">
            {JSON.stringify(agentStatusOutput, null, 2)}
          </pre>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

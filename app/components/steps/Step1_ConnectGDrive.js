// app/components/Step1_ConnectGDrive.jsx
"use client";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect, useRef } from "react"; // Import useEffect and useRef
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Use JSDoc to define the shape of the status data for documentation/hinting
/**
 * @typedef {object} AgentStatusData
 * @property {string} status - e.g., 'queued', 'running', 'completed', 'failed', 'not_found'
 * @property {string} primary_keyword - Key used for tracking
 * @property {string} [stage] - Optional: e.g., 'main_agent', 'intent_agent'
 * @property {string} [progress] - Optional: Specific step within the stage, e.g., 'fetching_urls'
 * @property {string} [details] - Optional: Error messages or specific info
 * @property {string} [timestamp] - Optional: When the status was last updated (ISO string)
 */

// Assume your backend is running on http://localhost:8000 during development
// Use NEXT_PUBLIC_BACKEND_URL environment variable for production deployment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();

  // State for the input form (used to trigger the agent)
  const [inputKeyword, setInputKeyword] = useState("");
  // Use initial state appropriate for JS array of strings
  const [inputUrls, setInputUrls] = useState([""]);
  const [userId, setUserId] = useState("user-123"); // Default or fetched user ID

  // State for the trigger process
  const [isTriggeringTask, setIsTriggeringTask] = useState(false);
  const [triggerError, setTriggerError] = useState(null); // Use null for no error

  // State for tracking and polling status of a specific task
  // useState initialized with null, JSDoc typedef provides shape hint
  const [currentTaskKeywordBeingTracked, setCurrentTaskKeywordBeingTracked] =
    useState(null);
  /** @type {AgentStatusData | null} */ // JSDoc type annotation for the state variable
  const [taskStatusData, setTaskStatusData] = useState(null);
  const [isPolling, setIsPolling] = useState(false); // Track if polling is active

  // State for GDrive file processing (separate from main agent task)
  // JSDoc for object shape: { [key: string]: 'idle' | 'processing' | 'processed' }
  const [processingStatus, setProcessingStatus] = useState({});
  const [isListingFiles, setIsListingFiles] = useState(false); // Loading state for listing files

  // Use ref to hold interval ID (type hint added via JSDoc)
  /** @type {NodeJS.Timeout | null} */
  const pollingIntervalRef = useRef(null);

  const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds

  // --- Effect Hook for Polling ---
  useEffect(() => {
    // This effect runs when currentTaskKeywordBeingTracked changes
    if (!currentTaskKeywordBeingTracked) {
      // If no keyword is being tracked, stop any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false); // Ensure polling state is false
      setTaskStatusData(null); // Clear status display
      return; // Nothing to track
    }

    // If a keyword is being tracked, start polling
    setIsPolling(true);
    setTaskStatusData(null); // Clear status data from previous tasks
    console.log(
      `Starting polling for keyword: "${currentTaskKeywordBeingTracked}"`
    );

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/agent_status?primary_keyword=${encodeURIComponent(
            currentTaskKeywordBeingTracked
          )}`
        );

        if (!response.ok) {
          // Handle API errors during polling
          // Specific handling for 404 if the task hasn't registered yet
          if (response.status === 404) {
            console.log(
              `Polling: Status for "${currentTaskKeywordBeingTracked}" not found yet (404).`
            );
            // Set a 'not_found' status or just ignore this poll if you want to wait silently
            // Setting 'not_found' makes the UI responsive immediately
            // Using JSDoc type hint for the object literal
            /** @type {AgentStatusData} */
            const notFoundStatus = {
              status: "not_found",
              primary_keyword: currentTaskKeywordBeingTracked,
              details: "Task status not yet registered.",
            };
            setTaskStatusData(notFoundStatus);
            return; // Continue polling
          }
          const errorData = await response.json();
          // For other non-OK statuses, treat as a polling error
          throw new Error(
            `Polling HTTP error! status: ${response.status}, detail: ${
              errorData.detail || "Unknown error"
            }`
          );
        }

        /** @type {AgentStatusData} */ // JSDoc type hint for the received data
        const data = await response.json();
        console.log("Polling update:", data);
        setTaskStatusData(data);

        // Check for completion or failure states
        if (data.status === "completed" || data.status === "failed") {
          console.log(
            `Polling stopped: Task for "${currentTaskKeywordBeingTracked}" finished with status: ${data.status}`
          );
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current); // Stop polling
            pollingIntervalRef.current = null;
          }
          setIsPolling(false); // Ensure polling state is false

          // --- Handle Task Completion or Failure ---
          if (data.status === "completed") {
            toast.success(
              `Task for "${currentTaskKeywordBeingTracked}" completed!`,
              { autoClose: 5000 }
            );
            // Decide what happens next on completion
            // Maybe transition to the next step or enable other actions
            // For example, update projectData with results if available
            // updateProjectData({ generatedArticle: "..." }); // Example
            // setActiveStep(STEPS[1].id); // Move to next step - only if this component manages step transitions
          } else {
            // status === 'failed'
            toast.error(
              `Task for "${currentTaskKeywordBeingTracked}" failed: ${data.details}`,
              { autoClose: 10000 }
            );
            // Handle failure (e.g., show retry option, keep status displayed)
          }
        }
        // If status is 'running', 'queued', or 'not_found', the interval continues due to setInterval
      } catch (e) {
        // Catch error without type hint in plain JS
        console.error("Polling error:", e);
        // Stop polling on error to prevent infinite loops if the endpoint is broken
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false); // Ensure polling state is false

        // Update status data to reflect the polling failure
        setTaskStatusData((prev) => {
          // If we have previous status data, update it to failed
          if (prev) {
            return {
              ...prev,
              status: "failed",
              details: `Polling failed: ${e.message}`,
              timestamp: new Date().toISOString(), // Update timestamp
            };
          }
          // If no previous status data, create a new failed state
          /** @type {AgentStatusData} */
          const failedStatus = {
            status: "failed",
            primary_keyword: currentTaskKeywordBeingTracked || "unknown",
            details: `Polling failed: ${e.message}`,
            timestamp: new Date().toISOString(),
          };
          return failedStatus;
        });

        // Set a general component error
        setError(e.message || "An unexpected error occurred during polling.");
        toast.error(
          `Polling error: ${e.message || "An unexpected error occurred."}`,
          { autoClose: 10000 }
        );
      }
    };

    // Clear any existing interval before setting a new one (important on dependency change)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start the initial fetch immediately, then set up the interval
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, POLLING_INTERVAL_MS);

    // Cleanup function: runs when component unmounts or dependencies change
    return () => {
      console.log(
        `Cleanup: Clearing polling interval for "${currentTaskKeywordBeingTracked}"`
      );
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentTaskKeywordBeingTracked, STEPS]); // Rerun effect if the keyword to track changes

  // Add/remove URL input fields
  const handleAddUrlInput = () => setInputUrls([...inputUrls, ""]);
  // Type hint for index added via JSDoc in plain JS is not typical for inline lambdas like this
  const handleRemoveUrlInput = (index) =>
    setInputUrls(inputUrls.filter((_, i) => i !== index));
  // Type hint for index and value added via JSDoc
  /**
   * @param {number} index
   * @param {string} value
   */
  const handleUrlInputChange = (index, value) => {
    const newUrls = [...inputUrls];
    newUrls[index] = value;
    setInputUrls(newUrls);
  };

  // --- Handler to Trigger the Agent Task ---
  const handleTriggerMainAgent = async () => {
    // --- Validation ---
    if (!userId) {
      toast.warning("User ID is required.");
      return;
    }
    if (!inputKeyword.trim()) {
      toast.warning("Primary Keyword is required.");
      return;
    }
    const validUrls = inputUrls.filter((url) => url.trim() !== "");
    if (validUrls.length === 0) {
      toast.warning("Please add at least one competitor URL.");
      return;
    }

    // Check if a task for this keyword is already being tracked and is not in a final state
    // Access status safely using optional chaining and checking against null
    if (
      currentTaskKeywordBeingTracked === inputKeyword.trim() &&
      isPolling &&
      taskStatusData?.status !== "completed" &&
      taskStatusData?.status !== "failed"
    ) {
      toast.info(
        `Already tracking task for "${inputKeyword.trim()}" (Status: ${
          taskStatusData?.status || "checking..."
        }).`
      );
      // Ensure polling is active if it somehow stopped but status isn't final
      // This logic might be complex; setting the keyword again might be sufficient
      if (!isPolling && pollingIntervalRef.current === null) {
        setCurrentTaskKeywordBeingTracked(inputKeyword.trim()); // This will trigger the useEffect to restart polling
      }
      return; // Don't trigger again if already tracking this specific keyword task
    }

    // --- Trigger Logic ---
    setIsTriggeringTask(true); // Use dedicated triggering state
    setError(null); // Clear general error
    setTriggerError(null); // Clear trigger specific error
    setTaskStatusData(null); // Clear status display for any previous tasks
    setCurrentTaskKeywordBeingTracked(null); // Explicitly stop tracking any previous task before starting new

    try {
      console.log("Calling /api/call_main_agent to trigger task...");

      const response = await fetch(`${API_BASE_URL}/call_main_agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          primary_keyword: inputKeyword.trim(), // Pass the keyword
          urls: validUrls, // Pass the URLs
        }),
      });

      const result = await response.json();
      console.log("Response from /call_main_agent:", result);

      // Check the HTTP status code first
      if (!response.ok) {
        // Handle backend errors from the trigger endpoint (e.g., 400, 500 series)
        const errorDetail = result.detail || JSON.stringify(result);
        throw new Error(
          `Trigger agent HTTP error! status: ${response.status}, detail: ${errorDetail}`
        );
      }

      // Check the response payload status (assuming backend returns 'accepted' or 'already_running')
      if (result.status === "accepted" && result.primary_keyword) {
        // Ensure primary_keyword is in the response
        toast.success(
          `Task for "${result.primary_keyword}" accepted! Starting status tracking.`,
          { autoClose: 3000 }
        );
        // Set the state variable that triggers the polling useEffect
        setCurrentTaskKeywordBeingTracked(result.primary_keyword);
        // You might update projectData here if the trigger response includes initial info
        // updateProjectData({ someInitialInfo: result.initial_data });
        // Clear the input form after successful trigger
        setInputKeyword("");
        setInputUrls([""]); // Reset URLs to one empty field
      } else if (
        result.status === "already_running" &&
        result.primary_keyword
      ) {
        // Ensure primary_keyword is in the response
        toast.info(
          `Task for "${result.primary_keyword}" is already running or queued. Displaying status.`,
          { autoClose: 3000 }
        );
        // Set the state variable to start tracking the existing task
        setCurrentTaskKeywordBeingTracked(result.primary_keyword);
        // Clear the input form
        setInputKeyword("");
        setInputUrls([""]);
      } else {
        // Handle unexpected status in the payload (e.g., custom backend error status)
        const errorDetail = result.message || JSON.stringify(result);
        setTriggerError(
          `Unexpected response status from backend: ${result.status}. Message: ${errorDetail}`
        );
        toast.error(`Unexpected response from backend: ${result.status}`, {
          autoClose: 5000,
        });
      }
    } catch (e) {
      // Catch error without type hint
      console.error("Error triggering agent:", e);
      setTriggerError(e.message || "Failed to trigger agent.");
      setError(e.message || "An unexpected error occurred."); // Also set general error state if needed
      toast.error(
        `Trigger failed: ${e.message || "An unexpected error occurred."}`,
        { autoClose: 5000 }
      );
      setCurrentTaskKeywordBeingTracked(null); // Ensure no polling starts if trigger fails before setting keyword
    } finally {
      setIsTriggeringTask(false); // Always turn off triggering state
    }
  };

  // --- Handler to just list GDrive files (Separate action) ---
  const handleListGDriveFiles = async () => {
    setIsListingFiles(true); // Use a dedicated loading state for listing files
    setError(null); // Clear general errors
    try {
      // Assuming a backend endpoint specifically for listing files (e.g., in your api/ route handler)
      const response = await fetch(`${API_BASE_URL}/api/list-gdrive-files`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error listing files: ${response.status}`
        );
      }
      const data = await response.json();
      console.log("GDrive Files:", data.files);
      updateProjectData({
        isGDriveConnected: true, // Assume success means connected enough to list
        gDriveFiles: data.files || [],
      });
      toast.success("Google Drive files listed.", { autoClose: 3000 });
    } catch (e) {
      // Catch error without type hint
      console.error("Error listing GDrive files:", e);
      setError(e.message || "Failed to list Google Drive files.");
      toast.error(
        `Failed to list GDrive files: ${
          e.message || "An unexpected error occurred."
        }`,
        { autoClose: 5000 }
      );
      updateProjectData({
        isGDriveConnected: false, // Assume failure means not connected or error
        gDriveFiles: [],
      });
    } finally {
      setIsListingFiles(false); // Turn off loading state
    }
  };

  // --- Handler to process a specific file (Separate action) ---
  // This seems designed to take a file from the list and load its content
  // which might contain keywords/URLs to be used for the main agent.
  const handleSaveFileToRepo = async (fileId, fileName) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [fileId]: "processing",
    }));
    // No general isLoading toggle here to avoid blocking the whole component
    setError(null); // Clear general errors

    try {
      // Fetch file content (assuming a backend endpoint for this)
      const response = await fetch(
        `${API_BASE_URL}/api/file-content?file_id=${encodeURIComponent(
          fileId
        )}`,
        {
          headers: { "Content-Type": "application/json" }, // Ensure correct headers
        }
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

      // Save content to repo (assuming this saves the *source* content, not generated article)
      const saveResponse = await fetch(`${API_BASE_URL}/api/save-to-repo`, {
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

      toast.success("File processed successfully! Content loaded for agent.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Attempt to parse file content and populate input fields
      if (data.content) {
        try {
          const fileContentJson = JSON.parse(data.content);
          if (
            fileContentJson.keywords &&
            Array.isArray(fileContentJson.keywords) &&
            fileContentJson.keywords.length > 0
          ) {
            setInputKeyword(fileContentJson.keywords[0]); // Set first keyword as primary
            toast.info(
              `Primary Keyword set to: "${fileContentJson.keywords[0]}"`,
              { autoClose: 3000 }
            );
          } else {
            setInputKeyword(""); // Clear if no keywords found
            toast.warning("No keywords found in the processed file.", {
              autoClose: 3000,
            });
          }
          if (
            fileContentJson.competitors &&
            Array.isArray(fileContentJson.competitors) &&
            fileContentJson.competitors.length > 0
          ) {
            setInputUrls(fileContentJson.competitors); // Set competitors as URLs
            toast.info(`Competitor URLs loaded from file.`, {
              autoClose: 3000,
            });
          } else {
            setInputUrls([""]); // Reset to one empty field if no URLs found
            toast.warning("No competitor URLs found in the processed file.", {
              autoClose: 3000,
            });
          }
          // Maybe set isGDriveConnected to true here as well if this step confirms GDrive connection
          // updateProjectData({ isGDriveConnected: true }); // Already handled by list action?
        } catch (parseError) {
          console.error("Error parsing file content as JSON:", parseError);
          toast.warning(
            "Processed file content, but could not parse as JSON for keywords/URLs.",
            { autoClose: 5000 }
          );
          setInputKeyword(""); // Clear inputs on parse error
          setInputUrls([""]);
        }
      }
    } catch (e) {
      // Catch error without type hint
      console.error("Error processing file:", e);
      setError(e.message || "An unexpected error occurred");
      setProcessingStatus((prev) => ({
        ...prev,
        [fileId]: "idle", // Reset status on error
      }));
      toast.error(
        `Error processing file: ${e.message || "Failed to process file."}`,
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
    // No final finally block with setIsLoading(false) to avoid interfering
    // with overall component state/other loaders
  };

  // Determine if the main form should be disabled
  const isFormDisabled = isTriggeringTask || isPolling;

  // Determine overall loading state for the component's main loader (optional)
  // This loader is shown if any significant background process is happening.
  const overallComponentLoading =
    isTriggeringTask || isPolling || isListingFiles;

  return (
    <div className="step-component p-6 bg-white shadow rounded-lg">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">
        1. Prepare Source Data & Trigger Agent
      </h3>
      {/* User ID display/input (optional based on your auth) */}
      <div className="mb-4 text-sm text-gray-600">
        Current User ID: <strong>{userId}</strong>{" "}
        {/* Displaying current userId */}
        {/* Add input if you need user to enter/change it */}
      </div>
      {/* Button to list GDrive files - Appears if files aren't listed yet */}
      {!projectData.isGDriveConnected ||
      !projectData.gDriveFiles ||
      projectData.gDriveFiles.length === 0 ? (
        <button
          onClick={handleListGDriveFiles}
          disabled={overallComponentLoading}
          className={`px-4 py-2 rounded text-white transition-colors mb-6 ${
            overallComponentLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isListingFiles
            ? "Loading Files from GDrive..."
            : "List Google Drive Files"}
        </button>
      ) : (
        // Display GDrive files list if connected and files are found
        <div className="mt-4 mb-6 p-4 border border-gray-200 rounded bg-gray-50">
          <h4 className="text-xl font-semibold mb-3 text-gray-700">
            Select & Load Source File (Keywords/URLs):
          </h4>
          <ul className="space-y-2">
            {projectData.gDriveFiles.map((file, index) => {
              // Ensure file and file.id are valid before accessing
              if (!file || file.id === undefined) {
                console.warn("Skipping invalid file entry:", file);
                return null; // Skip rendering invalid entries
              }
              const status = processingStatus[file.id] || "idle";
              return (
                <li
                  key={file.id}
                  className="break-words text-base flex items-center justify-between border-b border-gray-200 py-2"
                >
                  <span className="flex-grow pr-2 text-gray-800">
                    {file.name || "Unnamed File"}
                  </span>
                  <button
                    onClick={() => handleSaveFileToRepo(file.id, file.name)}
                    disabled={
                      isFormDisabled ||
                      status === "processing" ||
                      status === "processed"
                    }
                    className={`ml-4 px-3 py-1 rounded text-white transition-colors text-sm ${
                      isFormDisabled || status === "processing"
                        ? "bg-gray-400 cursor-not-allowed"
                        : status === "processed"
                        ? "bg-green-600 cursor-default"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {status === "processing"
                      ? "Processing..."
                      : status === "processed"
                      ? "Loaded"
                      : "Load Data from File"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {/* --- Input Form for Triggering the Agent Task --- */}
      <div className="mt-6 p-4 border border-gray-200 rounded bg-gray-50">
        <h4 className="text-xl font-semibold mb-4 text-gray-700">
          Generate Article Parameters
        </h4>

        <div className="mb-4">
          <label
            htmlFor="primaryKeyword"
            className="block text-sm font-medium text-gray-700"
          >
            Primary Keyword:
          </label>
          <input
            id="primaryKeyword"
            type="text"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            disabled={isFormDisabled}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Best Gaming Laptops 2023"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Competitor URLs:
          </label>
          {inputUrls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlInputChange(index, e.target.value)}
                disabled={isFormDisabled}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={`Competitor URL ${index + 1}`}
              />
              {inputUrls.length > 1 && (
                <button
                  onClick={() => handleRemoveUrlInput(index)}
                  disabled={isFormDisabled}
                  className="px-2 py-1 rounded text-white bg-red-500 hover:bg-red-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddUrlInput}
            disabled={isFormDisabled}
            className="mt-2 px-3 py-1 rounded text-blue-700 border border-blue-700 hover:bg-blue-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add URL
          </button>
        </div>

        {/* Trigger Button */}
        {/* Disable if form is disabled OR keyword/urls are empty */}
        <button
          onClick={handleTriggerMainAgent}
          disabled={
            isFormDisabled ||
            !inputKeyword.trim() ||
            inputUrls.filter((url) => url.trim() !== "").length === 0
          }
          className={`px-4 py-2 rounded text-white transition-colors w-full text-center font-semibold ${
            isFormDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isTriggeringTask
            ? "Starting Agent..."
            : isPolling &&
              currentTaskKeywordBeingTracked === inputKeyword.trim() &&
              taskStatusData?.status !== "completed" &&
              taskStatusData?.status !== "failed"
            ? "Agent Running..." // Show 'Agent Running' if polling *this* keyword
            : "Start Article Generation Agent"}
        </button>

        {/* Trigger Specific Error */}
        {triggerError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
            <h4 className="font-semibold">Trigger Error:</h4>
            <p>{triggerError}</p>
          </div>
        )}
      </div>{" "}
      {/* End of Input Form */}
      {/* --- Agent Status Display (Uses Polling Data) --- */}
      {currentTaskKeywordBeingTracked && (
        <div className="mt-6 p-4 border border-gray-300 rounded max-w-full overflow-auto bg-blue-50">
          <h4 className="text-xl font-semibold mb-2 text-gray-700">
            Agent Task Status:{" "}
            <span className="font-normal text-blue-800">
              "{currentTaskKeywordBeingTracked}"
            </span>
          </h4>

          {/* Show loading until initial status data is received */}
          {isPolling && !taskStatusData && (
            <p className="text-gray-600">
              Loading initial status for "{currentTaskKeywordBeingTracked}"...
            </p>
          )}

          {/* Display status details once data is available */}
          {taskStatusData && (
            <>
              <p className="text-lg text-gray-800">
                Overall Status: <strong>{taskStatusData.status}</strong>
              </p>
              {taskStatusData.stage && (
                <p className="text-gray-700">
                  Current Stage: {taskStatusData.stage}
                </p>
              )}
              {taskStatusData.progress && (
                <p className="text-gray-700">
                  Progress: {taskStatusData.progress}
                </p>
              )}
              {taskStatusData.details && (
                <p className="text-gray-700">
                  Details: {taskStatusData.details}
                </p>
              )}
              {taskStatusData.timestamp && (
                <p className="text-sm text-gray-600">
                  Last Update:{" "}
                  {new Date(taskStatusData.timestamp).toLocaleString()}
                </p>
              )}

              {/* Specific status messages with color coding */}
              {taskStatusData.status === "queued" && (
                <p className="mt-2 text-blue-800 font-semibold">
                  Task is in queue, waiting to start...
                </p>
              )}
              {taskStatusData.status === "running" && (
                <p className="mt-2 text-yellow-800 font-semibold">
                  Agent is currently processing...
                </p>
              )}
              {taskStatusData.status === "completed" && (
                <p className="mt-2 text-green-800 font-semibold">
                  Task Completed Successfully!
                </p>
              )}
              {taskStatusData.status === "failed" && (
                <p className="mt-2 text-red-800 font-semibold">Task Failed.</p>
              )}
              {taskStatusData.status === "not_found" && (
                <p className="mt-2 text-gray-600 font-semibold">
                  Task status not yet registered. Waiting for it to start...
                </p>
              )}
            </>
          )}

          {/* Show Loader specifically within the status section if polling is active
               and the task is not yet completed/failed.
               Use overallComponentLoading for main page loader if desired.
           */}
          {isPolling &&
            taskStatusData?.status !== "completed" &&
            taskStatusData?.status !== "failed" && (
              <div className="mt-4 flex justify-center">
                <Loader /> {/* Use your Loader component */}
              </div>
            )}

          {/* Option to clear status and start a new task - Appears after task is final */}
          {(taskStatusData?.status === "completed" ||
            taskStatusData?.status === "failed") && (
            <button
              onClick={() => setCurrentTaskKeywordBeingTracked(null)} // Stops tracking and clears display
              className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
            >
              Start a New Task
            </button>
          )}
        </div>
      )}
      {/* General error display (could be from polling or file processing) */}
      {/* Displayed if triggerError is not specific enough or another error occurred */}
      {error && !triggerError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">General Error:</h4>
          <p>{error}</p>
        </div>
      )}
      {/* Overall Component Loader - Use this if you want a full page overlay */}
      {overallComponentLoading &&
        !isPolling &&
        !isTriggeringTask &&
        !isListingFiles && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Loader /> {/* Your full page loader */}
          </div>
        )}
      {/* Toast container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

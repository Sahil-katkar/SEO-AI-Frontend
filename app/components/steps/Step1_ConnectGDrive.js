"use client";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});
  const [userId, setUserId] = useState("123");
  const [agentStatusOutput, setAgentStatusOutput] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(null);
  const [intentContent, setIntentContent] = useState(null);
  const [outlineContent, setOutlineContent] = useState(null);
  const [articleContent, setArticleContent] = useState(null);
  const [documentIds, setDocumentIds] = useState({});
  const pollingRef = useRef(null);
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewArticle = async () => {
    setArticleLoading(true);
    setArticleError(null);
    setIntentContent(null);
    setOutlineContent(null);
    setArticleContent(null);
    setDocumentIds({});
    localStorage.removeItem("intent");
    localStorage.removeItem("outline");
    localStorage.removeItem("article");

    try {
      const response = await fetch("/api/view_article", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const rawText = await response.text();
      console.log("Raw response in handleViewArticle:", rawText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(rawText);
        } catch {
          throw new Error(
            `Error fetching article: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(
          errorData.detail || `Error fetching article: ${response.status}`
        );
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${e.message}`);
      }

      const newDocumentIds = {};
      data.forEach((item) => {
        let parsedContent = item.content || "";
        parsedContent = parsedContent.replace(/^\ufeff/, "");

        if (item.name === "Intent") {
          try {
            parsedContent = JSON.parse(parsedContent);
            setIntentContent(parsedContent);
            localStorage.setItem("intent", JSON.stringify(parsedContent));
            newDocumentIds["Intent"] = item.id;
          } catch (e) {
            console.error(`Failed to parse JSON for ${item.name}:`, e);
            parsedContent = {
              error: `Invalid JSON: ${e.message}`,
              raw: parsedContent,
            };
            setIntentContent(parsedContent);
            localStorage.setItem("intent", JSON.stringify(parsedContent));
            newDocumentIds["Intent"] = item.id;
          }
        } else if (item.name === "Outline") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setOutlineContent(parsedContent);
          localStorage.setItem("outline", parsedContent);
          newDocumentIds["Outline"] = item.id;
        } else if (item.name === "Article") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setArticleContent(parsedContent);
          localStorage.setItem("article", parsedContent);
          newDocumentIds["Article"] = item.id;
        }
      });

      setDocumentIds(newDocumentIds);
      toast.success("Article data fetched and stored successfully!");
    } catch (e) {
      console.error("Error fetching article:", e);
      setArticleError(
        `${e.message}${
          e.rawResponse ? ` (Raw: ${e.rawResponse.slice(0, 100)}...)` : ""
        }`
      );
      toast.error(`Article Fetch Error: ${e.message}`);
    } finally {
      setArticleLoading(false);
    }
  };

  const getCurrentStep = () => {
    const status = agentStatusOutput?.status;
    switch (status) {
      case "in_progress":
        return 1;
      case "processing_file":
        return 2;
      case "completed":
        return 3;
      case "not_started":
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

  const startPollingAgentStatus = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch(
          `/api/agent_status?PRIMARY_KEYWORD=${encodeURIComponent(
            "Strapi CMS"
          )}`
        );
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(
            errorData.detail || `Agent status error: ${statusResponse.status}`
          );
        }

        const statusData = await statusResponse.json();
        console.log("Polling /api/agent_status:", statusData);
        setAgentStatusOutput(statusData);
      } catch (e) {
        console.error("Polling error:", e);
        setError(e.message || "Failed to fetch agent status.");
        setAgentStatusOutput(null);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setIsLoading(false);
        toast.error(`Polling Error: ${e.message}`);
      }
    }, 8000);
  };

  const handleListFiles = async () => {
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

      setFiles(data);
      console.log("Successfully listed files:", data);
    } catch (e) {
      console.error("Failed to list files (caught error):", e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
    }
  };

  const handleCallMainAgent = async () => {
    setIsLoading(true);
    setError(null);
    setAgentStatusOutput(null);

    try {
      startPollingAgentStatus();

      const gdriveResponse = await fetch("/api/call-main-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      if (!gdriveResponse.ok) {
        const errorData = await gdriveResponse.json();
        throw new Error(
          errorData.detail || `GDrive error: ${gdriveResponse.status}`
        );
      }

      const gdriveData = await gdriveResponse.json();
      updateProjectData({
        isGDriveConnected: true,
        gDriveFiles: gdriveData.files || [],
        agentEvent: gdriveData,
      });

      setIsLoading(false);
      toast.success("Google Drive connected!");
    } catch (e) {
      console.error("Error:", e);
      setError(e.message || "Unexpected error.");
      setAgentStatusOutput(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsLoading(false);
      toast.error(`Error: ${e.message}`);
    }
  };

  useEffect(() => {
    localStorage.removeItem("intent");
    localStorage.removeItem("outline");
    localStorage.removeItem("article");
    setIntentContent(null);
    setOutlineContent(null);
    setArticleContent(null);
    setDocumentIds({});

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const handleSaveFileToRepo = async (fileId, fileName) => {
    setProcessingStatus((prev) => ({ ...prev, [fileId]: "processing" }));
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/file-content?file_id=${encodeURIComponent(fileId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Fetch file error: ${response.status}`
        );
      }
      const data = await response.json();
      if (!data.content) throw new Error(data.error || "No content in file.");

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

      setProcessingStatus((prev) => ({ ...prev, [fileId]: "processed" }));
      toast.success("File processed!");
      updateProjectData({
        primaryKeyword: "football",
        primaryIntent: "This is intent.",
      });
      setActiveStep(STEPS[1].id);
    } catch (e) {
      console.error("File process error:", e);
      setError(e.message || "Unexpected error.");
      setProcessingStatus((prev) => ({ ...prev, [fileId]: "idle" }));
      toast.error(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let colorClass = "bg-gray-200 text-gray-700";
    if (status === "completed") colorClass = "bg-green-100 text-green-700";
    else if (status === "in_progress")
      colorClass = "bg-yellow-100 text-yellow-700";
    else if (status === "error") colorClass = "bg-red-100 text-red-700";
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
      >
        {status}
      </span>
    );
  };

  return (
    // <div className="step-component">
    //   <h3 className="text-xl font-semibold mb-4 text-blue-500 pb-8">
    //     1. Connect Google Drive & Select Source Data
    //   </h3>

    //   <button
    //     onClick={handleCallMainAgent}
    //     disabled={isLoading || !userId}
    //     className={`px-4 py-2 rounded text-white transition-colors ${
    //       isLoading || !userId
    //         ? "bg-gray-400 cursor-not-allowed"
    //         : "bg-blue-500 hover:bg-blue-600"
    //     }`}
    //   >
    //     {isLoading ? "Processing..." : "Connect to Google Drive & Poll Status"}
    //   </button>

    //   <div className="stepper">
    //     {[
    //       {
    //         label: "Connecting to drive and extracting keyword",
    //         status: "scrape_content_tool_completed",
    //       },
    //       {
    //         label: "Scraping data and intent generation",
    //         status: "intent_agent_completed",
    //       },
    //       { label: "Outline Generation", status: "outline_agent_completed" },
    //       { label: "Article Generation", status: "article_agent_completed" },
    //     ].map((step, stepIndex, steps) => {
    //       const currentStatusIndex = steps.findIndex(
    //         (s) => s.status === agentStatusOutput?.status
    //       );
    //       const isCompleted = stepIndex <= currentStatusIndex;

    //       return (
    //         <div
    //           key={stepIndex}
    //           className="step flex flex-col items-center flex-1"
    //         >
    //           <div
    //             className={`circle mb-2 ${isCompleted ? "completed" : ""}`}
    //             style={{ width: 36, height: 36 }}
    //           >
    //             {isCompleted ? "✓" : stepIndex + 1}
    //           </div>
    //           <div className="text-xs text-center font-medium">
    //             {step.label}
    //           </div>
    //           {stepIndex < steps.length - 1 && (
    //             <div
    //               className={`line ${
    //                 stepIndex < currentStatusIndex ? "line-completed" : ""
    //               }`}
    //             />
    //           )}
    //         </div>
    //       );
    //     })}
    //   </div>

    //   {error && (
    //     <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
    //       <h4 className="font-semibold">Error:</h4>
    //       <p>{error}</p>
    //     </div>
    //   )}

    //   {isLoading && <Loader />}

    //   {agentStatusOutput && (
    //     <div className="mt-6 p-4 border border-gray-300 bg-white rounded shadow">
    //       <h4 className="text-xl font-semibold mb-2">Agent Status</h4>
    //       <div className="flex items-center space-x-4">
    //         <span className="text-gray-700">Status: </span>
    //         {getStatusBadge(agentStatusOutput.status || "unknown")}
    //       </div>

    //       {agentStatusOutput.status === "in_progress" && (
    //         <div className="mt-4">
    //           <h4 className="text-lg font-semibold text-blue-800 mb-2">
    //             Progress
    //           </h4>
    //           <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
    //             <div
    //               className="bg-blue-500 h-4"
    //               style={{ width: `${agentStatusOutput.progress || 0}%` }}
    //             ></div>
    //           </div>
    //           <p className="text-sm text-gray-700 mt-2">
    //             {agentStatusOutput.progress || 0}% completed
    //           </p>
    //         </div>
    //       )}
    //     </div>
    //   )}

    //   {projectData.isGDriveConnected && (
    //     <div className="mt-4">
    //       {projectData.gDriveFiles?.length > 0 ? (
    //         <>
    //           <h4 className="text-2xl font-semibold mb-2">Found Files:</h4>
    //           <ul className="space-y-2">
    //             {projectData.gDriveFiles.map((file, index) => {
    //               const status = processingStatus[file.id] || "idle";
    //               return (
    //                 <li
    //                   key={file.id || `${file.name}-${index}`}
    //                   className="flex justify-between items-center border-b py-2"
    //                 >
    //                   <span>{file.name || "Unnamed File"}</span>
    //                   <button
    //                     onClick={() => handleSaveFileToRepo(file.id, file.name)}
    //                     disabled={
    //                       isLoading ||
    //                       status === "processing" ||
    //                       status === "processed"
    //                     }
    //                     className={`px-3 py-1 rounded text-white text-sm ${
    //                       status === "processed"
    //                         ? "bg-green-500 cursor-default"
    //                         : isLoading || status === "processing"
    //                         ? "bg-gray-400 cursor-not-allowed"
    //                         : "bg-blue-500 hover:bg-blue-600"
    //                     }`}
    //                   >
    //                     {status === "processed"
    //                       ? "Processed"
    //                       : status === "processing"
    //                       ? "Processing..."
    //                       : "Select & Process"}
    //                   </button>
    //                 </li>
    //               );
    //             })}
    //           </ul>
    //         </>
    //       ) : (
    //         <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
    //           Your Article has generated. Click "Show Details" to get the link.
    //         </div>
    //       )}
    //     </div>
    //   )}

    //   <div className="mt-4">
    //     <button
    //       onClick={handleViewArticle}
    //       disabled={articleLoading}
    //       className={`px-3 py-1 rounded text-white text-sm transition-colors ${
    //         articleLoading
    //           ? "bg-gray-400 cursor-not-allowed"
    //           : "bg-blue-600 hover:bg-blue-700"
    //       }`}
    //     >
    //       {articleLoading ? "Fetching..." : " Show Details"}
    //     </button>
    //   </div>

    //   {Object.keys(documentIds).length > 0 && (
    //     <div className="mt-4 p-4 border border-gray-300 bg-white rounded shadow">
    //       <h4 className="text-lg font-semibold mb-2">
    //         Your data has been saved to :
    //       </h4>
    //       <ul className="space-y-1">
    //         {Object.entries(documentIds).map(([name, id]) => (
    //           <li key={name} className="text-sm">
    //             <span className="font-medium">{name}:</span>{" "}
    //             {id ? (
    //               <a
    //                 href={`https://docs.google.com/document/d/${id}`}
    //                 target="_blank"
    //                 rel="noopener noreferrer"
    //                 className="text-blue-600 hover:underline"
    //               >
    //                 https://docs.google.com/document/d/{id}
    //               </a>
    //             ) : (
    //               "No ID available"
    //             )}
    //           </li>
    //         ))}
    //       </ul>
    //     </div>
    //   )}

    //   <ToastContainer />
    // </div>

    <div className="step-component">
      <h3 className="text-xl font-semibold mb-4 text-blue-500 pb-8">
        1. Connect Google Drive & Select Source Data{" "}
      </h3>
      <button
        onClick={handleListFiles}
        className={"px-4 py-2 rounded text-white transition-colors"}
      >
        {"Connect to Google Drive and List Files"}
      </button>
      <ul className="space-y-1 keyword-list ">
        {files &&
          files.map((file, index) => (
            <li
              key={file.id || `${file.name}-${index}`}
              className="break-words text-lg"
            >
              <strong>{file.name || "Unnamed File"}</strong> (
              {file.mimeType || "Unknown Type"})
              <button className="">Select</button>
            </li>
          ))}
      </ul>
    </div>
  );
}

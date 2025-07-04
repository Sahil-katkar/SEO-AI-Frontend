"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, Folder } from "lucide-react";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData } = useAppContext();
  const [folderNameInput, setFolderNameInput] = useState("");
  const [files, setFiles] = useState(projectData?.gDriveFiles || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.getElementById("folder-input")?.focus();
  }, []);

  const handleListFiles = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (folderNameInput) queryParams.append("folder_name", folderNameInput);

      const response = await fetch(`/api/list-files?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.detail || `Error: ${response.status}`);

      if (!Array.isArray(data)) {
        throw new Error("API did not return a list of files.");
      }

      setFiles(data);
      updateProjectData({ isGDriveConnected: true, gDriveFiles: data || [] });
      toast.success("Files listed successfully!");
    } catch (e) {
      setFiles([]);
      setError(e.message || "Something went wrong.");
      toast.error(`❌ ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleReadSpreadsheet = async (fileId) => {
  //   setError(null);
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch("/api/read-spreadsheet", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ fileId }),
  //     });

  //     const data = await response.json();
  //     if (!response.ok)
  //       throw new Error(data.error || `Error: ${response.status}`);

  //     const rows = data.full_content?.Sheet1;

  //     if (!Array.isArray(rows)) {
  //       throw new Error("Invalid data format: Sheet1 is not an array.");
  //     }

  //     // Prepare the rows for insertion
  //     const formattedRows = rows.map((row, index) => ({
  //       keyword: row.KEYWORD || "",
  //       intent: row.INTENT || "",
  //       faq: row["FAQs"] || "",
  //       comp_url: row.COMPETITORS || "",
  //       questions: row.MUST_ANSWER || "",
  //       lsi_keywords: row.LSI_TERMS || "",
  //       ai_mode: row.AI_MODE_ANSWER || "",
  //       persona: row.PERSONA || "",
  //       BUSINESS_GOAL: row.BUSINESS_GOAL || "",
  //       row_id: `${fileId}_${index + 1}`,
  //     }));

  //     const { data: inserted, error } = await supabase
  //       .from("row_details")
  //       .insert(formattedRows);

  //     if (error) {
  //       console.error("Insert error:", error.message);
  //     } else {
  //       console.log("Insert success:", inserted);
  //       toast.success("File processed and data inserted!");
  //     }

  //     console.log("Processed data:", data);
  //   } catch (e) {
  //     setError(e.message || "Something went wrong.");
  //     toast.error(`❌ ${e.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleReadSpreadsheet = async (fileId) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/read-spreadsheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || `Error: ${response.status}`);

      const rows = data.full_content?.Sheet1;

      console.log("rows", rows);

      if (!Array.isArray(rows)) {
        throw new Error("Invalid data format: Sheet1 is not an array.");
      }

      // Prepare the rows for upsertion
      const formattedRows = rows.map((row, index) => ({
        keyword: row.KEYWORD || "",
        intent: row.INTENT || "",
        faq: row["FAQs"] || "",
        comp_url: row.COMPETITORS || "",
        questions: row.MUST_ANSWER || "",
        lsi_keywords: row.LSI_TERMS || "",
        ai_mode: row.AI_MODE_ANSWER || "",
        persona: row.PERSONA || "",
        BUSINESS_GOAL: row.BUSINESS_GOAL || "",
        cluster: row.CLUSTER || "",
        pillar: row.PILLAR || "",
        article_outcome: row.article_outcome || "",

        // This row_id will be used to check for conflicts
        row_id: `${fileId}_${index + 1}`,
      }));

      // --- MODIFICATION START ---
      // Use .upsert() instead of .insert()
      const { data: upsertedData, error } = await supabase
        .from("row_details")
        .upsert(formattedRows, {
          onConflict: "row_id", // The column to check for conflicts
        });

      setIsLoading(false);
      router.push(`/keywords/${fileId}`);
      if (error) {
        // Re-throw the error to be caught by the outer catch block
        throw error;
      } else {
        console.log("Upsert success:", upsertedData);
        toast.success("File processed and data saved successfully!");
      }
      // --- MODIFICATION END ---

      console.log("Processed data:", data);
    } catch (e) {
      // This will now catch both fetch errors and Supabase errors
      const errorMessage = e.message || "Something went wrong.";
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
      console.error("Operation failed:", e); // Log the full error for debugging
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen px-6 py-14 flex flex-col items-center"
      style={
        {
          // background: `linear-gradient(to bottom right, #eff6ff, #ecfeff)`,
          // fontFamily: `'Inter', sans-serif`,
        }
      }
    >
      <div className="max-w-3xl w-full text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          {/* <div className="p-2 rounded-lg bg-yellow-100 shadow-inner inline-block">
            <Folder className="w-6 h-6 text-yellow-500" />
          </div> */}

          <h1 className="text-xl sm:text-4xl font-bold text-gray-800">
            📂Google Drive Manager
          </h1>
        </div>
        <p className="text-gray-600 text-md sm:text-lg">
          Connect to your Google Drive and manage your files with ease. Search
          through folders and process your documents seamlessly.
        </p>
      </div>

      {/* Search Card */}
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8 mb-10 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center w-full sm:w-3/4 border rounded-xl px-4 py-3 bg-gray-50 border-gray-300">
            <Folder className="w-5 h-5 text-gray-400 mr-3" />
            <input
              id="folder-input"
              type="text"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="Enter folder name "
              className="w-full bg-transparent text-gray-800 focus:outline-none text-base border-none !mb-[0px]"
            />
          </div>

          <button
            disabled={!folderNameInput || isLoading}
            onClick={handleListFiles}
            className={`px-6 py-3 w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold rounded-xl transition 
              ${""
              // folderNameInput && !isLoading
              //   ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-[1.02]"
              //   : "bg-gray-300 cursor-not-allowed"
              }
            `}
          >
            <Search className="w-5 h-5" />
            {isLoading ? "Searching..." : "Search Files"}
          </button>
        </div>

        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
      </div>

      {/* File Display */}
      <div className="w-full max-w-5xl">
        {files.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400 bg-white shadow-sm">
            <Folder className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No files found</p>
            <p className="text-sm mt-1">
              Enter a folder name above to search for files
            </p>
          </div>
        ) : (
          <div className="grid ssm:grid-cols-2 llg:grid-cols-3 gap-6">
            {files &&
              files.map((file, i) => (
                <div
                  key={file.id || `${file.name}-${i}`}
                  className="flex gap-[30px] items-center bg-white shadow rounded-xl p-3 bborder border-gray-100 hover:shadow-lg transition"
                >
                  <h3 className="flex-1 text-md font-semibold text-gray-800 truncate !pb-[0px] !border-0">
                    {file.name}
                  </h3>
                  {/* <p className="text-sm text-gray-500">{file.mimeType}</p> */}
                  <button
                    disabled={!folderNameInput || isLoading}
                    onClick={() => {
                      handleReadSpreadsheet(file.id);
                    }}
                    className=" whitespace-nowrap text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    Select & Process →
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

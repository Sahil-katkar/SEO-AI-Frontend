"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, Folder } from "lucide-react";
import { getData } from "../../../utils/dbQueries";
import { upsertData } from "../../../utils/dbQueries";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData } = useAppContext();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState(projectData?.gDriveFiles || []);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.getElementById("gdrive-input")?.focus();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const value = localStorage.getItem("value");
      if (value) {
        console.log("value from localStorage:", value);

        const { data: fileLists, error: fetchError } = await getData(
          "file_details",
          ["fileId, name"],
          "folder",
          value
        );

        if (fileLists) {
          console.log("fileLists", fileLists);
        }

        if (fileLists && fileLists.length > 0) {
          console.log("fileLists from DB:", fileLists);
          setFiles(fileLists);
          updateProjectData({
            isGDriveConnected: true,
            gDriveFiles: fileLists,
          });
        }
      }
    };

    fetchData();
  }, []);

  function extractFileIdOrFolder(input) {
    if (!input) return { type: null, value: null };
    const sheetMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch && sheetMatch[1]) {
      return { type: "file_id", value: sheetMatch[1] };
    }
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) {
      return { type: "file_id", value: input };
    }
    return { type: "folder_name", value: input };
  }

  const handleSearch = async () => {
    setError(null);
    setIsSearching(true);
    setFiles([]);

    const { type, value } = extractFileIdOrFolder(input.trim());

    if (!type || !value) {
      setError("Please enter a folder name, file ID, or Google Sheet URL.");
      setIsSearching(false);
      toast.error(
        "❌ Please enter a folder name, file ID, or Google Sheet URL."
      );
      return;
    }

    try {
      const { data: existingRows, error: fetchError } = await getData(
        "file_details",
        ["fileId", "name"],
        "folder",
        value
      );

      if (fetchError) {
        throw new Error("Database lookup failed.");
      }

      if (existingRows && existingRows.length > 0) {
        const queryParams = new URLSearchParams();
        queryParams.append(type, value);
        console.log("queryParams", queryParams);

        const fileId = queryParams.get("file_id");
        const folderName = queryParams.get("folder_name");

        console.log("fileId", fileId);

        if (fileId) {
          localStorage.setItem("value", fileId);
        }
        if (folderName) {
          localStorage.setItem("value", folderName);
        }
        console.log("Found in database:", existingRows);
        setFiles(existingRows);
        updateProjectData({
          isGDriveConnected: true,
          gDriveFiles: existingRows,
        });
        toast.success("Files loaded from database!");
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append(type, value);
      console.log("queryParams", queryParams);

      const fileId = queryParams.get("file_id");
      const folderName = queryParams.get("folder_name");

      console.log("fileId", fileId);

      if (fileId) {
        localStorage.setItem("value", fileId);
      }
      if (folderName) {
        localStorage.setItem("value", folderName);
      }

      console.log("fileId1", fileId);
      console.log("folderName1", folderName);

      const response = await fetch(`/api/list-files?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.detail || `Error: ${response.status}`);
      if (!Array.isArray(data))
        throw new Error(
          "API endpoint is unavailable. Initiate server startup."
        );

      setFiles(data);

      const rows = data.map((item) => ({
        fileId: item.id,
        name: item.name,
        folder: value,
      }));

      console.log("Inserting rows into Supabase:", rows);

      const { data: filesList, error: insertError } = await upsertData(
        "file_details",
        rows,
        "fileId"
      );

      if (insertError) {
        console.error("Error adding file records:", insertError);
      } else {
        console.log("Added successfully:", filesList);
      }

      updateProjectData({ isGDriveConnected: true, gDriveFiles: data || [] });

      toast.success("Files listed successfully!");
    } catch (e) {
      setFiles([]);
      setError(e.message || "Something went wrong.");
      toast.error(`❌ ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReadSpreadsheet = async (fileId) => {
    setError(null);
    setIsProcessing(true);
    try {
      const response = await fetch("/api/read-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || `Error: ${response.status}`);
      const rows = data.full_content?.Sheet1;
      if (!Array.isArray(rows))
        throw new Error("Invalid data format: Sheet1 is not an array.");
      const formattedRows = rows.map((row, index) => ({
        keyword: row.KEYWORD || "",
        intent: row.INTENT || "",
        faq: row["FAQs"] || "",
        comp_url: row.COMPETITORS || "",
        questions: row["MUST-ANSWER QUESTIONS (within content)"] || "",
        lsi_keywords: row["LSI TERMS"] || "",
        ai_mode: row["AI OVERVIEW / AI MODE ANSWER"] || "",
        persona: row["AUTHOR/PERSONA"] || "",
        BUSINESS_GOAL: row["BUSINESS GOAL"] || "",
        cluster: row.CLUSTER || "",
        pillar: row.PILLAR || "",
        article_outcome: row["ARTICLE OUTCOME FOR READER"] || "",
        outline_format: row["OUTLINE"] || "",
        target_audience: row["TARGET AUDIENCE"] || "",
        row_id: `${fileId}_${index + 1}`,
      }));
      const { data: upsertedData, error } = await supabase
        .from("row_details")
        .upsert(formattedRows, { onConflict: "row_id" });
      if (error) throw error;
      router.push(`/keywords/${fileId}`);
      toast.success("File processed and data inserted!");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      toast.error(`❌ ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-14 flex flex-col items-center">
      <div className="max-w-3xl w-full text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <h1 className="text-xl sm:text-4xl font-bold text-gray-800">
            📂Google Drive
          </h1>
        </div>
        <p className="text-gray-600 text-md sm:text-lg">
          Connect to your Google Drive and list your files.
        </p>
      </div>
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8 mb-10 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center w-full sm:w-3/4 border rounded-xl px-4 py-3 bg-gray-50 border-gray-300">
            <Folder className="w-5 h-5 text-gray-400 mr-3" />
            <input
              id="gdrive-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter folder name or Google Sheet URL"
              className="w-full bg-transparent text-gray-800 focus:outline-none text-base border-none !mb-[0px]"
              disabled={isSearching || isProcessing}
            />
          </div>
          <button
            disabled={!input.trim() || isSearching || isProcessing}
            onClick={handleSearch}
            className={`px-6 py-3 w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold rounded-xl transition ${
              input.trim() && !isSearching && !isProcessing
                ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-[1.02]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <Search className="w-5 h-5" />
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
      </div>
      <div className="w-full max-w-5xl">
        {files.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400 bg-white shadow-sm">
            <Folder className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No files found</p>
            <p className="text-sm mt-1">
              Enter a folder name or Google Sheet URL above to search for files
            </p>
          </div>
        ) : (
          <div className="grid ssm:grid-cols-2 llg:grid-cols-3 gap-6">
            {files.map((file, i) => (
              <div
                key={file.id || `${file.name}-${i}`}
                className="flex gap-[30px] items-center bg-white shadow rounded-xl p-3 bborder border-gray-100 hover:shadow-lg transition"
              >
                <h3 className="flex-1 text-md font-semibold text-gray-800 truncate !pb-[0px] !border-0">
                  {file.name}
                </h3>
                <button
                  disabled={isProcessing}
                  onClick={() => handleReadSpreadsheet(file.id)}
                  className={`whitespace-nowrap text-white py-2 rounded-xl text-sm font-semibold px-4 ${
                    !isProcessing
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-[1.02]"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? "Processing..." : "Select & Process →"}
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

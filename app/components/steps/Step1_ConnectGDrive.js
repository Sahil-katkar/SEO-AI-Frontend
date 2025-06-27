"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/common/Loader";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FileText, Loader2, FolderOpen } from "lucide-react";

// Color palette
const primary = "#4f8cff";
const secondary = "#a084e8";

export default function Step1_ConnectGDrive() {
  const { projectData, updateProjectData } = useAppContext();
  const [folderNameInput, setFolderNameInput] = useState("");
  const [files, setFiles] = useState(projectData?.gDriveFiles || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleListFiles = async (fileId = null, folderName = null) => {
    setError(null);
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (fileId) queryParams.append("file_id", fileId);
      if (folderName) queryParams.append("folder_name", folderName);

      const response = await fetch(`/api/list-files?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Error: ${response.status}`);
      }

      setFiles(data);
      updateProjectData({
        isGDriveConnected: true,
        gDriveFiles: data || [],
      });

      toast.success("🎉 Files listed successfully!");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      toast.error(`❌ ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProcessRowsTab = (id) => {
    router.push(`/${id}`);
  };

  return (
    <div
      className="min-h-screen py-10"
      style={{
        background: "linear-gradient(135deg, #f5f8ff 0%, #fff 100%)",
        fontFamily: `'Inter', 'Nunito', 'Segoe UI', Arial, sans-serif`,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2
          className="text-4xl font-extrabold mb-4 flex items-center gap-3"
          style={{ color: primary, fontFamily: "inherit" }}
        >
          <FolderOpen className="w-8 h-8" style={{ color: secondary }} />
          Connect Google Drive & Browse Files
        </h2>
        <p className="text-lg mb-8" style={{ color: "#4e5d6c" }}>
          Enter your Google Drive folder name below to list and process your
          files.
        </p>

        <div
          className="shadow-xl rounded-2xl p-8 mb-10 border"
          style={{
            background: "#fff",
            borderColor: "#e3e8f0",
          }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <input
              type="text"
              placeholder="Enter folder name (e.g. My_SEO_Docs)"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              className="w-full sm:w-2/3 px-5 py-3 border-2 rounded-xl shadow-sm focus:ring-2 focus:outline-none text-lg transition"
              style={{
                borderColor: primary,
                background: "#f5f8ff",
                color: "#222",
                fontFamily: "inherit",
              }}
            />
            <button
              disabled={!folderNameInput || isLoading}
              onClick={() => handleListFiles(null, folderNameInput)}
              className="w-full sm:w-1/3 flex items-center justify-center px-6 py-3 text-lg font-bold rounded-xl shadow-md transition duration-200 gap-2"
              style={
                folderNameInput && !isLoading
                  ? {
                      background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)`,
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }
                  : {
                      background: "#e3e8f0",
                      color: "#a0aec0",
                      cursor: "not-allowed",
                      border: "none",
                    }
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  Listing...
                </span>
              ) : (
                <>
                  <FolderOpen className="w-5 h-5" />
                  List Files
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              className="mt-4 p-4 border rounded-xl text-base font-medium flex gap-2 items-center"
              style={{
                background: "#fff6f6",
                borderColor: "#ffd6d6",
                color: "#d7263d",
                fontFamily: "inherit",
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        <div>
          {isLoading && <Loader />}
          {!isLoading && files.length === 0 && (
            <p
              className="text-center mt-10 text-lg"
              style={{ color: "#b2bec3" }}
            >
              No files listed yet. Try entering a folder name above.
            </p>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {files.map((file, index) => (
              <div
                key={file.id || `${file.name}-${index}`}
                className="group relative border rounded-2xl shadow-lg p-6 hover:shadow-2xl transition duration-300 flex flex-col"
                style={{
                  background: "#fff",
                  borderColor: "#e3e8f0",
                  fontFamily: "inherit",
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl shadow"
                    style={{
                      background: "#f5f8ff",
                      color: primary,
                    }}
                  >
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-xl font-bold truncate"
                      style={{ color: primary, fontFamily: "inherit" }}
                    >
                      {file.name || "Untitled File"}
                    </h3>
                    <p className="text-sm" style={{ color: "#7f8c8d" }}>
                      {file.mimeType || "Unknown Type"}
                    </p>
                  </div>
                </div>

                <button
                  className="mt-auto w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)`,
                    color: "#fff",
                    fontFamily: "inherit",
                  }}
                  onClick={() => handleOpenProcessRowsTab(file.id)}
                >
                  Select & Process <span className="ml-1">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <ToastContainer />
      </div>
      {/* Font import for Inter/Nunito */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Nunito:wght@400;700;900&display=swap");
      `}</style>
    </div>
  );
}

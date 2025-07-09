"use client";
import { useEffect, useState, useRef } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function FileId() {
  const { updateProjectData } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [url, setUrl] = useState([]);
  const [rowStatuses, setRowStatuses] = useState([]);
  const { file_id } = useParams();
  console.log("fileId", file_id);

  const router = useRouter();
  const supabase = createClientComponentClient();
  const hasInsertedRef = useRef(false);

  const fetchFromSupabase = async () => {
    setIsLoading(true);
    try {
      const { data: rowData, error } = await supabase
        .from("row_details")
        .select("keyword, row_id")
        .like("row_id", `${file_id}_%`);

      if (error) throw new Error(`Supabase fetch error: ${error.message}`);

      const sortedRows = rowData.slice().sort((a, b) => {
        const aIndex = parseInt(a.row_id.split("_").pop(), 10);
        const bIndex = parseInt(b.row_id.split("_").pop(), 10);
        return aIndex - bIndex;
      });

      const fetchedKeywords = sortedRows
        .map((row) => row.keyword)
        .filter(Boolean);
      setKeywords(fetchedKeywords);
      setRowStatuses(new Array(fetchedKeywords.length).fill("idle"));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contentbrief = (file_id, keyword, index) => {
    console.log(" ", file_id, index);
    updateProjectData({
      selectedFileId: file_id,
      selectedRowIndex: index + 1,
    });
    router.push(`/mission-plan/${file_id}/${index + 1}`);
    localStorage.setItem("row_id", `${file_id}_${index + 1}`);
  };

  const lsiKeyowrds = async (file_id, keyword, index) => {
    console.log(" ", file_id, index);

    const row_id = `${file_id}_${index + 1}`;

    router.push(`/lsi-keywords/${file_id}/${index + 1}`);

    updateProjectData({
      selectedFileId: file_id,
      selectedRowIndex: index + 1,
    });

    const { data: upsertedData, error: upsertError } = await supabase
      .from("analysis")
      .upsert(
        {
          row_id: row_id,
          status: "Not Approved",
        },
        { onConflict: "row_id" }
      )
      .select();
  };

  useEffect(() => {
    if (file_id) {
      hasInsertedRef.current = false;
      fetchFromSupabase();
    }
    return () => {
      hasInsertedRef.current = false;
    };
  }, [file_id]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen px-6 py-10 w-full">
      <main className="space-y-10 max-w-7xl mx-auto">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold  text-[#1b806c]">
            ✨ Keyword Analysis Dashboard
          </h1>
          <p className="text-gray-500"></p>
        </div>

        {apiError && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 font-medium">
            ❌ {apiError}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader />
          </div>
        ) : keywords.length === 0 ? (
          <div className="text-center text-slate-400 mt-24 space-y-3">
            <div className="text-7xl">📭</div>
            <p className="text-xl font-semibold">
              No keywords found in the spreadsheet
            </p>
          </div>
        ) : (
          <div className="space-y-6 bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-5 font-semibold text-indigo-700 bg-indigo-50 border-b border-indigo-100 text-lg">
              📋 Keywords{" "}
              <span className="text-sm text-gray-400">
                ({keywords.length} items)
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between gap-6 px-6 py-4 hover:bg-gray-50 transition-all"
                >
                  <div className="w-full md:w-3/5 space-y-1">
                    <div className="text-base font-semibold text-gray-800 truncate">
                      🔑 {keyword}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <button
                      disabled={rowStatuses[index] === "loading"}
                      className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                      onClick={() =>
                        lsiKeyowrds(file_id, keyword, index, url[index] || "")
                      }
                    >
                      LSI Agent
                    </button>

                    <button
                      disabled={rowStatuses[index] === "loading"}
                      className="px-5 py-2 text-sm font-semibold rounded-xl text-white  hover:bg-amber-600 disabled:opacity-50 transition"
                      style={{ backgroundColor: "#1397cb" }}
                      onClick={() =>
                        contentbrief(file_id, keyword, index, url[index] || "")
                      }
                    >
                      Article Agent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

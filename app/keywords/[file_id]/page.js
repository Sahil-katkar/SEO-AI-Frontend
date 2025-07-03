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

      const fetchedKeywords = rowData.map((row) => row.keyword).filter(Boolean);
      setKeywords(fetchedKeywords);
      setRowStatuses(new Array(fetchedKeywords.length).fill("idle"));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contentbrief = (file_id, keyword, index) => {
    router.push(`/mission-plan/${file_id}/${index + 1}`);
  };

  // const callMainAgent = async (userId, keyword, index, currentUrl) => {
  //   try {
  // const { error: insertError } = await supabase
  //   .from("row_")
  //   .insert([
  //     {
  //       fileId,
  //       keywords: JSON.stringify([keyword]),
  //       status: "processing started",
  //       row: false,
  //       fileId: index + 1,
  //     },
  //   ]);

  // if (insertError)
  //   throw new Error(`Insert row error: ${insertError.message}`);

  //   const payload = {
  //     rows_content: [
  //       {
  //         user_id: `${userId}_${index + 1}`,
  //         primary_keyword: keyword,
  //         URLs: currentUrl,
  //       },
  //     ],
  //   };

  //   const response = await fetch("/api/call-main-agent", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });

  //   setRowStatuses((prev) =>
  //     prev.map((status, i) =>
  //       i === index
  //         ? response.status === 200
  //           ? "success"
  //           : "disabled"
  //         : status
  //     )
  //   );

  //   if (response.status === 200) {
  //     await supabase
  //       .from("file_details")
  //       .update({ status: "processed" })
  //       .eq("fileId", userId)
  //       .eq("row_index", index + 1)
  //       .eq("row", false);
  //   }

  //   const data = await response.json();
  //   console.log(`✅ Row ${index + 1} response:`, data);
  // } catch (error) {
  //   setRowStatuses((prev) =>
  //     prev.map((status, i) => (i === index ? "disabled" : status))
  //   );
  //   setApiError(error.message);

  // };

  // const contentbrief = async (fileId, keyword, index) => {
  //   // try {
  //   //   const file__Id = `${fileId}_${index + 1}`;
  //   //   console.log("Sending fileId:", file__Id); // Debug log
  //   //   const response = await fetch("/api/contentBrief", {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "application/json",
  //   //     },
  //   //     body: JSON.stringify({ fileId: file__Id }),
  //   //   });
  //   //   const data = await response.json();
  //   //   if (response.ok) {
  //   //     console.log("Success:", data);
  //   //   } else {
  //   //     console.error("Error:", data.error || data);
  //   //   }
  //   // } catch (error) {
  //   //   console.error("Error from catch:", error);
  //   // }
  // };

  useEffect(() => {
    if (file_id) {
      hasInsertedRef.current = false;
      fetchFromSupabase();
    }
    return () => {
      hasInsertedRef.current = false;
    };
  }, [file_id]);

  const statusBadge = (status) => {
    const map = {
      idle: ["⏸️", "Idle", "bg-gray-100 text-gray-600"],
      loading: [
        "⏳",
        "Processing",
        "bg-yellow-100 text-yellow-700 animate-pulse",
      ],
      success: ["✅", "Done", "bg-green-100 text-green-700"],
      disabled: ["⚠️", "Skipped", "bg-red-100 text-red-600"],
    };
    const [icon, label, style] = map[status] || [];
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${style}`}
      >
        {icon} {label}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen px-6 py-10 w-full">
      <main className="space-y-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold  text-[#1b806c]">
            ✨ Keyword Analysis Dashboard
          </h1>
          <p className="text-gray-500">
            Transform your SEO strategy with AI-powered keyword analysis and
            real-time insights
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <p className="text-sm font-medium text-gray-500">Total Keywords</p>
            <h2 className="text-3xl font-bold text-blue-500">
              {keywords.length}
            </h2>
            <p className="text-sm text-gray-400 mt-1">📄 Ready for analysis</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <h2 className="text-3xl font-bold text-green-500">0</h2>
            <p className="text-sm text-gray-400 mt-1">
              ✅ Successfully processed
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <p className="text-sm font-medium text-gray-500">Processing</p>
            <h2 className="text-3xl font-bold text-purple-500">0</h2>
            <p className="text-sm text-gray-400 mt-1">⚡ In progress now</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <p className="text-sm font-medium text-gray-500">Success Rate</p>
            <h2 className="text-3xl font-bold text-indigo-500">0%</h2>
            <p className="text-sm text-gray-400 mt-1">📈 Analysis accuracy</p>
          </div>
        </div>

        {/* Search + Filter */}
        {/* <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <input
            type="text"
            className="w-full md:w-2/3 p-3 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            placeholder="🔍 Search keywords..."
          />
          <div className="flex gap-2">
            <select className="px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <option>All Status</option>
            </select>
          </div>
        </div> */}

        {/* Error */}
        {apiError && (
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-700 font-medium">
            ❌ {apiError}
          </div>
        )}

        {/* Content */}
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
                    <div>{statusBadge(rowStatuses[index])}</div>
                  </div>
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <button
                      disabled={rowStatuses[index] === "loading"}
                      className="px-5 py-2 text-sm font-semibold rounded-xl text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition"
                      onClick={() => {
                        updateProjectData({ activeModalTab: "Logs" });
                        router.push(
                          `/${file_id}/${index + 1}/?keyword=${keyword}`
                        );
                      }}
                    >
                      🔍 View Logs
                    </button>
                    <button
                      disabled={rowStatuses[index] === "loading"}
                      className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition"
                      onClick={() =>
                        contentbrief(file_id, keyword, index, url[index] || "")
                      }
                    >
                      ⚙ Run Agent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex justify-center gap-6 mt-12 text-sm font-medium text-gray-700">
          <span className="flex items-center gap-2 text-green-600">
            ● {keywords.filter((_, i) => rowStatuses[i] === "completed").length}{" "}
            Completed
          </span>
          <span className="flex items-center gap-2 text-blue-600">
            ● {keywords.filter((_, i) => rowStatuses[i] === "loading").length}{" "}
            Processing
          </span>
          <span className="flex items-center gap-2 text-gray-400">
            ● {keywords.filter((_, i) => !rowStatuses[i]).length} Pending
          </span>
        </div>
      </main>
    </div>
  );
}

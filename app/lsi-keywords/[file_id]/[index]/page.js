"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect } from "react";
// import { Pencil } from "lucide-react"; // No longer needed
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";

export default function Analysis() {
  const { updateProjectData } = useAppContext();

  const [lsiData, setLsiData] = useState([]); // Initialize as empty array for safety
  // const [editLSI, setEditLSI] = useState(false); // Removed, no editing
  // const [editedLsiData, setEditedLsiData] = useState({}); // Removed, no editing
  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);
  // const [isSavingLSI, setIsSavingLSI] = useState(false); // Removed, no saving of edits

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  const handleApprove = async () => {
    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("analysis")
        .upsert(
          {
            row_id: row_id,
            status: "Approved",
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      } else {
        toast.success("LSI keywords approved successfully!", {
          position: "bottom-right",
        });
      }

      console.log("Analysis approved successfully:", upsertedData);
    } catch (error) {
      console.error("Error approving analysis:", error.message || error);
      toast.error(
        `Failed to approve LSI keywords: ${error.message || "Unknown error"}`,
        {
          position: "top-right",
        }
      );
    }
  };

  // Mock data - if you only care about LSI, consider removing this and the outer analysisArr.map
  const analysisArr = [
    {
      intent: "This is some intent 1",
      outline: `# Contentful Explained: A Comprehensive Headless CMS Comparison Guide`,
      LSI: [],
      wordCount: 2000,
      density: 50,
      gaps: "These are some gaps 1",
      opportunities: "These are some opportunities 1",
    },
  ];

  // Removed handleEditLSI, handleSaveLSI, handleCancelLSI functions as editing is disabled

  const generateLsi = async () => {
    setIsGeneratingLSI(true);
    try {
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      const { data: article, error: articleFetchError } = await supabase
        .from("row_details")
        .select("comp_url")
        .eq("row_id", row_id);

      if (articleFetchError) {
        throw new Error(
          `Supabase error fetching competitor URLs: ${articleFetchError.message}`
        );
      }

      const urls = article
        .filter((item) => typeof item.comp_url === "string" && item.comp_url)
        .flatMap((item) => item.comp_url.split("\n").map((url) => url.trim()))
        .filter((url) => url);

      if (urls.length === 0) {
        toast.info("No valid competitor URLs found to generate LSI keywords.", {
          position: "top-right",
        });
        return;
      }

      console.log("Competitor URLs:", urls);

      const backendPayload = { urls };
      console.log("backendPayload", backendPayload);

      const response = await fetch("/api/lsi-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      let apiData = await response.json();

      // Ensure apiData is an array from the API response
      if (!Array.isArray(apiData)) {
        if (typeof apiData === "object" && apiData !== null) {
          apiData = [apiData]; // Wrap single object in an array
        } else {
          apiData = []; // Default to empty array if unexpected type
        }
      }

      setLsiData(apiData); // Update UI state immediately

      const { error: upsertError } = await supabase.from("analysis").upsert(
        {
          row_id: row_id,
          lsi_keywords: apiData, // Store the array directly if column is jsonb
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        throw new Error(`Supabase upsert error: ${upsertError.message}`);
      } else {
        toast.success("LSI keywords generated and saved!", {
          position: "bottom-right",
        });
        console.log("Added to DB successfully");
      }
    } catch (error) {
      console.error("Error generating LSI:", error);
      toast.error(
        `Failed to generate LSI: ${error.message || "Unknown error"}`,
        { position: "top-right" }
      );
    } finally {
      setIsGeneratingLSI(false);
    }
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!row_id) return;

      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords")
        .eq("row_id", row_id)
        .single();

      if (error) {
        console.error("Error fetching analysis data:", error);
        setLsiData([]); // Ensure lsiData is an array on fetch error too
        return;
      }

      if (data && data.lsi_keywords) {
        let fetchedLsi = data.lsi_keywords;

        // **IMPORTANT:** Check if the fetched data is a string and needs parsing
        // This often happens if your Supabase column is `text` instead of `jsonb`
        if (typeof fetchedLsi === "string") {
          try {
            fetchedLsi = JSON.parse(fetchedLsi);
          } catch (e) {
            console.warn(
              "LSI keywords found but not valid JSON, treating as empty array:",
              e
            );
            fetchedLsi = []; // Fallback if JSON parsing fails
          }
        }

        // Ensure it's an array, even if it was a single object (which could happen with jsonb if not upserted as array)
        if (!Array.isArray(fetchedLsi)) {
          if (typeof fetchedLsi === "object" && fetchedLsi !== null) {
            fetchedLsi = [fetchedLsi]; // Wrap single object in an array
          } else {
            fetchedLsi = []; // Fallback if it's some other non-array, non-object type
          }
        }

        setLsiData(fetchedLsi);
      } else {
        setLsiData([]); // Ensure lsiData is an array if no data or null
      }
    };

    fetchAnalysisData();
  }, [row_id, supabase]);

  return (
    <>
      <ToastContainer />
      <div className="container px-4 py-6">
        <main className="main-content step-component">
          <h3 className="text-xl font-semibold mb-6 text-blue-600">
            2.LSI Keywords
          </h3>

          <div className="overflow-x-auto">
            {analysisArr.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-[30px] rounded-[12px] border-[1px] border-gray-200 py-3 px-4 text-sm hover:bg-gray-50 transition"
              >
                <div>
                  <div className="mb-[8px] flex justify-between items-center">
                    <p className="font-bold text-[24px] ">LSI:</p>
                    <div className="flex gap-[8px]">
                      <button
                        onClick={generateLsi}
                        disabled={isGeneratingLSI}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isGeneratingLSI ? (
                          <Loader size={20} />
                        ) : (
                          "Generate LSI"
                        )}
                      </button>
                      {/* Removed Edit/Save/Cancel buttons as per requirement */}
                    </div>
                  </div>

                  {Array.isArray(lsiData) && lsiData.length > 0 ? (
                    lsiData.map((item, idx) => {
                      const baseKeywords = String(item.lsi_keywords || "");

                      const keywordValuePairs = [];
                      const parts = baseKeywords.split(",");
                      for (let i = 0; i < parts.length; i += 2) {
                        const keyword = parts[i] ? parts[i].trim() : "";
                        const value = parts[i + 1] ? parts[i + 1].trim() : "";

                        if (keyword) {
                          const numericValue =
                            value === "" ? null : parseFloat(value);
                          keywordValuePairs.push({
                            keyword,
                            value: isNaN(numericValue) ? value : numericValue,
                          });
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className="mb-4 p-4 border border-gray-200 rounded-md"
                        >
                          <label className="block font-bold mb-2">
                            Result {idx + 1} (Source:{" "}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {item.url}
                            </a>
                            )
                          </label>
                          <div className="overflow-x-auto mt-2">
                            <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-1 text-left border border-gray-300">
                                    Keyword
                                  </th>
                                  <th className="px-3 py-1 text-left border border-gray-300">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {keywordValuePairs.length > 0 ? (
                                  keywordValuePairs.map((pair, pairIdx) => (
                                    <tr
                                      key={pairIdx}
                                      className="border-b border-gray-200 last:border-0"
                                    >
                                      {/* Always render as plain text with grey background */}
                                      <td className="px-3 py-1 border border-gray-300 text-gray-700 bg-gray-100">
                                        {pair.keyword}
                                      </td>
                                      <td className="px-3 py-1 border border-gray-300 text-gray-700 bg-gray-100">
                                        {typeof pair.value === "number" &&
                                        !isNaN(pair.value)
                                          ? pair.value.toFixed(10)
                                          : pair.value || "N/A"}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan="2"
                                      className="px-3 py-1 text-center text-gray-500 border border-gray-300 bg-gray-100"
                                    >
                                      No keywords found for this URL.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 mt-4">
                      No LSI keywords available. Click "Generate LSI" to fetch
                      them.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleApprove}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    // The disabled condition no longer checks `editLSI`
                    disabled={
                      !lsiData ||
                      !Array.isArray(lsiData) ||
                      lsiData.length === 0
                    }
                    title={
                      !lsiData ||
                      !Array.isArray(lsiData) ||
                      lsiData.length === 0
                        ? "Generate LSI data first"
                        : "Approve LSI keywords"
                    }
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

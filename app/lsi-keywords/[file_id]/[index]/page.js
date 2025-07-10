"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect, useRef } from "react";
import { Pencil, Save, X, PlusCircle, MinusCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getData } from "../../../../utils/dbQueries";

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(false);
  const { updateProjectData } = useAppContext();
  const [lsiData, setLsiData] = useState([]);
  const [currentLsiPairs, setCurrentLsiPairs] = useState({});

  const [isEditingLSI, setIsEditingLSI] = useState(false);
  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);

  const [compAnalysis, setCompAnalysis] = useState("");
  const [valueAdd, setValueAdd] = useState("");

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  const originalCurrentLsiPairsRef = useRef({});

  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/content/${fileId}/${index}`);
  };

  const handleApprove = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const generateLsi = async () => {
    setIsGeneratingLSI(true);
    try {
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      const { data: articleRows, error: fetchError } = await supabase
        .from("row_details")
        .select("comp_url")
        .eq("row_id", row_id);

      if (fetchError) {
        throw new Error(`Supabase fetch error: ${fetchError.message}`);
      }

      const urls = articleRows
        .filter((item) => typeof item.comp_url === "string" && item.comp_url)
        .flatMap((item) => item.comp_url.split("\n").map((url) => url.trim()))
        .filter((url) => url);

      if (urls.length === 0) {
        toast.warn("No valid competitor URLs found to generate LSI.", {
          position: "top-right",
        });
        return;
      }

      updateProjectData({
        selectedFileId: fileId,
        selectedRowIndex: index,
      });

      const backendPayload = { urls };

      const response = await fetch("/api/lsi-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();

      setLsiData(data);

      let newCurrentLsiPairs = {};

      const { data: fileLists } = await getData(
        "analysis",
        ["updated_lsi_keywords"],
        "row_id",
        row_id
      );

      if (
        fileLists &&
        fileLists.length > 0 &&
        fileLists[0].updated_lsi_keywords
      ) {
        const updatedLsiObj = JSON.parse(fileLists[0].updated_lsi_keywords);
        Object.entries(updatedLsiObj).forEach(([key, pairs]) => {
          newCurrentLsiPairs[key] = pairs;
        });
      }

      setCurrentLsiPairs(newCurrentLsiPairs);
      originalCurrentLsiPairsRef.current = newCurrentLsiPairs;
      const { error: upsertError } = await supabase.from("analysis").upsert(
        {
          row_id: row_id,
          lsi_keywords: data,
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        console.error("Supabase upsert error after API call:", upsertError);
        toast.error("Failed to save generated LSI to database.", {
          position: "top-right",
        });
      } else {
        toast.success("LSI keywords generated successfully!", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error generating LSI:", error);
      toast.error(`Error generating LSI: ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setIsGeneratingLSI(false);
    }
  };

  const handleEditLSI = () => {
    originalCurrentLsiPairsRef.current = { ...currentLsiPairs }; // Save current state for cancel
    setIsEditingLSI(true);
  };

  const handleSaveLSI = async () => {
    setIsLoading(true);
    try {
      const cleanedLsiPairs = {};
      for (const key in currentLsiPairs) {
        cleanedLsiPairs[key] = currentLsiPairs[key].filter(
          (pair) => pair.keyword.trim() !== ""
        );
      }

      const { error } = await supabase.from("analysis").upsert(
        {
          row_id: row_id,
          updated_lsi_keywords: JSON.stringify(cleanedLsiPairs), // Save the entire currentLsiPairs object
        },
        { onConflict: "row_id" }
      );

      if (error) {
        throw error;
      }

      setIsEditingLSI(false);
      originalCurrentLsiPairsRef.current = { ...cleanedLsiPairs }; // Update ref with saved state
      setCurrentLsiPairs(cleanedLsiPairs); // Ensure state is updated after save
      toast.success("LSI keywords saved successfully!", {
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error saving LSI:", error.message || error);
      toast.error(
        `Failed to save LSI keywords: ${error.message || "Unknown error"}`,
        {
          position: "top-right",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelLSI = () => {
    setCurrentLsiPairs(originalCurrentLsiPairsRef.current); // Revert to saved state
    setIsEditingLSI(false);
  };

  const handleKeywordChange = (tableKey, pairIdx, field, value) => {
    const updatedPairs = [...currentLsiPairs[tableKey]];
    updatedPairs[pairIdx][field] = value;
    setCurrentLsiPairs({
      ...currentLsiPairs,
      [tableKey]: updatedPairs,
    });
  };

  const handleAddRow = (tableKey) => {
    const existingPairs = currentLsiPairs[tableKey] || [];
    setCurrentLsiPairs({
      ...currentLsiPairs,
      [tableKey]: [...existingPairs, { keyword: "", value: "", isNew: true }],
    });
  };

  const handleRemoveRow = (tableKey, pairIdx) => {
    const existingPairs = currentLsiPairs[tableKey] || [];
    const newPairs = existingPairs.filter((_, i) => i !== pairIdx);
    setCurrentLsiPairs({
      ...currentLsiPairs,
      [tableKey]: newPairs,
    });
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!row_id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords, updated_lsi_keywords, comp_analysis")
        .eq("row_id", row_id)
        .single();

      if (error) {
        // console.error("Error fetching analysis data:", error);
        toast.error("Start Server", { position: "top-right" });
        setIsLoading(false);
        return;
      }

      if (data) {
        if (data.lsi_keywords) {
          try {
            setLsiData(
              typeof data.lsi_keywords === "string"
                ? JSON.parse(data.lsi_keywords)
                : data.lsi_keywords
            );
          } catch (e) {
            console.error("Error parsing lsi_keywords:", e);
            setLsiData([]);
          }
        } else {
          setLsiData([]);
        }

        let displayPairs = {};

        console.log("shivani", data.updated_lsi_keywords);

        if (data) {
          if (data.updated_lsi_keywords === null) {
            console.log("inside shivani");
            displayPairs = {};
          } else if (data.updated_lsi_keywords) {
            // Changed to else if
            try {
              // This block runs if data.updated_lsi_keywords is not null
              // and also not undefined/falsey, which is implicitly handled
              // by the prior `=== null` check and this `else if`.
              displayPairs =
                typeof data.updated_lsi_keywords === "string"
                  ? JSON.parse(data.updated_lsi_keywords)
                  : data.updated_lsi_keywords;

              console.log("displayPairs", displayPairs);
            } catch (e) {
              console.error("Error parsing updated_lsi_keywords:", e);
              displayPairs = {};
            }
          }
          // This 'else if' will execute if the above 'if' and 'else if' conditions were false.
          // So, if updated_lsi_keywords was NOT null, AND it was NOT a parseable string/object (or didn't exist),
          // THEN it checks for lsi_keywords.
          else if (data.lsi_keywords) {
            // Corrected: removed semicolon, added 'else'
            console.log("inside lsi");

            // The inner `if (data.lsi_keywords)` is now redundant because `else if (data.lsi_keywords)` already ensures it's truthy.
            const parsedLsi =
              typeof data.lsi_keywords === "string"
                ? JSON.parse(data.lsi_keywords)
                : data.lsi_keywords;

            console.log("parsedLsi", parsedLsi);

            if (Array.isArray(parsedLsi)) {
              parsedLsi.forEach((item, idx) => {
                const baseKeywords = String(item.lsi_keywords || "");
                const pairs = [];
                const parts = baseKeywords.split(",");
                for (let i = 0; i < parts.length; i += 2) {
                  const keyword = parts[i] ? parts[i].trim() : "";
                  const value = parts[i + 1] ? parts[i + 1].trim() : "";
                  if (keyword) {
                    pairs.push({ keyword, value, isNew: false });
                  }
                }
                displayPairs[`${idx}_${item.url}`] = pairs;
              });
            }
          }
        }

        setCurrentLsiPairs(displayPairs);
        originalCurrentLsiPairsRef.current = displayPairs;

        if (data.comp_analysis) {
          setCompAnalysis(data.comp_analysis);
        }
      }
      setIsLoading(false);
    };

    fetchAnalysisData();
  }, [row_id]);

  const hasCurrentLsiDataToDisplay = Object.keys(currentLsiPairs).length > 0;

  return (
    <>
      <ToastContainer />
      <div className="container px-4 py-6 mx-auto">
        <main className="main-content step-component">
          <h3 className="text-2xl font-bold mb-8 text-blue-700">
            2. LSI Keywords Analysis
          </h3>
          {isLoading && <Loader />}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold text-gray-800">
                Manage LSI Keywords
              </h4>
              <div className="flex space-x-3">
                <button
                  onClick={generateLsi}
                  disabled={isGeneratingLSI || isLoading}
                  className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                    isGeneratingLSI || isLoading
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  }`}
                >
                  {isGeneratingLSI ? (
                    <Loader size={20} className="inline-block mr-2" />
                  ) : (
                    "Generate New LSI"
                  )}
                </button>

                {!isEditingLSI ? (
                  <button
                    onClick={handleEditLSI}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Edit All Current LSI Keywords"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveLSI}
                      className="p-2 text-green-600 hover:text-green-800 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                      title="Save All Changes"
                      disabled={isLoading}
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCancelLSI}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="Cancel All Editing"
                      disabled={isLoading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {lsiData.length === 0 && !isGeneratingLSI && (
              <div className="text-center py-10 text-gray-500 text-lg">
                No LSI keywords available. Please click "Generate New LSI" to
                get started.
              </div>
            )}

            {lsiData.map((item, idx) => {
              const tableKey = `${idx}_${item.url}`;

              const originalKeywordValuePairs = [];

              const baseKeywords = String(item.lsi_keywords || "");

              const parts = baseKeywords.split(",");

              for (let i = 0; i < parts.length; i += 2) {
                const keyword = parts[i] ? parts[i].trim() : "";

                const value = parts[i + 1]
                  ? parseFloat(parts[i + 1].trim())
                  : null;
                if (keyword) {
                  originalKeywordValuePairs.push({
                    keyword,
                    value: isNaN(value) ? null : value,
                  });
                }
              }

              const currentKeywordPairsToDisplay =
                currentLsiPairs[tableKey] || [];
              console.log(
                "Rendering editable LSI pairs for",
                tableKey,
                currentLsiPairs[tableKey]
              );

              return (
                <div
                  key={`competitor-lsi-${idx}`}
                  className="mb-8 p-5 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <p className="font-bold text-gray-800 text-lg mb-4">
                    Competitor {idx + 1}:{" "}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.url}
                    </a>
                  </p>

                  {/* ORIGINAL LSI KEYWORDS (READ-ONLY) TABLE */}
                  <h5 className="font-semibold text-gray-700 mb-2">
                    Original Generated LSI:
                  </h5>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left border border-gray-300 w-2/3">
                            Keyword
                          </th>
                          <th className="px-4 py-2 text-left border border-gray-300 w-1/3">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {originalKeywordValuePairs.length > 0 ? (
                          originalKeywordValuePairs.map((pair, pairIdx) => (
                            <tr
                              key={`original-pair-${idx}-${pairIdx}`}
                              className="border-b border-gray-200 last:border-0 hover:bg-white"
                            >
                              <td className="px-4 py-2 border border-gray-300">
                                {pair.keyword}
                              </td>
                              <td className="px-4 py-2 border border-gray-300">
                                {!isNaN(Number(pair.value)) && pair.value !== ""
                                  ? Number(pair.value).toFixed(10)
                                  : pair.value || "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              className="px-4 py-2 text-center text-gray-500 border border-gray-300"
                            >
                              No original keywords found for this source.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CURRENT / EDITED LSI KEYWORDS TABLE */}
                  <h5 className="font-semibold text-gray-700 mb-2">
                    Your Current LSI Keywords (Editable):
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left border border-gray-300 w-2/3">
                            Keyword
                          </th>
                          <th className="px-4 py-2 text-left border border-gray-300 w-1/3">
                            Value
                          </th>
                          {isEditingLSI && (
                            <th className="px-4 py-2 text-center border border-gray-300 w-24">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentKeywordPairsToDisplay.length > 0 ? (
                          currentKeywordPairsToDisplay.map((pair, pairIdx) => (
                            <tr
                              key={`editable-pair-${idx}-${pairIdx}`}
                              className="border-b border-gray-200 last:border-0 hover:bg-white"
                            >
                              <td className="px-4 py-2 border border-gray-300">
                                {isEditingLSI ? (
                                  <input
                                    type="text"
                                    value={pair.keyword}
                                    onChange={(e) =>
                                      handleKeywordChange(
                                        tableKey,
                                        pairIdx,
                                        "keyword",
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-1 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400"
                                  />
                                ) : (
                                  pair.keyword
                                )}
                              </td>
                              <td className="px-4 py-2 border border-gray-300">
                                {isEditingLSI ? (
                                  <input
                                    type="number"
                                    step="any"
                                    value={pair.value ?? ""}
                                    onChange={(e) =>
                                      handleKeywordChange(
                                        tableKey,
                                        pairIdx,
                                        "value",
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value)
                                      )
                                    }
                                    className="w-full p-1 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400"
                                  />
                                ) : !isNaN(Number(pair.value)) &&
                                  pair.value !== "" ? (
                                  Number(pair.value).toFixed(10)
                                ) : (
                                  pair.value || "N/A"
                                )}
                              </td>
                              {isEditingLSI && (
                                <td className="px-4 py-2 text-center border border-gray-300">
                                  <button
                                    onClick={() =>
                                      handleRemoveRow(tableKey, pairIdx)
                                    }
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full"
                                    title="Remove row"
                                  >
                                    <MinusCircle className="h-5 w-5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={isEditingLSI ? 3 : 2}
                              className="px-4 py-2 text-center text-gray-500 border border-gray-300"
                            >
                              No current keywords found for this source.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {isEditingLSI && (
                        <tfoot>
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-2 border border-gray-300 text-right"
                            >
                              <button
                                onClick={() => handleAddRow(tableKey)}
                                className="text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded-md inline-flex items-center space-x-1"
                              >
                                <PlusCircle className="h-5 w-5" />
                                <span>Add New Keyword</span>
                              </button>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })}
          </div>{" "}
          {/* End of global LSI Management block */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleApprove}
              className="bg-green-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={
                !hasCurrentLsiDataToDisplay || isEditingLSI || isLoading
              }
              title={
                !hasCurrentLsiDataToDisplay
                  ? "Generate LSI data first"
                  : isEditingLSI
                  ? "Save or cancel edits before approving"
                  : "Approve LSI keywords"
              }
            >
              Approve LSI Keywords
            </button>

            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-7 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next Step
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

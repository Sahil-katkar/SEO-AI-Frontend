"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect, useRef } from "react";
import { Pencil, Save, X, PlusCircle, MinusCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(false);
  const { updateProjectData } = useAppContext();
  // lsiData stores the "original" generated LSI keywords from the backend,
  // in the format: [{ url: "...", lsi_keywords: "kw1,val1,kw2,val2" }]
  // This is used for the READ-ONLY "Original Generated LSI" section.
  const [lsiData, setLsiData] = useState([]);

  // currentLsiPairs stores the "editable" LSI keywords for display and modification.
  // It's an object where keys are like "idx_url" and values are arrays of { keyword: "...", value: ..., isNew: boolean }
  // This is used for the EDITABLE "Your Current LSI Keywords (Editable)" section.
  const [currentLsiPairs, setCurrentLsiPairs] = useState({});

  const [isEditingLSI, setIsEditingLSI] = useState(false);
  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  // Used to store the state of currentLsiPairs before editing begins,
  // allowing a 'cancel' operation to revert changes.
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
    // Clear previous data immediately
    setLsiData([]);
    setCurrentLsiPairs({});
    originalCurrentLsiPairsRef.current = {};
    setIsEditingLSI(false); // Ensure editing mode is off during generation

    let accumulatedLsiData = []; // Local accumulator for original LSI data
    let accumulatedCurrentLsiPairs = {}; // Local accumulator for editable LSI data

    try {
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      // 1. Fetch data_scrape from the 'analysis' table
      const { data: dataScrapeRows, error: fetchErrorD } = await supabase
        .from("analysis")
        .select("data_scrape")
        .eq("row_id", row_id);

      if (fetchErrorD) {
        throw new Error(
          `Supabase fetch error (data_scrape): ${fetchErrorD.message}`
        );
      }

      if (
        !dataScrapeRows ||
        dataScrapeRows.length === 0 ||
        !dataScrapeRows[0].data_scrape
      ) {
        toast.warn(
          "No scraped data found in the database to generate LSI keywords.",
          { position: "top-right" }
        );
        setIsGeneratingLSI(false);
        return;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(dataScrapeRows[0].data_scrape);
        if (!Array.isArray(parsedData)) {
          throw new Error("data_scrape content is not a valid JSON array.");
        }
      } catch (e) {
        console.error("Error parsing data_scrape:", e);
        toast.error(
          "Failed to parse scraped data from database. It might be malformed.",
          { position: "top-right" }
        );
        setIsGeneratingLSI(false);
        return;
      }

      // 2. Iterate through each scraped data item and call the API sequentially
      for (let i = 0; i < parsedData.length; i++) {
        const item = parsedData[i];
        const raw_text = item.raw_text;
        const url = item.url || `Competitor ${i + 1}`; // Use URL from data_scrape or a generic name
        const tableKey = `${i}_${url}`; // Unique key for this competitor's data

        if (!raw_text || raw_text.trim() === "") {
          console.warn(
            `Skipping LSI generation for Competitor ${
              i + 1
            } (URL: ${url}) due to empty raw_text.`
          );
          // Add empty entries to accumulators to maintain structure if needed, or just skip
          // For now, let's just skip, which means the UI won't show an entry for this one.
          continue;
        }

        toast.info(`Generating LSI for Competitor ${i + 1} (${url})...`, {
          position: "top-right",
          autoClose: 2000,
        });

        const backendPayload = {
          extracted_data: raw_text,
          embedding_model_name: "spacy", // Or your desired model
        };

        let response;
        try {
          response = await fetch("/api/lsi-keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backendPayload),
          });
        } catch (fetchError) {
          console.error(
            `Network or API unreachable for Competitor ${i + 1} (URL: ${url}):`,
            fetchError
          );
          toast.error(
            `Network error for Competitor ${
              i + 1
            }. Please check your connection.`,
            { position: "top-right" }
          );
          continue; // Continue to next item
        }

        if (!response.ok) {
          const errorDetail = await response.text();
          console.error(
            `API call failed for Competitor ${i + 1} (URL: ${url}): ${
              response.status
            } ${response.statusText} - ${errorDetail}`
          );
          toast.error(
            `LSI generation failed for Competitor ${
              i + 1
            }. Error: ${errorDetail.substring(0, 100)}...`,
            { position: "top-right" }
          );
          continue; // Continue to next item even if one fails
        }

        const result = await response.json();
        console.log(`Raw API Response for Competitor ${i + 1}:`, result);

        if (result && Array.isArray(result.lsi_keyword)) {
          const currentItemLsiKeywordsForDB = []; // For original_lsi (string format)
          const parsedForEditable = []; // For updated_lsi (object array format)

          result.lsi_keyword.forEach((pairString) => {
            const parts = String(pairString).split(",");
            const keyword = parts[0] ? parts[0].trim() : "";
            const value = parts[1] ? parseFloat(parts[1].trim()) : null;

            if (keyword) {
              currentItemLsiKeywordsForDB.push(
                `${keyword},${value !== null ? value : ""}`
              );
              parsedForEditable.push({
                keyword,
                value: value !== null ? value : "",
                isNew: false,
              });
            }
          });

          // Update local accumulators
          accumulatedLsiData.push({
            url: url,
            lsi_keywords: currentItemLsiKeywordsForDB.join(","),
          });
          accumulatedCurrentLsiPairs[tableKey] = parsedForEditable;

          // Update UI state to show progress
          setLsiData([...accumulatedLsiData]); // Spread to ensure new array reference for re-render
          setCurrentLsiPairs({ ...accumulatedCurrentLsiPairs }); // Spread to ensure new object reference for re-render

          // Immediately save the accumulated data to the database
          const { error: upsertError } = await supabase.from("analysis").upsert(
            {
              row_id: row_id,
              lsi_keywords: JSON.stringify(accumulatedLsiData),
              updated_lsi_keywords: JSON.stringify(accumulatedCurrentLsiPairs),
            },
            { onConflict: "row_id" }
          );

          if (upsertError) {
            console.error(
              `Supabase upsert error for Competitor ${i + 1}:`,
              upsertError
            );
            toast.error(
              `Failed to save LSI for Competitor ${i + 1} to database.`,
              { position: "top-right" }
            );
          } else {
            toast.success(
              `LSI generated for Competitor ${i + 1} successfully!`,
              {
                position: "bottom-right",
                autoClose: 1500,
              }
            );
          }
        } else {
          console.warn(
            `API response for Competitor ${
              i + 1
            } (URL: ${url}) did not contain a valid 'lsi_keyword' array or expected format.`,
            result
          );
          toast.warn(
            `No valid LSI keywords returned for Competitor ${
              i + 1
            } in the expected 'keyword,value' format.`,
            { position: "top-right" }
          );
        }
      } // End of for loop

      // After the loop finishes (all competitors processed or skipped)
      // Update the originalCurrentLsiPairsRef with the final state
      originalCurrentLsiPairsRef.current = { ...accumulatedCurrentLsiPairs };

      toast.success("LSI keyword generation process completed!", {
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error during LSI generation process:", error);
      toast.error(`Error during LSI generation: ${error.message}`, {
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
        // Filter out rows where the keyword is empty before saving
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

      // PGRST116 means no rows found for the query, which is expected for new entries.
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching analysis data:", error);
        toast.error(
          "Failed to fetch analysis data. Please check server or database connection.",
          { position: "top-right" }
        );
        setIsLoading(false);
        return;
      }

      if (data) {
        // --- Populate lsiData (for "Original Generated LSI" - Read-Only) ---
        let parsedLsiFromDb = [];
        if (data.lsi_keywords) {
          try {
            // lsi_keywords should be an array of objects: [{url: "...", lsi_keywords: "kw1,val1,kw2,val2"}]
            parsedLsiFromDb =
              typeof data.lsi_keywords === "string"
                ? JSON.parse(data.lsi_keywords)
                : data.lsi_keywords;
            if (!Array.isArray(parsedLsiFromDb)) {
              console.warn(
                "lsi_keywords from DB is not an array after parsing, resetting to empty."
              );
              parsedLsiFromDb = [];
            }
          } catch (e) {
            console.error("Error parsing lsi_keywords from DB:", e);
            parsedLsiFromDb = [];
          }
        }
        setLsiData(parsedLsiFromDb); // Set the 'original' LSI data

        // --- Populate currentLsiPairs (for "Your Current LSI Keywords (Editable)") ---
        let displayPairs = {};
        if (data.updated_lsi_keywords) {
          try {
            // updated_lsi_keywords should be an object of objects: { "idx_url": [{keyword: "...", value: ...}, ...] }
            displayPairs =
              typeof data.updated_lsi_keywords === "string"
                ? JSON.parse(data.updated_lsi_keywords)
                : data.updated_lsi_keywords;
          } catch (e) {
            console.error("Error parsing updated_lsi_keywords:", e);
            displayPairs = {}; // Reset if parsing fails
          }
        }
        setCurrentLsiPairs(displayPairs);
        originalCurrentLsiPairsRef.current = displayPairs;
      }
      setIsLoading(false);
    };

    fetchAnalysisData();
  }, [row_id]);

  // Determines if the "Approve" button should be enabled.
  // It's enabled if there's *any* data in the editable section (currentLsiPairs)
  // and not currently editing or loading.
  const hasCurrentLsiDataToDisplay =
    Object.keys(currentLsiPairs).length > 0 &&
    Object.values(currentLsiPairs).some((arr) => arr.length > 0);

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

            {/* Display message if no LSI data is present and not currently generating */}
            {lsiData.length === 0 && !isGeneratingLSI && !isLoading && (
              <div className="text-center py-10 text-gray-500 text-lg">
                No LSI keywords available. Please click "Generate New LSI" to
                get started.
              </div>
            )}

            {/* Render LSI data for each competitor */}
            {Array.isArray(lsiData) &&
              lsiData.map((item, idx) => {
                // Construct a unique key for the competitor's LSI table based on index and URL
                const tableKey = `${idx}_${item.url}`;

                // Parse the original LSI keywords string into an array of objects for display
                const originalKeywordValuePairs = [];
                const baseKeywords = String(item.lsi_keywords || "");
                const parts = baseKeywords.split(",");
                for (let i = 0; i < parts.length; i += 2) {
                  const keyword = parts[i] ? parts[i].trim() : "";
                  const value = parts[i + 1] ? parts[i + 1].trim() : "";
                  if (keyword) {
                    originalKeywordValuePairs.push({
                      keyword,
                      value: parseFloat(value) || null, // Convert value to number or null
                    });
                  }
                }

                // Get the current editable LSI pairs for this competitor
                // This comes from `currentLsiPairs` state, which is either blank or from `updated_lsi_keywords` DB column
                const currentKeywordPairsToDisplay =
                  currentLsiPairs[tableKey] || [];

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
                                  {!isNaN(Number(pair.value)) &&
                                  pair.value !== null
                                    ? Number(pair.value).toFixed(10) // Display with high precision
                                    : "N/A"}
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
                            currentKeywordPairsToDisplay.map(
                              (pair, pairIdx) => (
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
                                        step="any" // Allows decimal values
                                        value={pair.value ?? ""} // Use the current value, or empty string if undefined/null
                                        onChange={(e) =>
                                          handleKeywordChange(
                                            tableKey,
                                            pairIdx,
                                            "value",
                                            e.target.value === ""
                                              ? "" // Keep as empty string for empty input
                                              : parseFloat(e.target.value) // Convert to float
                                          )
                                        }
                                        className="w-full p-1 border border-gray-300 rounded focus:ring-blue-400 focus:border-blue-400"
                                      />
                                    ) : !isNaN(Number(pair.value)) &&
                                      pair.value !== null ? (
                                      Number(pair.value).toFixed(10) // Display with high precision
                                    ) : (
                                      "N/A"
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
                              )
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={isEditingLSI ? 3 : 2}
                                className="px-4 py-2 text-center text-gray-500 border border-gray-300"
                              >
                                {isGeneratingLSI
                                  ? `Generating keywords for ${
                                      item.url || `Competitor ${idx + 1}`
                                    }...`
                                  : "No current keywords found for this source. Add new keywords above."}
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
                  ? "Add keywords in the editable section or load saved keywords before approving"
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

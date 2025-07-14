"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { useParams } from "next/navigation";
import { getData } from "../../../../utils/dbQueries";
// Assuming 'toast' is imported from a library like 'react-hot-toast'
// import toast from "react-hot-toast"; // Add this line if you use react-hot-toast

export default function DataScrape({
  competitorAnalysisData,
  valueAddResponseData,
  missionPlanResponseData,
  contentBriefResponseData,
}) {
  const supabase = createClientComponentClient();
  const [missionPlan, setMissionPlan] = useState(
    missionPlanResponseData ? missionPlanResponseData : contentBriefResponseData
  );
  const { file_id, index } = useParams();
  const row_id = "1IwGQtOHn4r3aA4twxboF4g1BJVekXM1Jl2GHNZNfVF_1";

  //   const row_id = `${file_id}_${index}`; // This is commented out, using the prop `row_id`
  const [isEditingMP, setIsEditingMP] = useState(false);
  const [isEditingMissionPlan, setIsEditingMissionPlan] = useState(false); // This seems to be a loading state for save
  const [scrapedData, setScrapedData] = useState([]); // This state will hold the array of scraped objects
  // const [error, setError] = useState(null); // Assuming you might have an error state

  const handleEditMissionPlan = () => {
    setIsEditingMP(true);
  };
  const handleCancelMission = () => {
    setIsEditingMP(false);
    // Optionally reset missionPlan to its original state or fetched data if cancel is pressed
    // setMissionPlan(missionPlanResponseData ? missionPlanResponseData : contentBriefResponseData);
  };

  const handleSaveMission = async () => {
    try {
      setIsEditingMissionPlan(true); // Set loading state for save operation
      const file_Id = row_id; // Using the row_id prop

      const { error: upsertError } = await supabase.from("row_details").upsert(
        {
          row_id: file_Id,
          mission_plan: missionPlan,
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        throw new Error(`Failed to save to database: ${upsertError.message}`);
      }

      // No need to set missionPlan here if it's already updated by onChange in textarea
      // setMissionPlan(missionPlan); // Ensure the state reflects the saved data

      console.log("Mission plan saved successfully.");
      // toast.success("Mission plan saved successfully.", { position: "top-right" });
    } catch (error) {
      // toast.error(error.message || "Save Error", { position: "top-right" });
      // setError(error.message);
      console.error("Error saving mission plan:", error.message);
    } finally {
      setIsEditingMissionPlan(false); // Reset loading state
      setIsEditingMP(false); // Exit edit mode
    }
  };

  const generateScrapeContent = async () => {
    console.log("[generateScrapeContent] Start", { row_id });
    // setError(null); // Clear previous errors

    try {
      const { data: fileLists, error: fetchError } = await getData(
        "row_details",
        ["comp_url"],
        "row_id",
        row_id
      );

      console.log("fileLists", fileLists);

      if (fetchError) {
        throw new Error(
          `Failed to fetch competitor URLs: ${fetchError.message}`
        );
      }

      if (!fileLists || fileLists.length === 0 || !fileLists[0].comp_url) {
        console.warn(
          "[generateScrapeContent] No competitor URLs found for row_id:",
          row_id
        );
        // toast.warn("No competitor URLs found.", { position: "top-right" });
        return;
      }

      const urls = fileLists[0].comp_url
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);

      if (urls.length === 0) {
        console.warn("[generateScrapeContent] No valid URLs after parsing.");
        // toast.warn("No valid competitor URLs to scrape.", { position: "top-right" });
        return;
      }

      console.log(
        "[generateScrapeContent] Fetching /api/data-scrape with URLs:",
        urls
      );
      const res = await fetch("/api/data-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competitor_urls: urls }),
      });

      if (res.ok) {
        const responseData = await res.json().catch(() => null);
        // Ensure responseData is an array, if not, default to empty array
        const actualScrapedData = Array.isArray(responseData)
          ? responseData
          : [];

        // ***************************************************************
        // KEY CHANGE: Set the 'scrapedData' state with the full array
        setScrapedData(actualScrapedData);
        // ***************************************************************

        // Optionally, combine all raw_texts into one string for the 'missionPlan' textarea
        // This allows the user to see/edit a consolidated view if desired.
        const combinedText = actualScrapedData
          .map((item) => item.raw_text)
          .join("\n\n");
        setMissionPlan(combinedText);

        console.log(
          "[generateScrapeContent] /api/data-scrape response OK",
          responseData
        );
        // toast.success("Content scraped successfully!", { position: "top-right" });
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        const errorMessage = `Failed to scrape content: ${
          errorData.message || res.statusText
        }`;
        console.error(
          "[generateScrapeContent] /api/data-scrape response not OK",
          res.status,
          errorMessage
        );
        // toast.error(errorMessage, { position: "top-right" });
        // setError(errorMessage);
      }
    } catch (error) {
      console.error("[generateScrapeContent] Exception:", error);
      // toast.error(error.message || "An unexpected error occurred during scraping.", { position: "top-right" });
      // setError(error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Main Title Section - Mimics "2. LSI Keywords Analysis" */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 pb-2 border-b-2 border-green-500">
          2. Scraped Content Analysis
        </h2>
      </div>

      {/* Manage Scraped Content Section - Mimics "Manage LSI Keywords" */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            Manage Scraped Content
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => generateScrapeContent()}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
              disabled={isEditingMissionPlan} // Disable during save operation
            >
              Generate Scraped Content
            </button>

            {!isEditingMP && (
              <button
                onClick={() => handleEditMissionPlan()}
                className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
                disabled={isEditingMissionPlan || !missionPlan} // Disable edit if no content or during save
              >
                {/* Edit icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14.25v4.75a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4.75"
                  />
                </svg>
              </button>
            )}

            {isEditingMP && (
              <>
                <button
                  onClick={handleSaveMission}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 text-sm"
                  disabled={isEditingMissionPlan} // Disable during save operation
                >
                  Save
                </button>
                <button
                  onClick={handleCancelMission}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                  disabled={isEditingMissionPlan} // Disable during save operation
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content area: textarea or "No data" message */}
        {missionPlan || isEditingMP ? (
          <textarea
            disabled={!isEditingMP}
            className="w-full border p-3 rounded focus:outline-[#1abc9c] focus:outline-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600 text-sm"
            rows="10"
            value={missionPlan ?? ""}
            onChange={(e) => setMissionPlan(e.target.value)}
            placeholder="Scraped content will appear here..."
          />
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm">
            No scraped content available. Please click "Generate Scraped
            Content" to get started.
          </p>
        )}
      </div>

      {/* Individual Scraped Results Section (kept for functionality, not in image) */}
      {scrapedData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Individual Scraped Results:
          </h3>
          <div className="grid gap-4">
            {scrapedData.map((item, idx) => (
              <div
                key={item.url || idx}
                className="p-4 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="font-semibold text-gray-700 mb-1">URL:</div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-medium text-blue-600 hover:underline mb-2 break-all text-sm"
                >
                  {item.url}
                </a>
                <div className="font-semibold text-gray-700 mb-1">
                  Scraped Content:
                </div>
                <div className="text-gray-700 whitespace-pre-line text-sm max-h-40 overflow-y-auto bg-white p-2 rounded-sm border border-gray-100">
                  {item.raw_text}
                </div>
                {item.error && (
                  <div className="text-red-500 mt-2 text-sm">
                    Error: {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

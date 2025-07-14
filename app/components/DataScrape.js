"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";
// Assuming 'toast' is imported from a library like 'react-hot-toast'
// import toast from "react-hot-toast";

// Ensure getData utility function is correctly imported and available
import { getData } from "../../utils/dbQueries";

export default function DataScrape({
  row_id, // Only row_id is relevant for this specific task
}) {
  const supabase = createClientComponentClient();

  const [scrapedData, setScrapedData] = useState([]); // Array of scraped objects { url, raw_text, error? }
  const [editingItemIndex, setEditingItemIndex] = useState(null); // Index of the item being edited
  const [editedText, setEditedText] = useState(""); // Text in the textarea for the currently edited item
  const [isLoadingScrape, setIsLoadingScrape] = useState(false); // For "Generate Scraped Content" button
  const [isSavingScrapedItem, setIsSavingScrapedItem] = useState(false); // For "Save" button on individual item

  // Fetch initial scraped data on component mount
  useEffect(() => {
    async function fetchInitialScrapedData() {
      if (row_id) {
        try {
          const { data, error } = await getData(
            "analysis", // Assuming 'analysis' table has 'data_scrape' column
            ["data_scrape"],
            "row_id",
            row_id
          );

          if (error) {
            console.error(
              "Error fetching initial scraped data:",
              error.message
            );
            // toast.error("Error loading previous scraped data.");
            return;
          }

          if (data && data.length > 0 && data[0].data_scrape) {
            // Ensure data[0].data_scrape is an array, if not, default to empty
            setScrapedData(
              Array.isArray(data[0].data_scrape) ? data[0].data_scrape : []
            );
          }
        } catch (err) {
          console.error("Exception fetching initial scraped data:", err);
          // toast.error("An unexpected error occurred while loading data.");
        }
      }
    }
    fetchInitialScrapedData();
  }, [row_id]); // Dependency array: re-run if row_id changes

  // Handlers for individual scraped items
  const handleEditScrapedItem = (index) => {
    setEditingItemIndex(index);
    setEditedText(scrapedData[index].raw_text);
  };

  const handleCancelScrapedEdit = () => {
    setEditingItemIndex(null);
    setEditedText("");
  };

  const handleSaveScrapedItem = async () => {
    if (editingItemIndex === null) return; // Should not happen if button is correctly enabled/disabled

    setIsSavingScrapedItem(true);
    try {
      // Create a new array with the updated raw_text for the specific item
      const updatedScrapedData = scrapedData.map((item, idx) =>
        idx === editingItemIndex ? { ...item, raw_text: editedText } : item
      );

      // Update local state first for immediate UI feedback
      setScrapedData(updatedScrapedData);

      // Save the entire updated array to the database
      const { error: upsertError } = await supabase.from("analysis").upsert(
        {
          row_id: row_id,
          data_scrape: updatedScrapedData, // Save the actual array here
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        throw new Error(
          `Failed to save updated scraped data to database: ${upsertError.message}`
        );
      }

      // toast.success("Scraped item saved successfully!", { position: "top-right" });
      console.log("Scraped item saved successfully to DB!");
    } catch (error) {
      console.error("Error saving scraped item:", error.message);
      // toast.error(error.message || "Error saving scraped item.", { position: "top-right" });
      // If save fails, you might want to revert the local state or refetch to show correct data.
      // For simplicity, we'll leave it as is for now, user can re-edit.
    } finally {
      setIsSavingScrapedItem(false);
      setEditingItemIndex(null); // Exit edit mode
      setEditedText(""); // Clear edited text
    }
  };

  const generateScrapeContent = async () => {
    console.log("[generateScrapeContent] Start", { row_id });
    // setError(null); // Clear previous errors (if you have an error state)
    setIsLoadingScrape(true);

    try {
      const { data: fileLists, error: fetchError } = await getData(
        "row_details", // Assuming 'row_details' table has 'comp_url'
        ["comp_url"],
        "row_id",
        row_id
      );

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
        setScrapedData([]); // Clear previous scraped data if no URLs
        return;
      }

      const urls = fileLists[0].comp_url
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean); // Filter out empty strings

      if (urls.length === 0) {
        console.warn("[generateScrapeContent] No valid URLs after parsing.");
        // toast.warn("No valid competitor URLs to scrape.", { position: "top-right" });
        setScrapedData([]); // Clear previous scraped data if no valid URLs
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
        const responseData = await res.json();
        console.log("API response for scrape:", responseData);

        // Ensure responseData is an array, if not, default to empty array
        const actualScrapedData = Array.isArray(responseData)
          ? responseData
          : [];

        // Set the scrapedData state for individual display
        setScrapedData(actualScrapedData);

        // Save the *array* of newly scraped data to the database under 'data_scrape'
        const { error: upsertError } = await supabase.from("analysis").upsert(
          {
            row_id: row_id,
            data_scrape: actualScrapedData, // Save the actual array here
          },
          { onConflict: "row_id" }
        );

        if (upsertError) {
          throw new Error(
            `Failed to save newly scraped data to database: ${upsertError.message}`
          );
        }

        console.log(
          "[generateScrapeContent] /api/data-scrape response OK and saved to DB."
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
        // setError(errorMessage); // if error state exists
        setScrapedData([]); // Clear previous data on failure
      }
    } catch (error) {
      console.error("[generateScrapeContent] Exception:", error);
      // toast.error(error.message || "An unexpected error occurred during scraping.", { position: "top-right" });
      // setError(error.message); // if error state exists
      setScrapedData([]); // Clear previous data on failure
    } finally {
      setIsLoadingScrape(false);
      console.log("[generateScrapeContent] End");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen w-full">
      {/* Main Title Section - Mimics "2. LSI Keywords Analysis" */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 pb-2 border-b-2 border-green-500">
          2. Scraped Content Analysis
        </h2>
      </div>

      {/* Consolidated Section for both Generation and Display */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        {/* Generate Scraped Content Part */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 border-none">
            Generate Raw Scraped Content
          </h3>
          <button
            onClick={generateScrapeContent}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
            disabled={isLoadingScrape || isSavingScrapedItem} // Disable while scraping or saving an item
          >
            {isLoadingScrape ? "Generating..." : "Generate Scraped Content"}
          </button>
        </div>
        {scrapedData.length === 0 && !isLoadingScrape && (
          <p className="text-gray-500 text-center py-8 text-sm">
            No scraped content available. Click "Generate Scraped Content" to
            fetch data from competitor URLs.
          </p>
        )}
        {isLoadingScrape && (
          <p className="text-gray-500 text-center py-8 text-sm">
            Scraping content, please wait...
          </p>
        )}

        {/* Individual Scraped Results Part - only render if data exists */}
        {scrapedData.length > 0 && (
          // Added mt-6, border-t, and pt-6 for visual separation
          <div className="mt-6 border-t pt-6 border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Individual Scraped Results:
            </h3>
            <div className="grid gap-4">
              {scrapedData.map((item, idx) => (
                <div
                  key={item.url || idx} // Use url as key if unique, otherwise fallback to index
                  className="p-4 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-gray-700">URL:</div>
                    {/* Show Edit button only if not in edit mode and no error for this item */}
                    {!item.error && editingItemIndex !== idx && (
                      <button
                        onClick={() => handleEditScrapedItem(idx)}
                        className="text-blue-600 hover:underline text-sm px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
                        disabled={isSavingScrapedItem || isLoadingScrape} // Disable if saving another item or scraping
                      >
                        Edit Content
                      </button>
                    )}
                  </div>
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
                  {/* Conditionally render editable textarea or read-only textarea */}
                  {editingItemIndex === idx ? (
                    <>
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y min-h-[100px] max-h-[400px] text-sm"
                        rows={5}
                        style={{ overflowY: "auto" }} // Ensure scrollbar appears
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelScrapedEdit}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
                          disabled={isSavingScrapedItem}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveScrapedItem}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
                          disabled={isSavingScrapedItem}
                        >
                          {isSavingScrapedItem ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    // Display as a read-only textarea
                    <textarea
                      value={item.raw_text}
                      readOnly // Make it read-only
                      className="w-full p-2 border border-gray-100 rounded-sm bg-white text-gray-700 text-sm resize-y min-h-[100px] max-h-40 overflow-y-auto"
                      rows={5} // Provide a default number of rows
                      style={{ whiteSpace: "pre-line" }} // Retain pre-line behavior for display
                    />
                  )}
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
    </div>
  );
}

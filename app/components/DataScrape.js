"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getData } from "../../utils/dbQueries";

export default function DataScrape({ row_id }) {
  const supabase = createClientComponentClient();
  const [scrapedData, setScrapedData] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [isLoadingScrape, setIsLoadingScrape] = useState(false);
  const [isSavingScrapedItem, setIsSavingScrapedItem] = useState(false);

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;

  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/lsi-keywords/${fileId}/${index}`);
  };

  useEffect(() => {
    async function fetchInitialScrapedData() {
      if (row_id) {
        try {
          const { data, error } = await getData(
            "analysis",
            ["data_scrape"],
            "row_id",
            row_id
          );
          if (error) {
            console.error(
              "Error fetching initial scraped data:",
              error.message
            );
            return;
          }

          const parsedArr = JSON.parse(data[0].data_scrape);
          setScrapedData(parsedArr)

          // if (data && data.length > 0 && data[0].data_scrape) {
            // setScrapedData(
              // Array.isArray(data[0].data_scrape) ? data[0].data_scrape : []
            // );
          // }
        } catch (err) {
          console.error("Exception fetching initial scraped data:", err);
        }
      }
    }
    fetchInitialScrapedData();
  }, [row_id]);

  const handleEditScrapedItem = (index) => {
    setEditingItemIndex(index);
    setEditedText(scrapedData[index].raw_text);
  };

  const handleCancelScrapedEdit = () => {
    setEditingItemIndex(null);
    setEditedText("");
  };

  const handleSaveScrapedItem = async () => {
    if (editingItemIndex === null) return;

    setIsSavingScrapedItem(true);
    try {
      const updatedScrapedData = scrapedData.map((item, idx) =>
        idx === editingItemIndex ? { ...item, raw_text: editedText } : item
      );
      setScrapedData(updatedScrapedData);
      const { error: upsertError } = await supabase.from("analysis").upsert(
        {
          row_id: row_id,
          data_scrape: updatedScrapedData,
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        throw new Error(
          `Failed to save updated scraped data to database: ${upsertError.message}`
        );
      }
      console.log("Scraped item saved successfully to DB!");
    } catch (error) {
      console.error("Error saving scraped item:", error.message);
    } finally {
      setIsSavingScrapedItem(false);
      setEditingItemIndex(null);
      setEditedText("");
    }
  };

  const generateScrapeContent = async () => {
    console.log("[generateScrapeContent] Start", { row_id });
    setIsLoadingScrape(true);

    try {
      const { data: fileLists, error: fetchError } = await getData(
        "row_details",
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
        setScrapedData([]);
        return;
      }

      const urls = fileLists[0].comp_url
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean);

      if (urls.length === 0) {
        console.warn("[generateScrapeContent] No valid URLs after parsing.");
        setScrapedData([]);
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
        const actualScrapedData = Array.isArray(responseData)
          ? responseData
          : [];

        setScrapedData(actualScrapedData);

        const { error: upsertError } = await supabase.from("analysis").upsert(
          {
            row_id: row_id,
            data_scrape: actualScrapedData,
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
        setScrapedData([]);
      }
    } catch (error) {
      console.error("[generateScrapeContent] Exception:", error);
      setScrapedData([]);
    } finally {
      setIsLoadingScrape(false);
      console.log("[generateScrapeContent] End");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen w-full">
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 pb-2 border-b-2 border-[#1abc9c]">
          2. Data Scraping
        </h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 border-none">
            Generate Raw Scraped Content
          </h3>
          <button
            onClick={generateScrapeContent}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
            disabled={isLoadingScrape || isSavingScrapedItem}
          >
            {isLoadingScrape ? "Generating..." : "Generate Scraped Content"}
          </button>
        </div>
        {scrapedData.length === 0 && !isLoadingScrape && (
          <p className="text-gray-500 text-center py-8 text-sm">
            No scraped content available. Click &quot;Generate Scraped
            Content&quot; to fetch data from competitor URLs.
          </p>
        )}
        {isLoadingScrape && (
          <p className="text-gray-500 text-center py-8 text-sm">
            Scraping content, please wait...
          </p>
        )}

        {scrapedData.length > 0 && (
          <div className="mt-6 border-t pt-6 border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Individual Scraped Results:
            </h3>
            <div className="grid gap-4">
              {scrapedData.map((item, idx) => (
                <div
                  key={item.url || idx}
                  className="p-4 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-gray-700">URL:</div>
                    {!item.error && editingItemIndex !== idx && (
                      <button
                        onClick={() => handleEditScrapedItem(idx)}
                        className=""
                        disabled={isSavingScrapedItem || isLoadingScrape}
                      >
                        Edit
                      </button>
                    )}

                    {editingItemIndex === idx && (
                      <div className="flex justify-end gap-2">
                        
                        <button
                          onClick={handleSaveScrapedItem}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
                          disabled={isSavingScrapedItem}
                        >
                          {isSavingScrapedItem ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelScrapedEdit}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
                          disabled={isSavingScrapedItem}
                        >
                          Cancel
                        </button>
                      </div>
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
                  {editingItemIndex === idx ? (
                    <>
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="border border-gray-300 rounded-md bg-white focus:border-none focus:outline-[#1abc9c] focus:outline-2"
                        rows={5}
                        style={{ overflowY: "auto" }}
                      />
                    </>
                  ) : (
                    <textarea
                      value={item.raw_text}
                      readOnly
                      className=""
                      rows={5}
                      disabled={true}
                      style={{ whiteSpace: "pre-line" }}
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

        <button
          onClick={handleNext}
          className="mt-[20px] ml-auto"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

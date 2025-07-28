"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import Loader from "./common/Loader";
import { ToastContainer, toast } from "react-toastify";

export default function CompetitorAnalysis({
  competitorAnalysisData,
  index,
  row_id,
}) {
  const supabase = createClientComponentClient();
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [editedCompAnalysis, setEditedCompAnalysis] = useState("");
  const [compAnalysis, setCompAnalysis] = useState(competitorAnalysisData);
  const [isAnalysisGenerated, setIsAnalysisGenerated] = useState(false);

  const [editCompAnalysis, setEditCompAnalysis] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });

  const handleEditCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: true });
    setEditedCompAnalysis(compAnalysis);
  };

  const handleSaveCompAnalysis = async (compIndex) => {
    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        comp_analysis: editedCompAnalysis,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      toast.error(error.message || "Error saving competitor analysis", {
        position: "top-right",
      });
    } else {
      setCompAnalysis(editedCompAnalysis);
      setEditCompAnalysis({ ...editCompAnalysis, [`comp${compIndex}`]: false });
    }
  };

  const handleCancelCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: false });
    setEditedCompAnalysis(compAnalysis);
  };

  // const generateAnalysis = async () => {
  //   setIsGeneratingAnalysis(true);
  //   if (!row_id) {
  //     throw new Error("Invalid or missing row_id");
  //   }

  //   const { data: lsi_keywords, error } = await supabase
  //     .from("analysis")
  //     .select("lsi_keywords")
  //     .eq("row_id", row_id);

  //   console.log("data_scrape", data_scrape);

  //   if (error) {
  //     throw new Error(`Supabase error: ${error.message}`);
  //   } else {
  //     console.log("lsi_keywords", lsi_keywords);
  //     if (lsi_keywords === null || lsi_keywords === undefined) {
  //       toast.error("Raw Text or Competitor URL is missing");
  //       return;
  //     }

  //     if (lsi_keywords && lsi_keywords.length > 0) {
  //       const jsonString = lsi_keywords[0].lsi_keywords;

  //       try {
  //         const parsedData = JSON.parse(jsonString);

  //         const comp_contents = parsedData.map((item) => item.raw_text);

  //         const url = parsedData.map((item) => item.url);

  //         const { data: data_scrape, errorScrpe } = await supabase
  //           .from("analysis")
  //           .select("data_scrape")
  //           .eq("row_id", row_id);

  //         // const competitorData = parsedData.map((item) => ({
  //         //   raw_text: item.raw_text,
  //         //   url: item.url,
  //         // }));

  //         const payload = {
  //           // comp_contents: competitorData,
  //           comp_contents: data_scrape,
  //         };

  //         try {
  //           const response = await fetch("/api/comp-analysis", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify(payload),
  //           });

  //           let data;
  //           if (!response.ok) {
  //             let errorMsg = `HTTP error: ${response.status}`;
  //             try {
  //               const errorData = await response.json();

  //               console.log("errorData", errorData);

  //               errorMsg = errorData.error || errorMsg;
  //             } catch (jsonErr) {
  //               errorMsg = response.statusText || errorMsg;
  //             }
  //             throw new Error(errorMsg);
  //           } else {
  //             let compAnalysisText = await response.json();
  //             console.log("comp_data", data);

  //             data = compAnalysisText.competitor_analysis;
  //             console.log("compAnalysisText (extracted string):", data);
  //           }

  //           setCompAnalysis(data);

  //           const { data: lsi_data, error } = await supabase
  //             .from("analysis")
  //             .upsert(
  //               {
  //                 row_id: row_id,
  //                 comp_analysis: data,
  //               },
  //               { onConflict: "row_id" }
  //             );

  //           if (lsi_data) {
  //             console.log("added succesfully");
  //           }

  //           console.log("data", data);
  //         } catch (e) {
  //           let msg = e.message || "";
  //           if (msg.includes("404")) {
  //             msg = "The requested resource was not found (404).";
  //           } else if (msg.includes("501")) {
  //             msg = "This feature is not implemented on the server (501).";
  //           } else if (msg === "Failed to fetch") {
  //             msg = "API is not available. Please try again later.";
  //           } else if (!msg) {
  //             msg = "An unexpected error occurred.";
  //           }
  //           toast.error(msg, { position: "top-right" });
  //         }
  //       } catch (parseError) {
  //         toast.error("Errorsssssssssssssss ", {
  //           position: "top-right",
  //         });
  //       }
  //     }
  //   }
  //   setIsGeneratingAnalysis(false);
  //   setIsAnalysisGenerated(true);
  // };
  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      // Wrap the entire function logic in a try-catch for better overall error handling
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      // 1. Fetch LSI keywords
      const { data: lsi_keywords_data, error: lsiError } = await supabase
        .from("analysis")
        .select("lsi_keywords")
        .eq("row_id", row_id);

      if (lsiError) {
        throw new Error(
          `Supabase error fetching LSI keywords: ${lsiError.message}`
        );
      }

      let parsedLsiKeywords;
      if (
        !lsi_keywords_data ||
        lsi_keywords_data.length === 0 ||
        !lsi_keywords_data[0].lsi_keywords
      ) {
        // This covers cases where no data is found or lsi_keywords column is null/empty
        toast.error("LSI Keywords data is missing or empty for this row.");
        setIsGeneratingAnalysis(false);
        return;
      }

      try {
        // Assuming lsi_keywords is stored as a JSON string
        parsedLsiKeywords = JSON.parse(lsi_keywords_data[0].lsi_keywords);
        if (
          !Array.isArray(parsedLsiKeywords) ||
          parsedLsiKeywords.length === 0
        ) {
          toast.error(
            "Parsed LSI Keywords are not a valid array or are empty."
          );
          setIsGeneratingAnalysis(false);
          return;
        }
      } catch (parseError) {
        toast.error(`Error parsing LSI keywords JSON: ${parseError.message}`);
        setIsGeneratingAnalysis(false);
        return;
      }

      // Extract raw_text and url from parsed LSI keywords (if needed by your API)
      // const comp_contents_from_lsi = parsedLsiKeywords.map((item) => item.raw_text);
      // const urls_from_lsi = parsedLsiKeywords.map((item) => item.url);

      // 2. Fetch data_scrape (competitor content)
      // Removed the early console.log for data_scrape as it was undefined.
      const { data: data_scrape_result, error: scrapeError } = await supabase
        .from("analysis")
        .select("data_scrape")
        .eq("row_id", row_id);

      if (scrapeError) {
        throw new Error(
          `Supabase error fetching data_scrape: ${scrapeError.message}`
        );
      }

      console.log("data_scrape_result from DB:", data_scrape_result); // Now this will show the fetched data

      let actualCompContentsForAPI = [];
      if (
        data_scrape_result &&
        data_scrape_result.length > 0 &&
        data_scrape_result[0].data_scrape
      ) {
        const scrapedDataValue = data_scrape_result[0].data_scrape;
        // Check if it's already an array or if it's a JSON string that needs parsing
        if (Array.isArray(scrapedDataValue)) {
          actualCompContentsForAPI = scrapedDataValue;
        } else if (typeof scrapedDataValue === "string") {
          try {
            // Attempt to parse if it's a JSON string of an array or object
            const parsedScrapedData = JSON.parse(scrapedDataValue);
            if (Array.isArray(parsedScrapedData)) {
              actualCompContentsForAPI = parsedScrapedData;
            } else {
              // If it's a single object/string, wrap it in an array for the API
              actualCompContentsForAPI = [parsedScrapedData];
            }
          } catch (jsonParseErr) {
            // If it's just a raw text string that couldn't be parsed as JSON, wrap it
            actualCompContentsForAPI = [scrapedDataValue];
          }
        } else {
          // If it's a single non-string non-array value, wrap it
          actualCompContentsForAPI = [scrapedDataValue];
        }
      } else {
        toast.error("Competitor raw text (data_scrape) is missing or empty.");
        setIsGeneratingAnalysis(false);
        return;
      }

      const payload = {
        comp_contents: actualCompContentsForAPI, // THIS IS THE KEY FIX
        ai_studio_check: true
      };

      let competitorAnalysisResult;
      try {
        const response = await fetch("/api/comp-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorMsg = `HTTP error: ${response.status}`;
          try {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            errorMsg = errorData.error || errorMsg;
          } catch (jsonErr) {
            errorMsg = response.statusText || errorMsg;
          }
          throw new Error(errorMsg);
        } else {
          const compAnalysisResponse = await response.json();
          console.log(
            "compAnalysisResponse (raw from API):",
            compAnalysisResponse
          );

          // Assuming your API returns { competitor_analysis: "..." }
          competitorAnalysisResult = compAnalysisResponse.competitor_analysis;
          if (typeof competitorAnalysisResult !== "string") {
            throw new Error(
              "API response 'competitor_analysis' is not a string."
            );
          }
          console.log(
            "competitor_analysis (extracted string):",
            competitorAnalysisResult
          );

          setCompAnalysis(competitorAnalysisResult);
        }

        // 3. Upsert competitor analysis back to Supabase
        const { data: upsertData, error: upsertError } = await supabase
          .from("analysis")
          .upsert(
            {
              row_id: row_id,
              comp_analysis: competitorAnalysisResult,
            },
            { onConflict: "row_id" }
          );

        if (upsertError) {
          throw new Error(
            `Supabase error updating analysis: ${upsertError.message}`
          );
        } else {
          console.log(
            "Competitor analysis added/updated successfully:",
            upsertData
          );
          toast.success("Competitor analysis generated and saved!");
        }
      } catch (apiFetchError) {
        let msg =
          apiFetchError.message ||
          "An unexpected error occurred during API call.";
        if (msg.includes("404")) {
          msg = "The analysis service was not found (404).";
        } else if (msg.includes("501")) {
          msg = "The analysis feature is not implemented on the server (501).";
        } else if (msg === "Failed to fetch") {
          msg = "Analysis API is not available. Please try again later.";
        }
        toast.error(msg, { position: "top-right" });
      }
    } catch (overallError) {
      // Catch any top-level errors that weren't handled by specific try-catch blocks
      console.error("Overall analysis generation error:", overallError);
      toast.error(
        overallError.message ||
          "An unexpected error occurred during analysis generation.",
        { position: "top-right" }
      );
    } finally {
      // Ensure loading states are reset even if an error occurs
      setIsGeneratingAnalysis(false);
      setIsAnalysisGenerated(true); // Assuming you always set this to true upon completion (success or error)
    }
  };
  return (
    <div className="p-4">
      <div className="mb-[8px] flex justify-between items-center">
        <p className="font-bold text-[24px] ">Competitor Analysis</p>
        <div className="flex gap-[8px]">
          {!compAnalysis && (
            <button onClick={generateAnalysis} disabled={isGeneratingAnalysis}>
              {isGeneratingAnalysis ? (
                <Loader size={20} />
              ) : (
                "Generate Analysis"
              )}
            </button>
          )}
          {compAnalysis && (
            <>
              {!editCompAnalysis[`comp${index + 1}`] && (
                <button
                  onClick={() => {
                    handleEditCompAnalysis(index + 1);
                  }}
                >
                  Edit
                </button>
              )}
              {editCompAnalysis[`comp${index + 1}`] && (
                <>
                  <button onClick={() => handleSaveCompAnalysis(index + 1)}>
                    Save
                  </button>
                  <button onClick={() => handleCancelCompAnalysis(index + 1)}>
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <textarea
        disabled={!editCompAnalysis[`comp${index + 1}`]}
        className="focus:outline-[#1abc9c] focus:outline-2 !mb-0"
        rows="10"
        value={
          editCompAnalysis[`comp${index + 1}`]
            ? editedCompAnalysis ?? ""
            : compAnalysis ?? ""
        }
        onChange={(e) => setEditedCompAnalysis(e.target.value)}
      />
      <ToastContainer />
    </div>
  );
}

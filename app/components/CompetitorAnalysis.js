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

  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    if (!row_id) {
      throw new Error("Invalid or missing row_id");
    }

    const { data: lsi_keywords, error } = await supabase
      .from("analysis")
      .select("lsi_keywords")
      .eq("row_id", row_id);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    } else {
      console.log("lsi_keywords", lsi_keywords);
      if (lsi_keywords === null || lsi_keywords === undefined) {
        toast.error("Raw Text or Competitor URL is missing");
        return;
      }

      if (lsi_keywords && lsi_keywords.length > 0) {
        const jsonString = lsi_keywords[0].lsi_keywords;

        try {
          const parsedData = JSON.parse(jsonString);

          const comp_contents = parsedData.map((item) => item.raw_text);

          const url = parsedData.map((item) => item.url);

          const competitorData = parsedData.map((item) => ({
            raw_text: item.raw_text,
            url: item.url,
          }));

          const payload = {
            comp_contents: competitorData,
          };

          try {
            const response = await fetch("/api/comp-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            let data;
            if (!response.ok) {
              let errorMsg = `HTTP error: ${response.status}`;
              try {
                const errorData = await response.json();

                console.log("errorData", errorData);

                errorMsg = errorData.error || errorMsg;
              } catch (jsonErr) {
                errorMsg = response.statusText || errorMsg;
              }
              throw new Error(errorMsg);
            } else {
              let compAnalysisText = await response.json();
              console.log("comp_data", data);

              data = compAnalysisText.competitor_analysis;
              console.log("compAnalysisText (extracted string):", data);
            }

            setCompAnalysis(data);

            const { data: lsi_data, error } = await supabase
              .from("analysis")
              .upsert(
                {
                  row_id: row_id,
                  comp_analysis: data,
                },
                { onConflict: "row_id" }
              );

            if (lsi_data) {
              console.log("added succesfully");
            }

            console.log("data", data);
          } catch (e) {
            let msg = e.message || "";
            if (msg.includes("404")) {
              msg = "The requested resource was not found (404).";
            } else if (msg.includes("501")) {
              msg = "This feature is not implemented on the server (501).";
            } else if (msg === "Failed to fetch") {
              msg = "API is not available. Please try again later.";
            } else if (!msg) {
              msg = "An unexpected error occurred.";
            }
            toast.error(msg, { position: "top-right" });
          }
        } catch (parseError) {
          toast.error("Errorsssssssssssssss ", {
            position: "top-right",
          });
        }
      }
    }
    setIsGeneratingAnalysis(false);
    setIsAnalysisGenerated(true);
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
                "Generate Analysisssss"
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

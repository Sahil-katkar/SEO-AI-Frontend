"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import Loader from "./common/Loader";

export default function ValueAdd({
  competitorAnalysisData,
  valueAddResponseData,
  index,
  row_id,
}) {
  const supabase = createClientComponentClient();
  const compAnalysis = competitorAnalysisData && valueAddResponseData;
  const [valueAdd, setValueAdd] = useState(valueAddResponseData);
  const [isGeneratingValueAdd, setIsGeneratingValueAdd] = useState(false);
  const [editedValueAdd, setEditedValueAdd] = useState("");
  const [editValueAdd, setEditValueAdd] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });

  const handleSaveValueAdd = async (compIndex) => {
    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        value_add: editedValueAdd,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      toast.error(error.message || "Error saving value add", {
        position: "top-right",
      });
    } else {
      setValueAdd(editedValueAdd);
    }
  };

  const handleEditValueAdd = (item) => {
    setEditedValueAdd(valueAdd);
  };

  const handleCancelValueAdd = (item) => {
    setEditedValueAdd(valueAdd);
  };

  const generateValueAdd = async () => {
    setIsGeneratingValueAdd(true);
    try {
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      const [analysisResult, rowDetailsResult] = await Promise.all([
        supabase
          .from("analysis")
          .select("comp_analysis")
          .eq("row_id", row_id)
          .single(),
        supabase
          .from("row_details")
          .select("mission_plan")
          .eq("row_id", row_id)
          .single(),
      ]);

      const { data: analysisData, error: errorAnalysis } = analysisResult;
      const { data: rowDetailsData, error: errorMission } = rowDetailsResult;

      if (errorAnalysis || errorMission) {
        const errorMessage = [errorAnalysis?.message, errorMission?.message]
          .filter(Boolean)
          .join("; ");
        throw new Error(`Supabase error: ${errorMessage}`);
      }

      if (!analysisData || !rowDetailsData) {
        throw new Error("Required data not found for the given row_id.");
      }

      const competitive_analysis_report = analysisData.comp_analysis;
      const mission_plan_context = rowDetailsData.mission_plan;

      try {
        const payload = {
          mission_plan_context,
          competitive_analysis_report,
        };

        console.log("payload", payload);
        const response = await fetch("/api/value_add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Successfully generated value add:", data);

        setValueAdd(data);

        const { error: upsertError } = await supabase.from("analysis").upsert(
          {
            row_id: row_id,
            value_add: data,
          },
          { onConflict: "row_id" }
        );

        if (upsertError) {
          throw new Error(`Failed to save analysis: ${upsertError.message}`);
        } else {
          console.log("Analysis saved successfully.");
        }
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
        } else if (msg.includes("422")) {
          msg = "Format not correct or check API";
        }
        toast.error(msg, { position: "top-right" });
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate value add", {
        position: "top-right",
      });
    } finally {
      setIsGeneratingValueAdd(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-[8px] flex justify-between items-center">
        <p className="font-bold text-[24px]">Value Add</p>
        <div className="flex gap-[8px]">
          {!valueAdd && (
            <button
              onClick={generateValueAdd}
              disabled={!compAnalysis || isGeneratingValueAdd}
            >
              {isGeneratingValueAdd ? (
                <Loader size={20} />
              ) : (
                "Generate Value Add"
              )}
            </button>
          )}

          {!valueAdd ||
            (!editValueAdd[`comp${index + 1}`] && (
              <button
                onClick={() => {
                  handleEditValueAdd(index + 1);
                }}
                disabled={!compAnalysis}
              >
                Edit
              </button>
            ))}
          {editValueAdd[`comp${index + 1}`] && (
            <>
              <button onClick={() => handleSaveValueAdd(index + 1)}>
                Save
              </button>
              <button onClick={() => handleCancelValueAdd(index + 1)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        disabled={!editValueAdd[`comp${index + 1}`]}
        className="focus:outline-[#1abc9c] focus:outline-2"
        rows="10"
        value={
          editValueAdd[`comp${index + 1}`]
            ? editedValueAdd ?? ""
            : valueAdd ?? ""
        }
        onChange={(e) => setEditedValueAdd(e.target.value)}
      />
    </div>
  );
}

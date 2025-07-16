"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { getData } from "../../utils/dbQueries";

export default function MissionPlan({
  competitorAnalysisData,
  valueAddResponseData,
  missionPlanResponseData,
  contentBriefResponseData,
  row_id,
}) {
  const supabase = createClientComponentClient();
  const [missionPlan, setMissionPlan] = useState(
    missionPlanResponseData ? missionPlanResponseData : contentBriefResponseData
  );
  const [isEditingMP, setIsEditingMP] = useState(false);
  const [isEditingMissionPlan, setIsEditingMissionPlan] = useState(false);

  const handleEditMissionPlan = () => {
    setIsEditingMP(true);
  };
  const handleCancelMission = () => {
    setIsEditingMP(false);
  };

  useEffect(() => {
    const fetchContentBrief = async () => {
      // Ensure supabase is defined and accessible here.
      // If it's a prop or state, include it in the dependency array.
      // For simplicity, assuming it's an imported client available in scope.

      const { data, error } = await supabase
        .from("row_details")
        .select(
          "intent, keyword, BUSINESS_GOAL, target_audience,article_outcome, pillar, cluster, questions, faq, lsi_keywords, ai_mode, persona, outline_format"
        ) // This select string looks correct.
        .eq("row_id", row_id);

      if (error) {
        console.error("❌ Supabase fetch error:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.log("ℹ️ No row data found for row_id:", row_id);
        return;
      }

      const row = data[0];

      // 🔍 Log the full fetched data
      console.log("📥 Supabase row data:", row);

      try {
        const contentBriefResponse = await fetch("/api/contentBrief", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // This opens the object for JSON.stringify
            primary_keyword: row.keyword || "",
            business_goal: row.business_goal || "",
            target_audience: row.target_audience || "",
            user_intent: row.intent || "",
            article_outcome: row.article_outcome || "",
            pillar: row.pillar || "",
            cluster: row.cluster || "",
            Must_Answer_Questions: row.questions || "",
            FAQs: row.faq || "",
            lsi_terms: row.lsi_keywords || "",
            ai_overview: row.ai_mode || "",
            author_persona: row.persona || "",
            outline: row.outline_format || "",
          }), // Correctly closes the object for JSON.stringify AND the JSON.stringify call itself.
        }); // This correctly closes the options object for the fetch call.

        if (!contentBriefResponse.ok) {
          const errorText = await contentBriefResponse.text();
          console.error("❌ API error response:", errorText);
          throw new Error("contentBriefResponse: Network response was not ok");
        }

        const contentBriefResponseData = await contentBriefResponse.json();

        console.log("✅ contentBriefResponseData:", contentBriefResponseData);

        setMissionPlan(contentBriefResponseData.contentBrief);

        const { error: upsertError } = await supabase
          .from("row_details")
          .upsert(
            {
              row_id: row_id,
              mission_plan: contentBriefResponseData.contentBrief, // Save the actual array here
            },
            { onConflict: "row_id" }
          );

        if (upsertError) {
          throw new Error(
            `Failed to save newly scraped data to database: ${upsertError.message}`
          );
        }
      } catch (err) {
        console.error("❌ Error in content brief API call:", err);
      }
    };

    if (row_id) {
      fetchContentBrief();
    }
  }, [row_id]);

  const handleSaveMission = async () => {
    try {
      setIsEditingMissionPlan(true);
      const file_Id = row_id;

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

      setMissionPlan(missionPlan);

      console.log("Mission plan saved successfully.");
    } catch (error) {
      toast.error(error.message || "Save Error", { position: "top-right" });
      setError(error.message);
    } finally {
      setIsEditingMissionPlan(false);
      setIsEditingMP(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex justify-between items-center">
        <p className="font-bold text-[24px]">Mission Plan:</p>
        <div className="flex gap-2">
          {!isEditingMP && (
            <button
              disabled={!missionPlan || isEditingMP}
              onClick={() => handleEditMissionPlan()}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Edit
            </button>
          )}

          {isEditingMP && (
            <>
              <button
                onClick={handleSaveMission}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                disabled={isEditingMissionPlan}
              >
                Save
              </button>
              <button
                onClick={handleCancelMission}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                disabled={isEditingMissionPlan}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        disabled={!isEditingMP}
        className="w-full border p-2 rounded focus:outline-[#1abc9c] focus:outline-2  ffocus:ring-blue-500 ddisabled:bg-gray-100"
        rows="10"
        value={missionPlan ?? ""}
        onChange={(e) => setMissionPlan(e.target.value)}
      />
    </div>
  );
}

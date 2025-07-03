"use client";

// Components and Hooks
import Loader from "@/components/common/Loader";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext"; // Adjust path as needed
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ContentBriefPage() {
  // State
  const [isLoading, setIsLoading] = useState(true); // Start with true since we fetch on mount
  const [isSaving, setIsSaving] = useState(false); // Tracks saving state for the button
  const [responseData, setResponseData] = useState(null); // Stores API/DB response
  const [error, setError] = useState(null); // Stores error messages
  const [editIntent, setEditIntent] = useState({}); // Tracks edit mode for intent
  const [missionPlanValue, setMissionPlanValue] = useState(""); // Stores mission plan value during edit
  const supabase = createClientComponentClient();

  // Context and Navigation
  const { projectData, updateProjectData } = useAppContext();
  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id; // From /contentBrief/[file_id]/index route
  const index = params.index;

  // Fetch content brief from database or API
  const fetchContentBrief = async () => {
    setIsLoading(true);
    setError(null);
    setResponseData(null);

    try {
      if (!fileId || typeof index === "undefined") {
        throw new Error("File ID or index not provided in URL");
      }

      const file__Id = `${fileId}_${index}`;
      console.log("Checking database for fileId:", file__Id);

      // Check database first
      const { data: dbData, error: dbError } = await supabase
        .from("row_details")
        .select("mission_plan")
        .eq("row_id", file__Id)
        .single();

      const { data: dataInput, error: dberror } = await supabase
        .from("row_details")
        .select(
          "keyword, BUSINESS_GOAL, target_audience,intent,article_outcome,pillar,cluster"
        )
        .eq("row_id", file__Id);

      if (error) {
        console.error("Error fetching row details:", error);
      } else {
        console.log("keyword:", dataInput);
      }

      if (dbError && dbError.code !== "PGRST116") {
        console.error("Supabase query error:", dbError);
        throw new Error(`Database query error: ${dbError.message}`);
      }

      // If mission_plan exists and is not empty, use it from the database
      if (dbData?.mission_plan) {
        console.log("Found mission plan in database:", dbData.mission_plan);
        const data = { generated_mission_plan: dbData.mission_plan };
        setResponseData(data);
        setMissionPlanValue(data.generated_mission_plan);
        return; // Exit early if data is found
      }

      // If no mission plan in database, call API

      console.log("keyword:", dataInput?.[0].keyword || "");
      console.log("BUSINESS_GOAL:", dataInput?.[0].BUSINESS_GOAL || "");
      console.log("target_audience:", dataInput?.[0].target_audience || "");
      console.log("intent:", dataInput?.[0].intent || "");
      console.log("article_outcome:", dataInput?.[0].article_outcome || "");

      console.log("pillar:", dataInput?.[0].pillar || "");
      console.log("cluster:", dataInput?.[0].cluster || "");

      const keyword = dataInput?.[0].keyword || "";
      const BUSINESS_GOAL = dataInput?.[0].BUSINESS_GOAL || "";
      const target_audience = dataInput?.[0].target_audience || "";
      const intent = dataInput?.[0].intent || "";
      const article_outcome = dataInput?.[0].article_outcome || "";
      const pillar = dataInput?.[0].pillar || "";
      const cluster = dataInput?.[0].cluster || "";

      console.log("No mission plan in database, calling API...");
      const response = await fetch("/api/contentBrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file__Id,
          pillar: pillar,
          cluster: cluster,
          business_goal: BUSINESS_GOAL,
          target_audience: target_audience,
          the_one_thing: article_outcome,
          user_intent: intent,
          primary_keyword: keyword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      const { data: updateData, error: updateError } = await supabase
        .from("row_details") // Your table name
        .update({ mission_plan: data }) // The column to update and the data to insert
        .eq("row_id", file__Id) // The 'WHERE' clause: find the row where row_id matches
        .select(); // Optional: .select() returns the updated row data

      // 3. Handle any errors from the Supabase operation
      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw new Error(`Failed to save to Supabase: ${updateError.message}`);
      }

      // 4. Log success
      console.log("Successfully saved to Supabase:", updateData);

      setResponseData(data);

      // Upsert API response to database
      if (data.generated_mission_plan) {
        const { error: upsertError } = await supabase
          .from("row_details")
          .upsert(
            {
              row_id: file__Id,
              mission_plan: data.generated_mission_plan,
            },
            { onConflict: "row_id" }
          );

        if (upsertError) {
          // Log this error but don't block the UI, as the data is still available from the API
          console.error("Supabase upsert error after API call:", upsertError);
        }
      }

      console.log("dssss", data.generated_mission_plan);

      setMissionPlanValue(data.generated_mission_plan || "");
    } catch (error) {
      console.error("Fetch Error:", {
        message: error.message,
        stack: error.stack,
        fileId,
        index,
      });
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContentBrief();
  }, [fileId, index]);

  // --- Handlers ---

  const handleEditIntent = (compIndex) => {
    setEditIntent({ [`comp${compIndex}`]: true });
    setMissionPlanValue(responseData?.generated_mission_plan || "");
  };

  const handleCancelIntent = (compIndex) => {
    setEditIntent({ [`comp${compIndex}`]: false });
    // Reset the textarea to the last saved value
    setMissionPlanValue(responseData?.generated_mission_plan || "");
  };

  const handleSaveIntent = async () => {
    setIsSaving(true);
    setError(null); // Clear previous errors before trying to save

    const file__Id = `${fileId}_${index}`;

    try {
      const { error: upsertError } = await supabase.from("row_details").upsert(
        {
          row_id: file__Id,
          mission_plan: missionPlanValue, // Use the state value from the textarea
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        // Throw an error to be caught by the catch block
        throw new Error(`Failed to save to database: ${upsertError.message}`);
      }

      // On successful save, update local state to reflect the change
      setResponseData((prev) => ({
        ...prev,
        generated_mission_plan: missionPlanValue,
      }));

      // Exit edit mode
      setEditIntent({ [`comp${index + 1}`]: false });
      console.log("Mission plan saved successfully.");
    } catch (error) {
      console.error("Save Error:", error);
      setError(error.message); // Set error state to display to the user
    } finally {
      setIsSaving(false);
    }
  };

  // NEW: Handler for the "Next" button
  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/analysis/${fileId}/${index}`);
    // Example: router.push(`/next-step-url/${fileId}/${index}`);
    // Replace with your actual navigation logic.
  };

  const isEditing = editIntent[`comp${index + 1}`];

  return (
    <div className="container px-4 py-6">
      <main className="main-content step-component">
        <h3 className="text-xl font-semibold mb-6 text-blue-600">
          Mission Plan Generator:
        </h3>

        {isLoading && <Loader />}

        {error && (
          <div className="text-red-600 mb-4 p-3 bg-red-100 border border-red-400 rounded">
            <strong>Error:</strong> {error}
            <button
              onClick={fetchContentBrief}
              className="ml-4 bg-blue-600 text-white px-2 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && responseData && (
          <>
            <div className="mb-2 flex justify-between items-center">
              <p className="font-bold">Mission Plan:</p>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={() => handleEditIntent(index + 1)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSaveIntent}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => handleCancelIntent(index + 1)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              disabled={!isEditing || isSaving}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              rows="10"
              value={missionPlanValue}
              onChange={(e) => setMissionPlanValue(e.target.value)}
            />

            {/* --- NEW: "Next" button section --- */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isEditing} // Optional: disable "Next" while editing
              >
                Next
              </button>
            </div>
            {/* --- End of "Next" button section --- */}
          </>
        )}
        <div className="overflow-x-auto mt-4">
          <div className="flex flex-col gap-[30px]"></div>
        </div>
      </main>
    </div>
  );
}

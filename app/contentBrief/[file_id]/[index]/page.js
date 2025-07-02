"use client";

// Components and Hooks
import Loader from "@/components/common/Loader";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext"; // Adjust path as needed

export default function ContentBriefPage() {
  // State
  const [isLoading, setIsLoading] = useState(false); // Tracks API loading state
  const [responseData, setResponseData] = useState(null); // Stores API response
  const [error, setError] = useState(null); // Stores error messages
  const [editIntent, setEditIntent] = useState({}); // Tracks edit mode for intent
  const [missionPlanValue, setMissionPlanValue] = useState(""); // Stores mission plan value during edit

  // Context and Navigation
  const { projectData, updateProjectData } = useAppContext();
  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id; // From /contentBrief/[file_id]/index route
  const index = params.index;

  // Fetch content brief from API
  const fetchContentBrief = async () => {
    setIsLoading(true);
    setError(null);
    setResponseData(null);

    try {
      // Validate fileId
      if (!fileId) {
        throw new Error("No file ID provided in URL");
      }

      // Construct file__Id with dynamic index
      const file__Id = `${fileId}_${index}`;
      console.log("Sending fileId:", file__Id);

      // Make API call
      const response = await fetch("/api/contentBrief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: file__Id }),
      });

      // Check response status
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      // Parse and store response
      const data = await response.json();
      console.log("API Response:", data);
      setResponseData(data);
      // Initialize mission plan value from response
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
  }, [fileId, index]); // Add fileId and index to dependencies

  // Handlers for Mission Plan Editing
  const handleEditIntent = (compIndex) => {
    setEditIntent((prev) => ({ ...prev, [`comp${compIndex}`]: true }));
    setMissionPlanValue(responseData?.generated_mission_plan || "");
  };

  const handleSaveIntent = () => {
    setEditIntent((prev) => ({ ...prev, [`comp${index + 1}`]: false }));
    // Update responseData with new mission plan
    setResponseData((prev) => ({
      ...prev,
      generated_mission_plan: missionPlanValue,
    }));
    // Optionally update projectData in context
    // updateProjectData({ generated_mission_plan: missionPlanValue });
  };

  const handleCancelIntent = (compIndex) => {
    setEditIntent((prev) => ({ ...prev, [`comp${compIndex}`]: false }));
    setMissionPlanValue(responseData?.generated_mission_plan || "");
  };

  return (
    <div className="container px-4 py-6">
      <main className="main-content step-component">
        <h3 className="text-xl font-semibold mb-6 text-blue-600">
          Mission Plan Generator:
        </h3>

        {/* Loading State */}
        {isLoading && <Loader />}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 mb-4">
            Error: {error}
            <button
              onClick={fetchContentBrief} // Use the defined function
              className="ml-4 bg-blue-600 text-white px-2 py-1 rounded"
            >
              Retry
            </button>
          </div>
        )}

        {/* Mission Plan Section */}
        {!isLoading && !error && responseData && (
          <>
            <div className="mb-[8px] flex justify-between items-center">
              <p className="font-bold">Mission Plan:</p>
              <div className="flex gap-[8px]">
                {!editIntent[`comp${index + 1}`] && (
                  <button
                    onClick={() => handleEditIntent(index + 1)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                )}
                {editIntent[`comp${index + 1}`] && (
                  <button
                    onClick={handleSaveIntent}
                    className="bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                )}
                {editIntent[`comp${index + 1}`] && (
                  <button
                    onClick={() => handleCancelIntent(index + 1)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            <textarea
              disabled={!editIntent[`comp${index + 1}`]}
              className="w-full border p-2 focus:outline-[#1abc9c] focus:outline-2 rounded"
              rows="10"
              value={missionPlanValue} // Use missionPlanValue
              onChange={(e) => setMissionPlanValue(e.target.value)}
            />
          </>
        )}

        {/* API Response (Raw) - Optional */}
        {/* {responseData && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="text-lg font-medium mb-2">Raw API Response:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>
        )} */}

        {/* Placeholder for Additional Content */}
        <div className="overflow-x-auto mt-4">
          <div className="flex flex-col gap-[30px]"></div>
        </div>
      </main>
    </div>
  );
}

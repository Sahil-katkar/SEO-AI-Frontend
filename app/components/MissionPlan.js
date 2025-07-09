import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React, { useEffect, useState } from "react";

export default function MissionPlan({ row_id }) {
  const supabase = createClientComponentClient();
  const { projectData, updateProjectData } = useAppContext();

  const [missionPlan, setMissionPlan] = useState("");
  const [isEditingMP, setIsEditingMP] = useState(false);
  const [isEditingMissionPlan, setIsEditingMissionPlan] = useState(false);

  useEffect(() => {
    const fetchMissionPlan = async (row_id) => {
      if (!row_id) return;

      const { data, error } = await supabase
        .from("row_details")
        .select("mission_plan")
        .eq("row_id", row_id)
        .single();

      if (error) {
        console.log("error fetchMissionPlan", error);
      } else if (data) {
        console.log("data fetchMissionPlan", data);
        setMissionPlan(data?.mission_plan);
        updateProjectData({
          isMissionPlanFetched: true,
        });
      }
    };
    fetchMissionPlan(row_id);
  }, [row_id]);

  const handleEditMissionPlan = () => {
    setIsEditingMP(true);
  };
  const handleCancelMission = () => {
    setIsEditingMP(false);
  };

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
    <div>
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

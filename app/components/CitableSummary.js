import React, { useState } from "react";
import Loader from "./common/Loader";

export default function CitableSummary({ citableSummaryResponseData }) {
  const [editCitable, setEditCitable] = useState(false);
  const [citabledata, setCitableData] = useState(citableSummaryResponseData);
  const [saveEditedCitable, setSaveEditedCitable] = useState(false);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
  useState(1);
  

  const handleSaveEditedCitable = async () => {
    setSaveEditedCitable(true);
    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("outline")
        .upsert(
          {
            row_id: row_id,
            citable_answer: editedCitable,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      console.log("Citable saved to database successfully:", upsertedData);
      toast.success("Citable saved successfully", {
        position: "bottom-right",
      });
    } catch (err) {
      console.error(
        "An error occurred during the save/regeneration process:",
        err
      );
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedCitable(false);
    }
  };

  const handleCancelEditedCitable = () => {
    setEditedCitable(citabledata); // Reset from the original state
    setEditCitable(false); // Exit edit mode
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-semibold text-black-700 mb-2">
            Citable Summary
          </h4>

          <div className="ml-auto flex items-center gap-2">
            {!editCitable && (
              <button
                onClick={() => {
                  setEditCitable(true);
                  setEditedCitable(citabledata);
                }}
              >
                Edit
              </button>
            )}
            {editCitable && (
              <>
                {saveEditedCitable && <Loader className="loader-sm" />}
                <button
                  disabled={saveEditedCitable}
                  onClick={handleSaveEditedCitable}
                >
                  Save
                </button>
                <button
                  disabled={saveEditedCitable}
                  onClick={handleCancelEditedCitable}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {editCitable ? (
          <>
            <textarea
              rows="10"
              className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
              disabled={saveEditedCitable}
              value={editedCitable}
              onChange={(e) => setEditedCitable(e.target.value)}
            />
          </>
        ) : (
          <>
            <textarea
              rows="10"
              readOnly
              disabled
              className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
              value={citabledata}
            />
          </>
        )}
      </div>

      <button
        onClick={() => handleTabChange("Article")}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
      >
        Next
      </button>
    </div>
  );
}

import React, { useState } from "react";
import Loader from "@/components/common/Loader";

export default function Outline() {
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineData, setOutlineData] = useState("");
  const [editOutline, setEditOutline] = useState(false);
  const [editedOutline, setEditedOutline] = useState("");
  const [saveEditedOutline, setSaveEditedOutline] = useState(false);

  const handleSaveEditedOutline = async () => {
    setSaveEditedOutline(true);

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("outline")
        .upsert(
          {
            row_id: row_id,
            new_outline: editedOutline,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      setOutlineData(editedOutline);
      setEditOutline(false);
      toast.success("Outline saved successfully!", {
        position: "bottom-right",
      });
    } catch (err) {
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedOutline(false);
    }
  };

  const handleCancelEditedOutline = () => {
    setEditedOutline(outlineData);
    setEditOutline(false);
  };

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        {outlineLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[250px]">
            <Loader />
            <p className="mt-4 text-gray-600 font-semibold">
              Generating Outline...
            </p>
            <p className="text-sm text-gray-500">This may take a moment.</p>
          </div>
        ) : outlineData.length > 0 ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-black-700 mb-2">
                  Outline
                </h4>

                <div className="ml-auto flex items-center gap-2">
                  {!editOutline && (
                    <button
                      onClick={() => {
                        setEditOutline(true);
                        setEditedOutline(outlineData);
                      }}
                      className="text-blue-500 hover:text-blue-700 font-semibold"
                    >
                      Edit
                    </button>
                  )}
                  {editOutline && (
                    <>
                      {saveEditedOutline && <Loader className="loader-sm" />}
                      <button
                        disabled={saveEditedOutline}
                        onClick={handleSaveEditedOutline}
                        className="text-green-500 hover:text-green-700 font-semibold disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        disabled={saveEditedOutline}
                        onClick={handleCancelEditedOutline}
                        className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editOutline ? (
                <textarea
                  rows="10"
                  className="w-full p-3 border border-blue-300 rounded-md shadow-inner ffocus:ring-2 ffocus:ring-blue-500 focus:outline-[#1abc9c] focus:outline-2"
                  disabled={saveEditedOutline}
                  value={editedOutline}
                  onChange={(e) => setEditedOutline(e.target.value)}
                />
              ) : (
                <textarea
                  rows="10"
                  readOnly
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                  value={outlineData}
                />
              )}
            </div>

            <button
              onClick={() => handleTabChange("Citable Summary")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
            >
              Next
            </button>
          </>
        ) : (
          <p className="text-black-500 text-center py-10">
            No outline data available. It might be generating for the first
            time.
          </p>
        )}
      </div>
    </>
  );
}

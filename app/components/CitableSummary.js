import React, { useEffect, useState } from "react";
import Loader from "./common/Loader";
import { toast } from "react-toastify";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CitableSummary({
  row_id,
  citableSummaryResponseData,
  activeModalTab,
}) {
  const supabase = createClientComponentClient();
  const [citableLoading, setCitableLoading] = useState(false);
  const [citabledata, setCitableData] = useState(
    citableSummaryResponseData || ""
  );
  const [editCitable, setEditCitable] = useState(false);
  const [editedCitable, setEditedCitable] = useState("");
  const [saveEditedCitable, setSaveEditedCitable] = useState(false);

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

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  useEffect(() => {
    const fetchOrGenerateCitableSummary = async (row_id) => {
      setCitableLoading(true);
      try {
        const { data: citableDataFromDB, error: citableError } = await supabase
          .from("outline")
          .select("citable_answer")
          .eq("row_id", row_id)
          .single();

        if (citableError && citableError.code !== "PGRST116") {
          throw citableError;
        }

        if (
          citableDataFromDB &&
          citableDataFromDB.citable_answer &&
          citableDataFromDB.citable_answer.trim() !== ""
        ) {
          setCitableData(citableDataFromDB.citable_answer);
        } else {
          const { data: rowDetails, error } = await supabase
            .from("row_details")
            .select("mission_plan, outline_format")
            .eq("row_id", row_id)
            .single();

          if (error) {
            throw new Error(
              error.message || "Failed to fetch project details."
            );
          }

          if (!rowDetails) {
            throw new Error("No details found for this project.");
          }

          const payload = {
            mission_plan: rowDetails?.mission_plan,
            initial_draft_index: rowDetails?.outline_format,
          };

          const res = await fetch("/api/citable-summary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            let errorMsg = `Server responded with ${res.status}`;
            try {
              const errorData = await res.json();
              errorMsg = errorData.error || errorMsg;
            } catch (jsonErr) {}
            throw new Error(errorMsg);
          }

          const data = await res.json();
          console.log("Citable summary generated successfully:", data);

          const { error: upsertError } = await supabase.from("outline").upsert(
            {
              row_id: row_id,
              citable_answer: data?.generate_citable_summary_data,
            },
            { onConflict: "row_id" }
          );

          if (upsertError) {
            throw new Error(
              `Failed to save citable summary: ${upsertError.message}`
            );
          } else {
            console.log("Citable summary saved successfully.");
          }
          setCitableData(data?.generate_citable_summary_data);
        }
      } catch (err) {
        toast.error(
          err.message === "Failed to fetch"
            ? "API is not available. Please try again later."
            : err.message || "An unexpected error occurred."
        );
      } finally {
        setCitableLoading(false);
      }
    };

    if (
      activeModalTab === "Citable Summary" &&
      citableSummaryResponseData === null
    ) {
      fetchOrGenerateCitableSummary(row_id);
    }
  }, [activeModalTab, row_id]);

  return (
    <>
      {citableLoading ? (
        <Loader />
      ) : (
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
      )}
    </>
  );
}

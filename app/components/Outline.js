import React, { Suspense, useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { toast } from "react-toastify";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Outline({
  row_id,
  newOutlineResponseData,
  activeModalTab,
}) {
  const supabase = createClientComponentClient();
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineData, setOutlineData] = useState(newOutlineResponseData || "");
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

  useEffect(() => {
    const fetchOrGenerateOutline = async (row_id) => {
      setOutlineLoading(true);
      try {
        const { data: outlineDataFromDB, error: outlineError } = await supabase
          .from("outline")
          .select("new_outline")
          .eq("row_id", row_id)
          .single();

        if (outlineError && outlineError.code !== "PGRST116") {
          throw outlineError;
        }

        if (
          outlineDataFromDB &&
          outlineDataFromDB.new_outline &&
          outlineDataFromDB.new_outline.trim() !== ""
        ) {
          setOutlineData(outlineDataFromDB.new_outline);
        } else {
          const { data: rowDetails, error: rowDetailsError } = await supabase
            .from("row_details")
            .select("keyword, intent, persona, questions, faq, outline_format")
            .eq("row_id", row_id)
            .single();

          const { data: analysis, error: analysisError } = await supabase
            .from("analysis")
            .select("lsi_keywords")
            .eq("row_id", row_id)
            .single();

          if (rowDetailsError) throw rowDetailsError;
          if (analysisError) throw analysisError;
          if (!rowDetails) throw new Error("Details not found for this entry.");

          let allExtractedKeywords = [];
          if (analysis?.lsi_keywords) {
            try {
              const parsedData = JSON.parse(analysis.lsi_keywords);
              allExtractedKeywords = parsedData
                .map(
                  (item) =>
                    item?.lsi_keywords?.lsi_keyword || item?.lsi_keywords
                )
                .filter(Boolean);
            } catch (error) {
              console.error("Failed to parse lsi_keywords JSON:", error);
            }
          }

          const payload = {
            primary_keyword: rowDetails.keyword,
            lsi_keywords: allExtractedKeywords,
            intent: rowDetails.intent,
            persona: rowDetails.persona,
            questions: rowDetails.questions,
            faq: rowDetails.faq,
            standard_outline_format: rowDetails.outline_format,
          };

          const res = await fetch("/api/generate-outline", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              errorData.error || `Server responded with ${res.status}`
            );
          }

          const data = await res.json();
          console.log("Outline generated successfully:", data);

          const { error: upsertError } = await supabase.from("outline").upsert(
            {
              row_id: row_id,
              new_outline: data?.article_outline_data,
              h2_count: data?.h2_count,
            },
            { onConflict: "row_id" }
          );

          if (upsertError) {
            throw new Error(`Failed to save analysis: ${upsertError.message}`);
          } else {
            console.log("outline saved successfully.");
          }
          setOutlineData(data?.article_outline_data);
        }
      } catch (err) {
        toast.error(err.message || "An unexpected error occurred.");
      } finally {
        setOutlineLoading(false);
      }
    };
    if (activeModalTab === "Outline" && newOutlineResponseData === null) {
      fetchOrGenerateOutline(row_id);
    }
  }, [row_id]);

  return (
    <>
      {outlineLoading ? (
        <Loader />
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
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
        </div>
      )}
    </>
  );
}

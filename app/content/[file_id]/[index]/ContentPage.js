"use client";

import Article from "@/components/Article";
import CitableSummary from "@/components/CitableSummary";
import Loader from "@/components/common/Loader";
import Outline from "@/components/Outline";
import StatusHeading from "@/components/StatusHeading";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function ContentPage({
  missionPlanResponseData,
  lsiKeywordsApproveResponseData,
  row_id,
  file_id,
  index,
  newOutlineResponseData,
  articleOutcomeResponseData,
  intentResponseData,
  citableSummaryResponseData,
  updatedArticleResponseData,
}) {
  const { projectData, updateProjectData } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [citabledata, setCitableData] = useState(citableSummaryResponseData);
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [citableLoading, setCitableLoading] = useState(false);
  const [saveEditedOutline, setSaveEditedOutline] = useState(false);
  const [outlineData, setOutlineData] = useState(newOutlineResponseData);
  const [articleSectionCount, setArticleSectionCount] = useState(0);

  const [test1, setTest1] = useState(newOutlineResponseData);

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  useEffect(() => {
    if (projectData.activeModalTab === "Outline") {
      const fetchOrGenerateOutline = async () => {
        setOutlineLoading(true);

        try {
          const { data: outlineDataFromDB, error: outlineError } =
            await supabase
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
              .select(
                "keyword, intent, persona, questions, faq, outline_format"
              )
              .eq("row_id", row_id)
              .single();

            const { data: analysis, error: analysisError } = await supabase
              .from("analysis")
              .select("lsi_keywords")
              .eq("row_id", row_id)
              .single();

            if (rowDetailsError) throw rowDetailsError;
            if (analysisError) throw analysisError;
            if (!rowDetails)
              throw new Error("Details not found for this entry.");

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

            const { error: upsertError } = await supabase
              .from("outline")
              .upsert(
                {
                  row_id: row_id,
                  new_outline: data,
                },
                { onConflict: "row_id" }
              );

            if (upsertError) {
              throw new Error(
                `Failed to save analysis: ${upsertError.message}`
              );
            } else {
              console.log("outline saved successfully.");
            }
            setOutlineData(data);
          }
        } catch (err) {
          toast.error(err.message || "An unexpected error occurred.");
        } finally {
          setOutlineLoading(false);
        }
      };

      fetchOrGenerateOutline();
    }
  }, [projectData.activeModalTab, row_id]);

  useEffect(() => {
    if (projectData.activeModalTab === "Citable Summary") {
      const fetchOrGenerateCitableSummary = async () => {
        setCitableLoading(true);
        try {
          const { data: citableDataFromDB, error: citableError } =
            await supabase
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
              mission_plan: rowDetails.mission_plan,
              initial_draft_index: rowDetails.outline_format,
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

            const { error: upsertError } = await supabase
              .from("outline")
              .upsert(
                {
                  row_id: row_id,
                  citable_answer: data,
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
            setCitableData(data);
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

      fetchOrGenerateCitableSummary();
    }
  }, [projectData.activeModalTab, row_id]);

  return (
    <div className="container">
      <main className="main-content step-component">
        <StatusHeading status={lsiKeywordsApproveResponseData} />

        <div className="flex items-center gap-4 mb-4">
          <span
            className="p-2 text-blue-500 hover:text-blue-600 text-xl rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            onClick={() => router.back()}
            tabIndex={0}
            role="button"
            aria-label="Go back"
          >
            ←
          </span>
          <h3 className="text-xl font-semibold text-blue-500">
            Processing Row for {index}
          </h3>
        </div>

        {apiError && <div className="text-red-500">Error: {apiError}</div>}
        {isLoading && <Loader />}

        {!isLoading && (
          <div className="flex flex-col gap-[8px]">
            <div className="modal-tabs">
              {["Outline", "Citable Summary", "Article"].map((tabName) => (
                <button
                  key={tabName}
                  className={`modal-tab-button ${
                    projectData.activeModalTab === tabName ? "active" : ""
                  }`}
                  onClick={() => handleTabChange(tabName)}
                >
                  {tabName}
                </button>
              ))}
            </div>

            <div className="modal-tab-content">
              <div
                className={`${
                  projectData.activeModalTab === "Outline" ? "block" : "hidden"
                }`}
              >
                <Outline row_id={row_id} newOutlineResponseData={test1} />
              </div>
              {/* {projectData.activeModalTab === "Outline" && (
              )} */}

              <div
                className={`${
                  projectData.activeModalTab === "Citable Summary"
                    ? "block"
                    : "hidden"
                }`}
              >
                <CitableSummary
                  citableSummaryResponseData={citableSummaryResponseData}
                />
              </div>

              {/* {projectData.activeModalTab === "Citable Summary" && (
              )} */}

              <div
                className={`${
                  projectData.activeModalTab === "Article" ? "block" : "hidden"
                }`}
              >
                <Article
                  newOutlineResponseData={newOutlineResponseData}
                  updatedArticleResponseData={updatedArticleResponseData}
                />
              </div>

              {/* {projectData.activeModalTab === "Article" && (
              )} */}
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

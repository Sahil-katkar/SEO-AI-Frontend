"use client";

import React from "react";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import StatusHeading from "@/components/StatusHeading";
import Outline from "@/components/Outline";
import CitableSummary from "@/components/CitableSummary";
import Article from "@/components/Article";

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

  const params = useParams();
  // const fileId = params.fileId;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  // const row = params.row;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [citableLoading, setCitableLoading] = useState(false);
  const [saveEditedOutline, setSaveEditedOutline] = useState(false);
  const [outlineData, setOutlineData] = useState(newOutlineResponseData);
  const [articleSectionCount, setArticleSectionCount] = useState(0);

  // const handleSaveEditedOutline = async () => {
  //   setSaveEditedOutline(true);

  //   const payload = {
  //     user_id: row_id,
  //     Mainkeyword: keyword,
  //     edit_content: {
  //       outline: editedOutline,
  //     },
  //   };

  //   console.log("Saving new outline payload:", payload);

  //   try {
  //     const res = await fetch("/api/contentEdit", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (res.ok) {
  //       toast.success("Updated Article generated successfully!", {
  //         position: "bottom-right",
  //       });
  //       // Update the main display state with the new content
  //       setParsedOutline(editedOutline);
  //       setEditOutline(false); // Exit edit mode
  //       setSaveStatus(true); // This will trigger fetchDataUpdated to get the new article
  //     } else {
  //       const errorRes = await res.json();
  //       toast.error(
  //         errorRes.message || "Failed to regenerate content from outline.",
  //         {
  //           position: "top-right",
  //         }
  //       );
  //     }
  //   } catch (err) {
  //     toast.error("An error occurred while saving the outline.", {
  //       position: "top-right",
  //     });
  //   } finally {
  //     setSaveEditedOutline(false); // Hide loader
  //   }
  // };

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.back();
    }
  };

  // const handleCancelEditedIntent = () => {
  //   setEditedIntent(parsedContentState);
  //   setEditedExplanation(parsedContentState.explanation || "");
  //   setEditIntent(false);
  // };

  // const handleSaveEditedIntent = async () => {
  //   const updatedContent = {
  //     intent: editedIntent,
  //   };

  //   // Upsert API response to database
  //   if (editedIntent) {
  //     const { data: intent_Data } = await supabase.from("row_details").upsert(
  //       {
  //         row_id: row_id,
  //         intent: intent_Data,
  //       },
  //       { onConflict: "row_id" }
  //     );

  //     if (upsertError) {
  //       console.error("Supabase upsert error after API call:", upsertError);
  //     }
  //   }

  //   // const stringifiedIntent = JSON.stringify(updatedContent, null, 4);

  //   // const payload = {
  //   //   user_id: `${fileId}_${row}`,
  //   //   Mainkeyword: keyword,
  //   //   edit_content: {
  //   //     intent: stringifiedIntent,
  //   //   },
  //   // };

  //   // console.log("payloadd", payload);

  //   // setSaveEditedIntent(true);
  //   // try {
  //   //   const res = await fetch("/api/contentEdit", {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "application/json",
  //   //     },
  //   //     body: JSON.stringify(payload),
  //   //   });

  //   //   if (res.ok) {
  //   //     toast.success("Updated Outline and Article generated successfully!", {
  //   //       position: "bottom-right",
  //   //     });
  //   //     setParsedContentState(updatedContent);
  //   //     setEditIntent(false);
  //   //     setSaveStatus(true);
  //   //     await fetchDataUpdated();
  //   //   } else {
  //   //     const errorRes = await res.json();
  //   //     toast.error(errorRes.message || "Something went wrong", {
  //   //       position: "top-right",
  //   //     });
  //   //   }
  //   // } catch (err) {
  //   //   toast.error("An error occurred while saving intent", {
  //   //     position: "top-right",
  //   //   });
  //   // } finally {
  //   //   setSaveEditedIntent(false);
  //   // }
  // };

  // const handleSaveEditedIntent = async () => {
  //   setSaveEditedIntent(true);

  //   try {
  //     const { data: upsertedData, error: upsertError } = await supabase
  //       .from("row_details")
  //       .upsert(
  //         {
  //           row_id: row_id,
  //           intent: editedIntent,
  //         },
  //         { onConflict: "row_id" }
  //       )
  //       .select();

  //     if (upsertError) {
  //       throw upsertError;
  //     }

  //     console.log("Intent saved to database successfully:", upsertedData);
  //     toast.success("Intent saved successfully", {
  //       position: "bottom-right",
  //     });

  //     const payload = {
  //       user_id: row_id,
  //       Mainkeyword: keyword,
  //       edit_content: {
  //         intent: editedIntent,
  //       },
  //     };

  //     const res = await fetch("/api/contentEdit", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //   } catch (err) {
  //     console.error(
  //       "An error occurred during the save/regeneration process:",
  //       err
  //     );
  //     toast.error(err.message || "Something went wrong.", {
  //       position: "top-right",
  //     });
  //   } finally {
  //     setSaveEditedIntent(false);
  //   }
  // };

  // const getOutline = async () => {
  //   const { data: outline } = await supabase
  //     .from("outline")
  //     .select("new_outline")
  //     .eq("row_id", row_id);

  //   return outline;
  // };

  // const outline = getOutline();

  // useEffect(() => {
  //   const calculateSectionCount = async (outline) => {
  //     const lines = outline.split("\n");
  //     // Match lines that start with 4 spaces and an asterisk, but not more
  //     const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
  //     console.log("count", count);
  //     setArticleSectionCount(count);
  //     // return count;
  //   };
  //   calculateSectionCount(outline);
  // }, [outline]);

  // function getSectionHeadings(toc, n) {
  //   const lines = toc.split("\n");
  //   // console.log("toc", toc);
  //   let currentH2 = 0;
  //   let collecting = false;
  //   let result = [];

  //   for (let line of lines) {
  //     const trimmed = line.trimStart();
  //     if (trimmed.startsWith("* [")) {
  //       currentH2++;
  //       if (currentH2 === n) {
  //         collecting = true;
  //         console.log("line 1", line);

  //         result.push(line);
  //       } else if (collecting) {
  //         // Next h2 found, stop collecting
  //         break;
  //       }
  //     } else if (collecting && trimmed.startsWith("*")) {
  //       // Only collect h3/h4 (indented, but still start with '*')
  //       console.log("line 2", line);

  //       result.push(line);
  //     } else if (collecting && trimmed.startsWith("")) {
  //       // If it's an empty line, skip
  //       continue;
  //     }
  //   }
  //   return result.join("\n");
  // }

  // const section = getSectionHeadings(testoutline, 4);
  // console.log("section", section);

  // const articleArr = [];

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
            onKeyDown={handleKeyDown}
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
              {projectData.activeModalTab === "Outline" && (
                <Outline
                  row_id={row_id}
                  newOutlineResponseData={newOutlineResponseData}
                />
              )}

              {projectData.activeModalTab === "Citable Summary" && (
                <CitableSummary
                  citableSummaryResponseData={citableSummaryResponseData}
                />
              )}

              {projectData.activeModalTab === "Article" && (
                <Article
                  newOutlineResponseData={newOutlineResponseData}
                  updatedArticleResponseData={updatedArticleResponseData}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

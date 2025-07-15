"use client";

import React from "react";
import Loader from "@/components/common/Loader";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import StatusHeading from "@/components/StatusHeading";

export default function ContentPage({
  missionPlanResponseData,
  lsiKeywordsApproveResponseData,
  row_id,
  file_id,
  index,
  newOutlineResponseData,
}) {
  const { projectData, updateProjectData } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [articledata, setArticleData] = useState([]);
  const [articledataUpdated, setArticleDataUpdated] = useState([]);
  const [intentdata, setIntentData] = useState([]);
  const [citabledata, setCitableData] = useState([]);
  const [outlineDataUpdated, setOutlineDataUpdated] = useState([]);
  const [editIntent, setEditIntent] = useState(false);
  const [editCitable, setEditCitable] = useState(false);
  const [parsedContentState, setParsedContentState] = useState([]);
  const [editedIntent, setEditedIntent] = useState("");
  const [editedCitable, setEditedCitable] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);
  const [saveEditedCitable, setSaveEditedCitable] = useState(false);
  const [parsedMissionPlan, setParsedMissionPlan] = useState("");
  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  // const fileId = params.fileId;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  // const row = params.row;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [citableLoading, setCitableLoading] = useState(false);
  // const row_id = `${fileId}_${row}`;

  // const [editOutline, setEditOutline] = useState(false);
  const [parsedOutline, setParsedOutline] = useState("");
  // const [editedOutline, setEditedOutline] = useState("");
  // const [saveEditedOutline, setSaveEditedOutline] = useState(false);
  const [outlineData, setOutlineData] = useState();

  const [articleSectionCount, setArticleSectionCount] = useState(0);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
    useState(1);
  const [articleSections, setArticleSections] = useState();
  const [sectionIsGenerating, setSectionIsGenerating] = useState(false);

  const handleSaveGdrive = async (articleSections, row_id) => {
    try {
      const backendPayload = {
        test_content_string: articleSections,
        row_folder_name: row_id,
      };
      const apiResponse = await fetch(`/api/save-to-gdrive/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      });

      const data = await apiResponse.json();
      console.log("FastAPI response:", data);

      if (apiResponse.ok) {
        toast.success("File Saved Succesfully!");
      } else {
        const errorMessage =
          data.error || data.detail || "Failed to save file.";
        toast.error(`Error: ${errorMessage}`);
        console.error("API Error Response:", data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: article } = await supabase
          .from("article")
          .select("content")
          .eq("row_id", row_id);

        const { data: logData, error } = await supabase
          .from("event_log")
          .select("content")
          .eq("row_id", row_id);

        const { data: intent } = await supabase
          .from("row_details")
          .select("intent")
          .eq("row_id", row_id);

        const { data: outline } = await supabase
          .from("outline")
          .select("new_outline")
          .eq("row_id", row_id);

        const { data: citable } = await supabase
          .from("outline")
          .select("citable_answer")
          .eq("row_id", row_id);

        // const { data: missionPlan } = await supabase
        //   .from("row_details")
        //   .select("mission_plan")
        //   .eq("row_id", row_id);

        setArticleData(article || []);
        setIntentData(intent);

        console.log("citable", citable);

        // setCitableData(citable);
        console.log("Raw outline data from DB:", outline);

        const parsedValue = outline?.[0]?.new_outline || "";
        const parsedCitable = citable?.[0]?.citable_answer || "";

        setOutlineData(parsedValue);
        setCitableData(parsedCitable);
        console.log("Parsed outline string:", outlineData);

        const parsed = intent?.[0]?.intent || "";

        console.log("parsed:", parsed);

        setParsedContentState(parsed);
        console.log("parsedContentState", parsedContentState);

        setEditedIntent(parsed);
        console.log("edited intent", editIntent);

        setEditedExplanation(parsed.explanation || "");
        setParsedMissionPlan(missionPlanResponseData);
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [row_id]);

  // const handleCancelEditedOutline = () => {
  //   setEditedOutline(outlineData); // Reset from the original state
  //   setEditOutline(false); // Exit edit mode
  // };

  const handleCancelEditedCitable = () => {
    setEditedCitable(citabledata); // Reset from the original state
    setEditCitable(false); // Exit edit mode
  };

  // const handleSaveEditedOutline = async () => {
  //   setSaveEditedOutline(true); // Show loader, disable buttons

  //   // The payload is similar, but the key is 'outline'
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

  useEffect(() => {
    if (!saveStatus) return;
    fetchDataUpdated();
  }, [saveStatus, file_id, index]);

  // Function to fetch updated data
  const fetchDataUpdated = async () => {
    const row_id = `${file_id}_${index}`;
    try {
      const { data: articleUpdated } = await supabase
        .from("article")
        .select("updated_content")
        .eq("row_id", row_id);

      const { data: intentUpdated } = await supabase
        .from("intent")
        .select("updated_content")
        .eq("row_id", row_id);

      const { data: outlineUpdated } = await supabase
        .from("outline")
        .select("updated_content")
        .eq("row_id", row_id);

      setArticleDataUpdated(articleUpdated || []);
      setOutlineDataUpdated(outlineUpdated || []);
      setSaveStatus(false);
    } catch (error) {
      setApiError(error.message || "Something went wrong");
    }
  };

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

  // const handleSaveEditedOutline = async () => {
  //   setSaveEditedOutline(true);

  //   try {
  //     const { data: upsertedData, error: upsertError } = await supabase
  //       .from("outline")
  //       .upsert(
  //         {
  //           row_id: row_id,
  //           new_outline: editedOutline,
  //         },
  //         { onConflict: "row_id" }
  //       )
  //       .select();

  //     if (upsertError) {
  //       throw upsertError;
  //     }

  //     setOutlineData(editedOutline);
  //     setEditOutline(false);
  //     toast.success("Outline saved successfully!", {
  //       position: "bottom-right",
  //     });
  //   } catch (err) {
  //     toast.error(err.message || "Something went wrong.", {
  //       position: "top-right",
  //     });
  //   } finally {
  //     setSaveEditedOutline(false);
  //   }
  // };

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

  const generateArticleSection = async (section) => {
    setSectionIsGenerating(true);
    console.log("section", section);
    const { data: row_details } = await supabase
      .from("row_details")
      .select("mission_plan,lsi_keywords,persona")
      .eq("row_id", row_id);

    console.log("row id", row_id);

    const { data: valueAdd } = await supabase
      .from("analysis")
      .select("value_add")
      .eq("row_id", row_id);

    const { data: outline } = await supabase
      .from("outline")
      .select("new_outline")
      .eq("row_id", row_id);

    const payload = {
      missionPlan: row_details[0].mission_plan,
      gapsAndOpportunities: valueAdd?.[0]?.value_add || "", // extract string
      lsi_keywords: Array.isArray(row_details[0].lsi_keywords)
        ? row_details[0].lsi_keywords
        : [], // ensure array
      persona: row_details[0].persona,
      outline: outline?.[0]?.new_outline || "", // extract string
      section: String(section), // ensure string
    };

    // const calculateSectionCount = async (outline) => {
    //   const lines = outline.split("\n");
    //   // Match lines that start with 4 spaces and an asterisk, but not more
    //   // const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
    //   const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
    //   console.log("count", count);
    //   setArticleSectionCount(count);
    //   // return count;
    // };
    // calculateSectionCount(payload?.outline);

    console.log("payload", payload);

    const response = await fetch(`/api/generate-article`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("dataaaaaaaaaaa", data);

    setArticleSections((prev) =>
      Array.isArray(prev) ? [...prev, data] : [data]
    );
    setArticleSectionGenerateCount(articleSectionGenerateCount + 1);
    setSectionIsGenerating(false);
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

  const handleSaveArticle = async (savedArticle) => {
    setSectionIsGenerating(true);
    const { data: article, error } = await supabase.from("article").upsert(
      {
        row_id: row_id,
        updated_article: savedArticle,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.log("added succesfully", error);
    }
    setSectionIsGenerating(false);
  };

  useEffect(() => {
    const calculateSectionCount = async (outline) => {
      const lines = outline.split("\n");
      // Match lines that start with 4 spaces and an asterisk, but not more
      // const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
      const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
      console.log("count", count);
      setArticleSectionCount(count);
      // return count;
    };
    calculateSectionCount(newOutlineResponseData);

    console.log("outlineData", newOutlineResponseData);
  }, [newOutlineResponseData]);

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
                // <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                //   {outlineLoading ? (
                //     <div className="flex flex-col items-center justify-center min-h-[250px]">
                //       <Loader />
                //       <p className="mt-4 text-gray-600 font-semibold">
                //         Generating Outline...
                //       </p>
                //       <p className="text-sm text-gray-500">
                //         This may take a moment.
                //       </p>
                //     </div>
                //   ) : outlineData.length > 0 ? (
                //     <>
                //       <div className="mb-6">
                //         <div className="flex justify-between items-center mb-2">
                //           <h4 className="text-lg font-semibold text-black-700 mb-2">
                //             Outline
                //           </h4>

                //           <div className="ml-auto flex items-center gap-2">
                //             {!editOutline && (
                //               <button
                //                 onClick={() => {
                //                   setEditOutline(true);
                //                   setEditedOutline(outlineData);
                //                 }}
                //                 className="text-blue-500 hover:text-blue-700 font-semibold"
                //               >
                //                 Edit
                //               </button>
                //             )}
                //             {editOutline && (
                //               <>
                //                 {saveEditedOutline && (
                //                   <Loader className="loader-sm" />
                //                 )}
                //                 <button
                //                   disabled={saveEditedOutline}
                //                   onClick={handleSaveEditedOutline}
                //                   className="text-green-500 hover:text-green-700 font-semibold disabled:opacity-50"
                //                 >
                //                   Save
                //                 </button>
                //                 <button
                //                   disabled={saveEditedOutline}
                //                   onClick={handleCancelEditedOutline}
                //                   className="text-red-500 hover:text-red-700 font-semibold disabled:opacity-50"
                //                 >
                //                   Cancel
                //                 </button>
                //               </>
                //             )}
                //           </div>
                //         </div>
                //         {editOutline ? (
                //           <textarea
                //             rows="10"
                //             className="w-full p-3 border border-blue-300 rounded-md shadow-inner ffocus:ring-2 ffocus:ring-blue-500 focus:outline-[#1abc9c] focus:outline-2"
                //             disabled={saveEditedOutline}
                //             value={editedOutline}
                //             onChange={(e) => setEditedOutline(e.target.value)}
                //           />
                //         ) : (
                //           <textarea
                //             rows="10"
                //             readOnly
                //             disabled
                //             className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                //             value={outlineData}
                //           />
                //         )}
                //       </div>

                //       <button
                //         onClick={() => handleTabChange("Citable Summary")}
                //         className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                //       >
                //         Next
                //       </button>
                //     </>
                //   ) : (
                //     <p className="text-black-500 text-center py-10">
                //       No outline data available. It might be generating for the
                //       first time.
                //     </p>
                //   )}
                // </div>
                <div>1</div>
              )}

              {projectData.activeModalTab === "Citable Summary" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {citableLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[250px]">
                      <Loader />
                      <p className="mt-4 text-gray-600 font-semibold">
                        Generating Citable Summary...
                      </p>
                      <p className="text-sm text-gray-500">
                        This may take a moment.
                      </p>
                    </div>
                  ) : citabledata.length > 0 ? (
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
                              {saveEditedCitable && (
                                <Loader className="loader-sm" />
                              )}
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
                  ) : (
                    <p className="text-black-500">No Citable data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Article")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                  >
                    Next
                  </button>
                </div>
              )}

              {projectData.activeModalTab === "Article" && (
                <div className="flex flex-col md:flex-row gap-6">
                  <div
                    className={`${
                      articledataUpdated.length > 0 ? "md:w-1/2" : "w-full"
                    } w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200`}
                  >
                    <h4 className="text-lg font-semibold text-black-700 mb-4">
                      Generated Article
                    </h4>

                    <div className="grid ">
                      <textarea
                        rows="10"
                        className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                        disabled={sectionIsGenerating}
                        defaultValue={
                          Array.isArray(articleSections)
                            ? articleSections.join("\n")
                            : articleSections || ""
                        }
                      />

                      <div className="ml-auto flex gap-2">
                        {articleSectionGenerateCount < articleSectionCount && (
                          <button
                            className=""
                            disabled={sectionIsGenerating}
                            onClick={() => {
                              generateArticleSection(
                                articleSectionGenerateCount
                              );
                              console.log(
                                "articleSectionGenerateCount",
                                articleSectionGenerateCount
                              );
                            }}
                          >
                            Generate section {articleSectionGenerateCount} /{" "}
                            {articleSectionCount}
                          </button>
                        )}

                        <button
                          disabled={sectionIsGenerating}
                          className=""
                          style={{ backgroundColor: "#4CAF50" }}
                          onClick={() => {
                            handleSaveArticle(
                              Array.isArray(articleSections)
                                ? articleSections.join("\n")
                                : articleSections || ""
                            );
                          }}
                        >
                          Save
                        </button>

                        <button
                          disabled={sectionIsGenerating}
                          className=""
                          style={{ backgroundColor: "#3478F6" }}
                          onClick={() =>
                            handleSaveGdrive(articleSections, row_id)
                          }
                        >
                          Save to Google Drive
                        </button>
                      </div>
                      {sectionIsGenerating && <Loader />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

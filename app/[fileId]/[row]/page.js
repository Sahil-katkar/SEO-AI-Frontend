"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "next/navigation";

export default function FileRow() {
  const {
    projectData,
    updateProjectData,
    setActiveStep,
    STEPS,
    isModalOpen,
    activeModalRowIndex,
    activeModalTab,
    primaryKeyword,
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [articledata, setArticleData] = useState([]);
  const [articledataUpdated, setArticleDataUpdated] = useState([]);
  const [intentdata, setIntentData] = useState([]);
  const [citabledata, setCitableData] = useState([]);

  const [outlineData, setOutlineData] = useState("");
  const [outlineDataUpdated, setOutlineDataUpdated] = useState([]);
  const [editIntent, setEditIntent] = useState(false);
  const [editCitable, setEditCitable] = useState(false);

  const [parsedContentState, setParsedContentState] = useState([]);
  const [editedIntent, setEditedIntent] = useState("");
  const [editedCitable, setEditedCitable] = useState("");

  const [editedExplanation, setEditedExplanation] = useState("");
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);
  const [saveEditedCitable, setSaveEditedCitable] = useState(false);

  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  const fileId = params.fileId;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  const row = params.row;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const row_id = `${fileId}_${row}`;
  // ... after the intent state variables
  // const [editIntent, setEditIntent] = useState(false);
  // const [editedIntent, setEditedIntent] = useState("");
  // const [saveEditedIntent, setSaveEditedIntent] = useState(false);

  // --- ADD THESE NEW STATES FOR THE OUTLINE ---
  const [editOutline, setEditOutline] = useState(false);
  const [parsedOutline, setParsedOutline] = useState("");
  const [editedOutline, setEditedOutline] = useState("");
  const [saveEditedOutline, setSaveEditedOutline] = useState(false);
  // --- END NEW STATES ---

  // const [logs, setLogs] = useState([]);
  // ... rest of the state

  useEffect(() => {
    const row_id = `${fileId}_${row}`;

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
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [row_id]);

  {
    console.log("fileId", row_id);
  }

  // ... after handleSaveEditedIntent ...

  const handleCancelEditedOutline = () => {
    setEditedOutline(outlineData); // Reset from the original state
    setEditOutline(false); // Exit edit mode
  };

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
  }, [saveStatus, fileId, row]);

  // Function to fetch updated data
  const fetchDataUpdated = async () => {
    const row_id = `${fileId}_${row}`;
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

  const handleCancelEditedIntent = () => {
    setEditedIntent(parsedContentState);
    setEditedExplanation(parsedContentState.explanation || "");
    setEditIntent(false);
  };

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

  const handleSaveEditedIntent = async () => {
    setSaveEditedIntent(true);

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("row_details")
        .upsert(
          {
            row_id: row_id,
            intent: editedIntent,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      console.log("Intent saved to database successfully:", upsertedData);
      toast.success("Intent saved successfully", {
        position: "bottom-right",
      });

      const payload = {
        user_id: row_id,
        Mainkeyword: keyword,
        edit_content: {
          intent: editedIntent,
        },
      };

      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      setSaveEditedIntent(false);
    }
  };

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

      console.log("Outline saved to database successfully:", upsertedData);
      toast.success("Intent saved successfully", {
        position: "bottom-right",
      });

      // const payload = {
      //   user_id: row_id,
      //   Mainkeyword: keyword,
      //   edit_content: {
      //     intent: editedIntent,
      //   },
      // };

      // const res = await fetch("/api/contentEdit", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
    } catch (err) {
      console.error(
        "An error occurred during the save/regeneration process:",
        err
      );
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedOutline(false);
    }
  };

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

      // const payload = {
      //   user_id: row_id,
      //   Mainkeyword: keyword,
      //   edit_content: {
      //     intent: editedIntent,
      //   },
      // };

      // const res = await fetch("/api/contentEdit", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
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
  return (
    <div className="container">
      <main className="main-content step-component">
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
            Processing Row data {params.row}
          </h3>
        </div>

        {apiError && <div className="text-red-500">Error: {apiError}</div>}
        {isLoading && <Loader />}

        {!isLoading && (
          <div className="flex flex-col gap-[8px]">
            <div className="modal-tabs">
              {["Logs", "Intent", "Outline", "Citable Summary", "Content"].map(
                (tabName) => (
                  <button
                    key={tabName}
                    className={`modal-tab-button ${
                      projectData.activeModalTab === tabName ? "active" : ""
                    }`}
                    onClick={() => handleTabChange(tabName)}
                  >
                    {tabName}
                  </button>
                )
              )}
            </div>

            <div className="modal-tab-content">
              {projectData.activeModalTab === "Logs" && (
                <div className="mt-4 bg-gray-100 p-4 rounded">
                  <h4 className="font-semibold mb-2">Processing Logs</h4>
                  {logs.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {logs.map((log, i) => (
                        <li key={i}>{log.content}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No logs found.</p>
                  )}
                </div>
              )}

              {projectData.activeModalTab === "Intent" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {intentdata.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Intent
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
                          {!editIntent && (
                            <button onClick={() => setEditIntent(true)}>
                              Edit
                            </button>
                          )}
                          {editIntent && (
                            <>
                              {saveEditedIntent && (
                                <Loader className="loader-sm" />
                              )}
                              <button
                                disabled={saveEditedIntent}
                                onClick={handleSaveEditedIntent}
                              >
                                Save
                              </button>
                              <button
                                disabled={saveEditedIntent}
                                onClick={handleCancelEditedIntent}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editIntent ? (
                        <>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedIntent}
                            onChange={(e) => setEditedIntent(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {parsedContentState}
                          </p>
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No intent data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Outline")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {projectData.activeModalTab === "Outline" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {outlineData.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Outline
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
                          {!editOutline && (
                            <button
                              onClick={() => {
                                setEditOutline(true);
                                setEditedOutline(outlineData);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {editOutline && (
                            <>
                              {saveEditedOutline && (
                                <Loader className="loader-sm" />
                              )}
                              <button
                                disabled={saveEditedOutline}
                                onClick={handleSaveEditedOutline}
                              >
                                Save
                              </button>
                              <button
                                disabled={saveEditedOutline}
                                onClick={handleCancelEditedOutline}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editOutline ? (
                        <>
                          <textarea
                            disabled={saveEditedOutline}
                            value={editedOutline}
                            onChange={(e) => setEditedOutline(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {outlineData}
                          </p>
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No outline data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Citable Summary")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {projectData.activeModalTab === "Citable Summary" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {outlineData.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Citable Summary
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
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
                            disabled={saveEditedCitable}
                            value={editedCitable}
                            onChange={(e) => setEditedCitable(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {citabledata}
                          </p>
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No Citable data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Content")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {/* {projectData.activeModalTab === "Content" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {[...articledata, ...articledataUpdated].map(
                    (item, index) => {
                      const content =
                        item.content || item.updated_content || "";
                      let parsedArticle;

                      try {
                        parsedArticle =
                          typeof content === "string"
                            ? JSON.parse(content)
                            : content;
                      } catch {
                        parsedArticle = content;
                      }

                      return (
                        <div key={index} className="mb-6">
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            {item.updated_content
                              ? "Generated Article Updated"
                              : "Generated Article"}
                          </h4>
                          {typeof parsedArticle === "string" ? (
                            <p className="text-black-600 whitespace-pre-line">
                              {parsedArticle}
                            </p>
                          ) : (
                            <ul className="list-disc pl-6 text-black-600">
                              {Object.entries(parsedArticle).map(
                                ([key, value]) => (
                                  <li key={key} className="mb-2">
                                    <strong>{key}:</strong> {value}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )} */}

              {projectData.activeModalTab === "Content" && (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Original Article Box */}
                  <div
                    className={`${
                      articledataUpdated.length > 0 ? "md:w-1/2" : "w-full"
                    } w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200`}
                  >
                    <h4 className="text-lg font-semibold text-black-700 mb-4">
                      Generated Article
                    </h4>
                    {articledata.length > 0 ? (
                      articledata.map((item, index) => {
                        const content = item.content || "";
                        let parsedArticle;

                        try {
                          parsedArticle =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedArticle = content;
                        }

                        return (
                          <div key={`original-${index}`} className="mb-6">
                            {typeof parsedArticle === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedArticle}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedArticle).map(
                                  ([key, value]) => (
                                    <li key={key} className="mb-2">
                                      <strong>{key}:</strong> {value}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-black-500">
                        No article content available.
                      </p>
                    )}
                  </div>

                  {/* Updated Article Box */}
                  {articledataUpdated.length > 0 && (
                    <div className="w-full md:w-1/2 bg-blue-50 p-6 rounded-xl shadow-md border border-blue-300">
                      <h4 className="text-lg font-semibold text-blue-700 mb-4">
                        Updated Article
                      </h4>
                      {articledataUpdated.map((item, index) => {
                        const content = item.updated_content || "";
                        let parsedArticle;

                        try {
                          parsedArticle =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedArticle = content;
                        }

                        return (
                          <div key={`updated-${index}`} className="mb-6">
                            {typeof parsedArticle === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedArticle}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedArticle).map(
                                  ([key, value]) => (
                                    <li key={key} className="mb-2">
                                      <strong>{key}:</strong> {value}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

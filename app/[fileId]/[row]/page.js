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
  const [outlineData, setOutlineData] = useState([]);
  const [outlineDataUpdated, setOutlineDataUpdated] = useState([]);

  const [editIntent, setEditIntent] = useState(false);
  const [parsedContentState, setParsedContentState] = useState({});
  const [editedIntent, setEditedIntent] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);
  const [logs, setLogs] = useState([]);

  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  const fileId = params.fileId;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");

  // console.log("keyword sss", keyword);

  const row = params.row;

  const router = useRouter();
  const supabase = createClientComponentClient();
  const row_id = `${fileId}_${row}`;

  // Fetch initial data
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
          .from("intent")
          .select("content")
          .eq("row_id", row_id);

        const { data: outline } = await supabase
          .from("outline")
          .select("content")
          .eq("row_id", row_id);

        setArticleData(article || []);
        setIntentData(intent || []);
        setOutlineData(outline || []);
        setLogs(logData || "");

        const parsed = JSON.parse(intent?.[0]?.content || "{}");
        setParsedContentState(parsed);
        setEditedIntent(parsed.intent || "");
        setEditedExplanation(parsed.explanation || "");
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fileId, row, row_id]);

  // Fetch updated data when saveStatus changes
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
      setSaveStatus(false); // Reset saveStatus to prevent redundant fetches
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
    setEditedIntent(parsedContentState.intent || "");
    setEditedExplanation(parsedContentState.explanation || "");
    setEditIntent(false);
  };

  const handleSaveEditedIntent = async () => {
    const updatedContent = {
      intent: editedIntent,
      explanation: editedExplanation,
    };

    const stringifiedIntent = JSON.stringify(updatedContent, null, 4);

    const payload = {
      user_id: `${fileId}_${row}`,
      Mainkeyword: keyword,
      edit_content: {
        intent: stringifiedIntent,
      },
    };

    console.log("payloadd", payload);

    setSaveEditedIntent(true);
    try {
      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Updated Outline and Article generated successfully!", {
          position: "bottom-right",
        });
        setParsedContentState(updatedContent);
        setEditIntent(false);
        setSaveStatus(true); // Trigger useEffect to fetch updated data
        await fetchDataUpdated(); // Fetch updated data immediately
      } else {
        const errorRes = await res.json();
        toast.error(errorRes.message || "Something went wrong", {
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error("An error occurred while saving intent", {
        position: "top-right",
      });
    } finally {
      setSaveEditedIntent(false);
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
              {["Logs", "Intent", "Outline", "Content"].map((tabName) => (
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
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {parsedContentState?.intent}
                          </p>
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No intent data available.</p>
                  )}
                </div>
              )}

              {/* {projectData.activeModalTab === "Outline" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {[...outlineData, ...outlineDataUpdated].map(
                    (item, index) => {
                      const content =
                        item.content || item.updated_content || "";
                      let parsedOutline;

                      try {
                        parsedOutline =
                          typeof content === "string"
                            ? JSON.parse(content)
                            : content;
                      } catch {
                        parsedOutline = content;
                      }

                      return (
                        <div key={index} className="mb-6">
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            {item.updated_content
                              ? "Generated Outline Updated"
                              : "Generated Outline"}
                          </h4>
                          {typeof parsedOutline === "string" ? (
                            <p className="text-black-600 whitespace-pre-line">
                              {parsedOutline}
                            </p>
                          ) : (
                            <ul className="list-disc pl-6 text-black-600">
                              {Object.entries(parsedOutline).map(
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

              {/* {projectData.activeModalTab === "Outline" && (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2 bg-gray-50 p-4 border border-gray-300 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold text-black-700 mb-2">
                      Generated Outline
                    </h4>
                    {outlineData.length > 0 ? (
                      outlineData.map((item, index) => {
                        const content = item.content || "";
                        let parsedOutline;

                        try {
                          parsedOutline =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedOutline = content;
                        }

                        return (
                          <div key={`original-${index}`} className="mb-4">
                            {typeof parsedOutline === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedOutline}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedOutline).map(
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
                        No original outline available.
                      </p>
                    )}
                  </div>

                  <div className="w-full md:w-1/2 bg-blue-50 p-4 border border-blue-300 rounded-lg shadow-sm">
                    <h4 className="text-lg font-semibold text-blue-700 mb-2">
                      Updated Outline
                    </h4>
                    {outlineDataUpdated.length > 0 ? (
                      outlineDataUpdated.map((item, index) => {
                        const content = item.updated_content || "";

                        console.log("content", content);

                        let parsedOutline;

                        try {
                          parsedOutline =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedOutline = content;
                        }

                        return (
                          <div key={`updated-${index}`} className="mb-4">
                            {typeof parsedOutline === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedOutline}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedOutline).map(
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
                        No updated outline available.
                      </p>
                    )}
                  </div>
                </div>
              )} */}

              {projectData.activeModalTab === "Outline" && (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Original Outline Box */}
                  <div
                    className={`${
                      outlineDataUpdated.length > 0 ? "md:w-1/2" : "w-full"
                    } w-full bg-gray-50 p-4 border border-gray-300 rounded-lg shadow-sm`}
                  >
                    <h4 className="text-lg font-semibold text-black-700 mb-2">
                      Generated Outline
                    </h4>
                    {outlineData.length > 0 ? (
                      outlineData.map((item, index) => {
                        const content = item.content || "";
                        let parsedOutline;

                        try {
                          parsedOutline =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedOutline = content;
                        }

                        return (
                          <div key={`original-${index}`} className="mb-4">
                            {typeof parsedOutline === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedOutline}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedOutline).map(
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
                        No original outline available.
                      </p>
                    )}
                  </div>

                  {/* Updated Outline Box */}
                  {outlineDataUpdated.length > 0 && (
                    <div className="w-full md:w-1/2 bg-blue-50 p-4 border border-blue-300 rounded-lg shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-700 mb-2">
                        Updated Outline
                      </h4>
                      {outlineDataUpdated.map((item, index) => {
                        const content = item.updated_content || "";
                        let parsedOutline;

                        try {
                          parsedOutline =
                            typeof content === "string"
                              ? JSON.parse(content)
                              : content;
                        } catch {
                          parsedOutline = content;
                        }

                        return (
                          <div key={`updated-${index}`} className="mb-4">
                            {typeof parsedOutline === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedOutline}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {Object.entries(parsedOutline).map(
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

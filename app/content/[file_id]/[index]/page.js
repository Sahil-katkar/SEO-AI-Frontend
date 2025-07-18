"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "next/navigation";

import StatusHeading from "@/components/StatusHeading";

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

  console.log("activeModalTab", activeModalTab);

  const [showPreviousArticlesTable, setShowPreviousArticlesTable] =
    useState(false);

  const [density, setDensity] = useState(null);

  // Ensure these are declared outside if you need them globally or later in the function
  let competitorContents = [];
  let competitorUrls = [];
  let allCompetitorData = [];

  const toggleTableVisibility = async () => {
    setShowPreviousArticlesTable((prevState) => !prevState);

    const { data: articleData, error: articleError } = await supabase
      .from("article")
      .select("updated_article")
      .eq("row_id", row_id);

    const { data: lsiData, error: lsiError } = await supabase // Renamed for clarity, `lsiData` is the array of objects
      .from("analysis")
      .select("lsi_keywords") // This selects the column named 'lsi_keywords'
      .eq("row_id", row_id);

    const { data: lsiUpdated, error: lsiUpdatedErr } = await supabase // Renamed for clarity, `lsiData` is the array of objects
      .from("analysis")
      .select("updated_lsi_keywords") // This selects the column named 'lsi_keywords'
      .eq("row_id", row_id);

    console.log("lsiData", lsiData);
    console.log("lsiUpdated", lsiUpdated);

    // 1. Parse the original LSI data
    const originalLsi = JSON.parse(lsiData?.[0]?.lsi_keywords || "[]");

    // 2. Parse the updated LSI keywords
    const updatedLsi = JSON.parse(
      lsiUpdated?.[0]?.updated_lsi_keywords || "{}"
    );

    // 3. Prepare the final merged LSI array
    const finalMergedLsi = originalLsi.map((entry, index) => {
      const key = `${index}_${entry.url}`; // Create the key like '0_url', '1_url'
      const updatedKeywords = updatedLsi[key] || [];

      // Format updated keywords back to the format in original: "keyword,value"
      const parsedUpdatedKeywords = updatedKeywords.map(
        (item) => `${item.keyword},${item.value}`
      );

      // Combine old string + new entries
      const originalKeywordsStr = entry.lsi_keywords || "";
      const finalLsiKeywordsStr = [
        originalKeywordsStr,
        ...parsedUpdatedKeywords,
      ].join(",");

      return {
        url: entry.url,
        lsi_keywords: finalLsiKeywordsStr,
      };
    });

    console.log("✅ Only lsi_keywords:", finalMergedLsi);

    const formattedLsi = finalMergedLsi.map((item) => {
      const { url, lsi_keywords } = item;

      if (typeof lsi_keywords === "string") {
        const splitArray = lsi_keywords.split(",");
        const keywordPairs = [];

        for (let i = 0; i < splitArray.length; i += 2) {
          const keyword = splitArray[i]?.trim();
          const value = parseFloat(splitArray[i + 1]);

          // You can optionally add a check here to filter out garbage keywords/values
          if (keyword && !isNaN(value)) {
            keywordPairs.push([keyword, value]);
          }
        }

        return {
          url,
          lsi_keywords: keywordPairs,
        };
      }

      // Optional fallback in case of unexpected format
      return {
        url,
        lsi_keywords: {
          lsi_keyword: "failed to generate lsi keywords",
        },
      };
    });

    // Convert to flat { keyword: value } format
    const keywordsAsObject = {};

    formattedLsi.forEach((item) => {
      if (Array.isArray(item.lsi_keywords)) {
        item.lsi_keywords.forEach(([keyword, value]) => {
          if (keyword && !isNaN(value)) {
            keywordsAsObject[keyword] = value;
          }
        });
      }
    });

    // Create backend payload
    const backendPayload = {
      text_content: articleData[0].updated_article,
      keywords: keywordsAsObject, // ✅ Send as object, not JSON string
    };

    console.log("✅ Payload to Backend:", backendPayload);

    console.log(
      "✅ Formatted LSI Keywords:",
      JSON.stringify(formattedLsi, null, 2)
    );

    if (lsiError) {
      console.error("Supabase LSI fetch error:", lsiError);
      toast.error("Failed to fetch LSI keyword data.");
      return;
    }

    // console.log("keywordsAsObject", keywordsAsObject);

    // const backendPayload = {
    //   text_content: articleData[0].updated_article,
    //   keywords: JSON.stringify(formattedLsi, null, 2),
    // };

    console.log("backendPayload", backendPayload);

    const apiResponse = await fetch(`/api/keyword_density/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await apiResponse.json();
    setDensity(data);

    if (apiResponse.ok) {
      console.log("FastAPI response:", data);

      const { data: upsertedData, error: upsertError } = await supabase
        .from("article")
        .upsert(
          {
            row_id: row_id,
            density: data,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }
    } else {
      console.log("errror");
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [status, setstatus] = useState("");

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
  const [parsedMissionPlan, setParsedMissionPlan] = useState("");

  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  // const file_id = params.file_id;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  const row = params.row;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [citableLoading, setCitableLoading] = useState(false);

  // const row_id = `${file_id}_${index}`;
  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;

  console.log("row_id", row_id);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("analysis")
        .select("status")
        .eq("row_id", row_id);

      console.log("status", data[0].status);

      if (data) {
        setstatus(data[0].status);
      } else {
        console.log("error", error);
      }
    };

    fetchStatus();
  }, [row_id]);

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

  const [articleSectionCount, setArticleSectionCount] = useState(0);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
    useState(1);
  const [articleSections, setArticleSections] = useState();
  const [sectionIsGenerating, setSectionIsGenerating] = useState(false);

  // const [logs, setLogs] = useState([]);
  // ... rest of the state

  const handleSaveGdrive = async () => {
    try {
      const backendPayload = {
        article_content: articleSections,
        folder_name: row_id,
      };

      console.log("backendPayload", backendPayload);

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
        // Success: Status code was 2xx
        toast.success("File Saved Succesfully!");
        // You can also access data.document_id here if needed
        // console.log("Document ID:", data.document_id);
      } else {
        // Error: Status code was not 2xx (e.g., 4xx, 5xx)
        const errorMessage =
          data.error || data.detail || "Failed to save file.";
        toast.error(`Error: ${errorMessage}`);
        console.error("API Error Response:", data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    // const row_id = `${fileId}_${row}`;

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

        const { data: missionPlan } = await supabase
          .from("row_details")
          .select("mission_plan")
          .eq("row_id", row_id);

        setArticleData(article || []);
        setIntentData(intent);

        console.log("citable", citable);

        // setCitableData(citable);
        console.log("Raw outline data from DB:", outline);

        const parsedValue = outline?.[0]?.new_outline || "";
        let outlineString = parsedValue;
        if (
          parsedValue &&
          typeof parsedValue === "object" &&
          parsedValue.article_outline_data
        ) {
          outlineString = parsedValue.article_outline_data;
        }
        const parsedCitable = citable?.[0]?.citable_answer || "";

        setOutlineData(outlineString);
        setCitableData(parsedCitable);
        console.log("Parsed outline string:", outlineData);

        const parsed = intent?.[0]?.intent || "";

        console.log("parsed:", parsed);

        setParsedContentState(parsed);
        console.log("parsedContentState", parsedContentState);

        setEditedIntent(parsed);
        console.log("edited intent", editIntent);

        setEditedExplanation(parsed.explanation || "");
        setParsedMissionPlan(missionPlan?.[0]?.mission_plan || "");
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [row_id]);

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
      // Upsert the edited outline into the database
      const { data: upsertedData, error: upsertError } = await supabase
        .from("outline")
        .upsert(
          {
            row_id: row_id,
            new_outline: editedOutline, // Use the edited outline here!
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      // Update the UI with the new outline
      setOutlineData(editedOutline);
      setEditOutline(false); // Exit edit mode
      toast.success("Outline saved successfully!", {
        position: "bottom-right",
      });
    } catch (err) {
      // console.error("Error saving edited outline:", err);
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

  // console.log("outlineData", outlineData);
  // console.log("outlineDataUpdated", outlineDataUpdated);

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
    const { data: row_details_data } = await supabase
      .from("row_details")
      .select("mission_plan,persona,lsi_keywords")
      .eq("row_id", row_id);

    const { data: row_details } = await supabase
      .from("analysis")
      .select("lsi_keywords")
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

    const { data: updatedLsi } = await supabase
      .from("analysis")
      .select("updated_lsi_keywords")
      .eq("row_id", row_id);

    // console.log(
    //   "row_details",
    //   Array.isArray(row_details[0].lsi_keywords)
    //     ? row_details[0].lsi_keywords // If it's already an array, use it directly
    //     : typeof row_details[0].lsi_keywords === "string" &&
    //       row_details[0].lsi_keywords.trim() !== ""
    //     ? row_details[0].lsi_keywords
    //         .split(",")
    //         .map((s) => s.trim())
    //         .filter((s) => s) // If it's a non-empty string, split it by comma
    //     : []
    // );

    // 1. Normalize updated LSI format
    // Step 1: Normalize updated LSI keywords

    // Step 1: Parse updated keywords
    const updatedKeywords = JSON.parse(
      updatedLsi?.[0]?.updated_lsi_keywords || "{}"
    );
    console.log("✅ updatedKeywords:", updatedKeywords);

    const updatedEntries = Object.entries(updatedKeywords);
    console.log("✅ updatedEntries:", updatedEntries);

    // Step 2: Prepare base structure from row_details
    console.log("🧠 row_details:", row_details);
    const rawLsiText = row_details?.[0]?.lsi_keywords;

    if (!row_details || !row_details[0] || typeof rawLsiText !== "string") {
      console.error("❌ row_details missing or lsi_keywords is not a string");
      return;
    }

    const baseEntry = {
      url: Object.keys(updatedKeywords)[0]?.split("_").slice(1).join("_") || "", // fallback url
      raw_text: row_details[0].mission_plan || "",
      lsi_keywords: rawLsiText
        .split("\n")
        .map((keyword) => [keyword.trim(), 0]) // initialize with score 0
        .filter(([k]) => k.length > 0),
    };

    const structuredLsi = [baseEntry];

    console.log("✅ Converted lsi_keywords to structured:", structuredLsi);

    // Step 3: Merge updated entries
    updatedEntries.forEach(([key, value]) => {
      const [indexStr, ...urlParts] = key.split("_");
      const index = parseInt(indexStr, 10);
      const url = urlParts.join("_");

      if (!Array.isArray(value) || typeof value[0] !== "string") {
        console.warn(`⚠️ Unexpected format in ${key}:`, value);
        return;
      }

      const [raw] = value;
      const [keyword, scoreRaw] = raw.split(":");

      // Convert to float, preserving decimal places properly
      const score = parseFloat(
        scoreRaw.length >= 3
          ? `0.${scoreRaw.replace(/^0+/, "")}` // e.g., "010" → 0.10
          : scoreRaw
      );

      if (!keyword || isNaN(score)) {
        console.warn(`⚠️ Invalid keyword or score in ${key}:`, raw);
        return;
      }

      // Ensure entry exists
      if (!structuredLsi[index]) {
        structuredLsi[index] = {
          url,
          raw_text: "",
          lsi_keywords: [],
        };
      }

      const existing = structuredLsi[index].lsi_keywords;
      const alreadyExists = existing.some(([k]) => k === keyword);

      if (!alreadyExists) {
        existing.push([keyword, score]);
      }
    });

    // Step 4: Log final merged LSI structure
    console.log(
      "✅ Final Merged LSI Object:",
      JSON.stringify(structuredLsi, null, 2)
    );

    const finalLSIReports = []; // This will hold the output in the desired new format

    if (Array.isArray(structuredLsi)) {
      structuredLsi.forEach((lsiEntry) => {
        const url = lsiEntry.url;
        const extractedKeywordsForCurrentURL = []; // To collect keywords for this specific URL's report

        // --- Start existing LSI keyword extraction logic ---
        if (lsiEntry && Array.isArray(lsiEntry.lsi_keywords)) {
          lsiEntry.lsi_keywords.forEach((keywordItem) => {
            if (Array.isArray(keywordItem) && keywordItem.length > 0) {
              let firstElement = keywordItem[0];

              // Case 1: Nested stringified JSON (needs parsing and cleaning)
              if (
                typeof firstElement === "string" &&
                firstElement.startsWith("[") &&
                firstElement.endsWith("]")
              ) {
                // Attempt to clean the malformed URL part within the string
                const malformedUrlRegex =
                  /("url":")\{"([^"]+?)":\["[^"]+"\]\}"/g;
                if (malformedUrlRegex.test(firstElement)) {
                  firstElement = firstElement.replace(
                    malformedUrlRegex,
                    '$1$2"'
                  );
                }

                try {
                  const parsedInnerArray = JSON.parse(firstElement);
                  if (Array.isArray(parsedInnerArray)) {
                    parsedInnerArray.forEach((innerObj) => {
                      if (innerObj && Array.isArray(innerObj.lsi_keywords)) {
                        extractedKeywordsForCurrentURL.push(
                          ...innerObj.lsi_keywords
                        );
                      }
                    });
                  }
                } catch (e) {
                  console.warn(
                    `🚫 Parsing failed for nested LSI keyword string for URL ${url}. Error:`,
                    e
                  );
                }
              }
              // Case 2: Direct [string, number] keyword pair
              else if (
                typeof firstElement === "string" &&
                typeof keywordItem[1] === "number"
              ) {
                extractedKeywordsForCurrentURL.push(keywordItem);
              }
            }
          });
        }
        // --- End existing LSI keyword extraction logic ---

        // Determine the 'lsi_keywords' value for the final output object for this URL
        const lsiKeywordsForOutput =
          extractedKeywordsForCurrentURL.length === 0
            ? { lsi_keyword: "failed to generate lsi keywords" }
            : extractedKeywordsForCurrentURL;

        // Add this structured object (for the current URL) to the final array for the API
        finalLSIReports.push({
          url: url,
          lsi_keywords: lsiKeywordsForOutput,
        });
      });
    }

    // Instead of stringifying, keep finalLSIReports as an object for the API request
    // Send it directly as JSON in the fetch/axios request
    console.log(
      "✅ Final Merged LSI Reports for Backend (Desired Format):",
      finalLSIReports
    );

    const payload = {
      missionPlan: row_details_data[0].mission_plan,
      gapsAndOpportunities: valueAdd?.[0]?.value_add || "", // extract string
      // lsi_keywords: Array.isArray(row_details[0].lsi_keywords)
      //   ? row_details[0].lsi_keywords
      //   : [], // ensure array
      // lsi_keywords: Array.isArray(row_details[0].lsi_keywords)
      //   ? row_details[0].lsi_keywords // If it's already an array, use it directly
      //   : typeof row_details[0].lsi_keywords === "string" &&
      //     row_details[0].lsi_keywords.trim() !== ""
      //   ? row_details[0].lsi_keywords
      //       .split(",")
      //       .map((s) => s.trim())
      //       .filter((s) => s) // If it's a non-empty string, split it by comma
      //   : [],
      lsi_keywords: finalLSIReports,
      persona: row_details_data[0].persona,
      outline: outline?.[0]?.new_outline || "", // extract string
      section: String(section), // ensure string
    };

    console.log(
      "lsisssssss",
      Array.isArray(row_details[0].lsi_keywords)
        ? row_details[0].lsi_keywords // If it's already an array, use it directly
        : typeof row_details[0].lsi_keywords === "string" &&
          row_details[0].lsi_keywords.trim() !== ""
        ? row_details[0].lsi_keywords
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s) // If it's a non-empty string, split it by comma
        : []
    );

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
    console.log("dataaaaaaaaaaa", data.article_data);

    setArticleSections((prev) =>
      Array.isArray(prev) ? [...prev, data.article_data] : [data.article_data]
    );
    // articleArr.push(data);
    setArticleSectionGenerateCount(articleSectionGenerateCount + 1);
    setSectionIsGenerating(false);
    // setArticleSections();
  };
  // In your React Component

  useEffect(() => {
    if (projectData.activeModalTab === "Outline") {
      const fetchOrGenerateOutline = async () => {
        setOutlineLoading(true);

        try {
          // 1. Check if outline exists in the database

          const { data: outlineDataFromDB, error: outlineError } =
            await supabase
              .from("outline")
              .select("new_outline")
              .eq("row_id", row_id)
              .single();

          if (outlineError && outlineError.code !== "PGRST116") {
            // PGRST116 = no rows found, so only throw if it's a real error
            throw outlineError;
          }

          console.log("outlineDataFromDB", outlineDataFromDB);

          if (
            outlineDataFromDB &&
            outlineDataFromDB.new_outline &&
            outlineDataFromDB.new_outline.trim() !== ""
          ) {
            // Outline exists, use it
            setOutlineData(outlineDataFromDB.new_outline);
          } else {
            // Outline does not exist, call the API to generate it
            console.log("insidee jade", row_id);

            // 1. Fetch all required data from Supabase
            const { data: rowDetails, error: rowDetailsError } = await supabase
              .from("row_details")
              .select(
                "keyword, intent, persona, questions, faq, outline_format"
              )
              .eq("row_id", row_id)
              .single();

            console.log("rowDetails", rowDetails);

            const { data: analysis, error: analysisError } = await supabase
              .from("analysis")
              .select("lsi_keywords")
              .eq("row_id", row_id)
              .single();

            if (rowDetailsError) throw rowDetailsError;
            if (analysisError) throw analysisError;
            if (!rowDetails)
              throw new Error("Details not found for this entry.");

            // 2. Safely parse and extract LSI keywords
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

            // 3. Construct the payload
            const payload = {
              primary_keyword: rowDetails.keyword,
              lsi_keywords: allExtractedKeywords,
              intent: rowDetails.intent,
              persona: rowDetails.persona,
              questions: rowDetails.questions,
              faq: rowDetails.faq,
              standard_outline_format: rowDetails.outline_format,
            };

            // 4. Call the API
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
            console.log(
              "Outline generated successfully:",
              data.article_outline_data
            );

            // 5. Save the new outline to the database
            const { error: upsertError } = await supabase
              .from("outline")
              .upsert(
                {
                  row_id: row_id,
                  new_outline: data.article_outline_data,
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

            // 6. Set the outline data for display
            setOutlineData(data.article_outline_data);
          }
        } catch (err) {
          // console.error("Error generating outline:", err);
          toast.error(err.message || "An unexpected error occurred.");
        } finally {
          setOutlineLoading(false); // Start the loader
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
          // 1. Check if citable summary exists in the database
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
            // Citable summary exists, use it
            setCitableData(citableDataFromDB.citable_answer);
          } else {
            // Citable summary does not exist, call the API to generate it

            // 1. Fetch required data from Supabase
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

            // 2. Construct the payload
            const payload = {
              mission_plan: rowDetails.mission_plan,
              initial_draft_index: rowDetails.outline_format,
            };

            // 3. Call the API
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
              } catch (jsonErr) {
                // If response is not JSON, keep the default errorMsg
              }
              throw new Error(errorMsg);
            }

            const data = await res.json();
            console.log(
              "Citable summary generated successfully:",
              data.generate_citable_summary_data
            );

            // 4. Save the new citable summary to the database
            const { error: upsertError } = await supabase
              .from("outline")
              .upsert(
                {
                  row_id: row_id,
                  citable_answer: data.generate_citable_summary_data,
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

            // 5. Set the citable summary data for display
            setCitableData(data.generate_citable_summary_data);
          }
        } catch (err) {
          // console.error("Error fetching or generating citable summary:", err);
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

  useEffect(() => {
    if (projectData.activeModalTab === "Article") {
      const fetchOrGenerateArticle = async () => {
        setSectionIsGenerating(true);
        try {
          // 1. Check if article exists in the database
          const { data: articleDataFromDB, error: articleError } =
            await supabase
              .from("article")
              .select("updated_article")
              .eq("row_id", row_id)
              .single();

          if (articleError && articleError.code !== "PGRST116") {
            throw articleError;
          }

          if (
            articleDataFromDB &&
            articleDataFromDB.updated_article &&
            articleDataFromDB.updated_article.trim() !== ""
          ) {
            // Article exists, use it
            setArticleSections([articleDataFromDB.updated_article]);
          } else {
            // Article does not exist, call the API to generate it
            // (You may need to construct the payload as in your generateArticleSection function)
            const payload = {
              // ...construct your payload here...
            };

            const res = await fetch("/api/generate-article", {
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

            // Save the new article to the database
            await supabase.from("article").upsert(
              {
                row_id: row_id,
                updated_article: data.article_data,
              },
              { onConflict: "row_id" }
            );

            setArticleSections([data.article_data]);
          }
        } catch (err) {
          toast.error(err.message || "An unexpected error occurred.");
        } finally {
          setSectionIsGenerating(false);
        }
      };

      fetchOrGenerateArticle();
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
      // If outline is an object with article_outline_data, use that string
      let outlineString = outline;
      if (
        outline &&
        typeof outline === "object" &&
        outline.article_outline_data
      ) {
        outlineString = outline.article_outline_data;
      }
      if (typeof outlineString !== "string") {
        setArticleSectionCount(0);
        return;
      }
      const lines = outlineString.split("\n");
      const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
      setArticleSectionCount(count);
    };
    calculateSectionCount(outlineData);

    console.log("outlineData", outlineData);
  }, [outlineData]);

  const [editArticle, setEditArticle] = useState(false);
  const [editedArticle, setEditedArticle] = useState("");
  const [saveEditedArticle, setSaveEditedArticle] = useState(false);

  const handleEditArticle = () => {
    setEditArticle(true);
    setEditedArticle(
      Array.isArray(articleSections)
        ? articleSections.join("\n")
        : articleSections || ""
    );
  };

  const handleCancelEditedArticle = () => {
    setEditArticle(false);
    setEditedArticle("");
  };

  const handleSaveEditedArticle = async () => {
    setSaveEditedArticle(true);
    try {
      // Save to database
      const { error } = await supabase.from("article").upsert(
        {
          row_id: row_id,
          updated_article: editedArticle,
        },
        { onConflict: "row_id" }
      );
      if (error) throw error;

      // Update UI
      setArticleSections([editedArticle]);
      setEditArticle(false);
      toast.success("Article saved successfully!", {
        position: "bottom-right",
      });
    } catch (err) {
      toast.error(err.message || "Failed to save article.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedArticle(false);
    }
  };

  return (
    <div className="container">
      <main className="main-content step-component">
        <StatusHeading status={status} />

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
            Processing Row for {params.row}
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
              {/* {projectData.activeModalTab === "Logs" && (
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
              )} */}

              {projectData.activeModalTab === "Outline" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {outlineLoading ? (
                    // --- LOADER UI ---
                    // This part is shown while the outline is being generated
                    <div className="flex flex-col items-center justify-center min-h-[250px]">
                      <Loader />
                      <p className="mt-4 text-gray-600 font-semibold">
                        Generating Outline...
                      </p>
                      <p className="text-sm text-gray-500">
                        This may take a moment.
                      </p>
                    </div>
                  ) : outlineData.length > 0 ? (
                    // --- DATA DISPLAY UI ---
                    // This part is shown after loading is complete and data is available
                    <>
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Outline
                          </h4>

                          {/* --- EDIT / SAVE / CANCEL BUTTONS --- */}
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
                                {saveEditedOutline && (
                                  <Loader className="loader-sm" />
                                )}
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

                        {/* --- TEXTAREA FOR VIEWING OR EDITING --- */}
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
                    // This part is shown if loading is complete but no data was found
                    <p className="text-black-500 text-center py-10">
                      No outline data available. It might be generating for the
                      first time.
                    </p>
                  )}
                </div>
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
                          <textarea
                            rows="10"
                            readOnly
                            disabled
                            className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                            value={citabledata}
                          />
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
                    onClick={() => handleTabChange("Article")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                  >
                    Next
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

              {projectData.activeModalTab === "Article" && (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Generated Article Section (Existing) */}
                  <div
                    className={`${
                      articledataUpdated.length > 0 ? "md:w-1/2" : "w-full"
                    } w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200`}
                  >
                    <h4 className="text-lg font-semibold text-black-700 mb-4">
                      Generated Article
                    </h4>

                    <div className="grid">
                      {editArticle ? (
                        <textarea
                          rows="10"
                          className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                          disabled={saveEditedArticle}
                          value={editedArticle}
                          onChange={(e) => setEditedArticle(e.target.value)}
                        />
                      ) : (
                        <textarea
                          rows="10"
                          className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
                          disabled={sectionIsGenerating}
                          value={
                            Array.isArray(articleSections)
                              ? articleSections.join("\n")
                              : articleSections || ""
                          }
                          readOnly
                        />
                      )}

                      <div className="ml-auto flex gap-2 mt-4">
                        {!editArticle && (
                          <>
                            <button
                              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                              onClick={handleEditArticle}
                            >
                              Edit
                            </button>
                            <button
                              disabled={sectionIsGenerating}
                              className="px-4 py-2 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
                              style={{ backgroundColor: "#3478F6" }}
                              onClick={handleSaveGdrive}
                            >
                              Save to Google Drive
                            </button>
                          </>
                        )}
                        {editArticle && (
                          <>
                            <button
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                              onClick={handleSaveEditedArticle}
                              disabled={saveEditedArticle}
                            >
                              {saveEditedArticle ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                              onClick={handleCancelEditedArticle}
                              disabled={saveEditedArticle}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {/* ...existing Generate/Save/Save to GDrive buttons... */}
                      </div>
                      {sectionIsGenerating && <Loader />}
                    </div>
                  </div>

                  {/* New Table Section - Renders only if articledataUpdated has items */}

                  <div>
                    {/* Other parts of your component */}

                    {/* Button to show/hide the Density Table */}
                    <button
                      onClick={toggleTableVisibility}
                      className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      {showPreviousArticlesTable
                        ? "Hide Density Table"
                        : "Show Density Table"}
                    </button>

                    {/* Conditional rendering for the table section */}
                    {showPreviousArticlesTable && (
                      <div className="md:w-full w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                        <h4 className="text-lg font-semibold text-black-700 mb-4">
                          Previous Articles
                        </h4>

                        {density && typeof density === "object" && (
                          <div className="mt-4">
                            <h5 className="text-md font-bold mb-2">
                              Keyword Density Table
                            </h5>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Keyword
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Count
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Density
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Percentage
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(density).map(
                                  ([keyword, values], index) => (
                                    <tr key={index}>
                                      <td className="px-6 py-4 text-sm text-gray-900">
                                        {keyword}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        {values[0]}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        {parseFloat(values[1]).toFixed(4)}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        {parseFloat(values[2]).toFixed(2)}%
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
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

{
  /* {articledata.length > 0 ? (
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
                    )} */
}

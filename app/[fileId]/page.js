"use client";
import { useEffect, useState, useRef } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function FileId() {
  const { updateProjectData } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [url, setUrl] = useState([]);
  const [rowStatuses, setRowStatuses] = useState([]);
  const { fileId } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const hasInsertedRef = useRef(false);

  const insertFileDetails = async (
    sheetData,
    keywordsArray,
    competitorArray
  ) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from("file_details")
        .select("id")
        .eq("fileId", fileId)
        .eq("row", true);

      if (checkError) throw new Error(`Check error: ${checkError.message}`);
      if (existingData.length > 0) {
        console.log("ℹ️ Data already exists for fileId:", fileId);
        hasInsertedRef.current = true;
        return;
      }

      const { error } = await supabase.from("file_details").insert([
        {
          content: JSON.stringify(sheetData || []),
          keywords: JSON.stringify(keywordsArray || []),
          url: JSON.stringify(competitorArray || []),
          row: true,
          fileId,
        },
      ]);

      if (error) throw new Error(`Insert error: ${error.message}`);
      console.log("✅ Inserted file details for fileId:", fileId);
      hasInsertedRef.current = true;
    } catch (error) {
      console.error("❌ insertFileDetails error:", error.message);
      setApiError(error.message);
    }
  };

  const fetchFromSupabase = async () => {
    setIsLoading(true);
    try {
      // Fetch main file details (row = true)
      const { data: mainData, error: mainError } = await supabase
        .from("file_details")
        .select("keywords, content, url")
        .eq("fileId", fileId)
        .eq("row", true);

      if (mainError)
        throw new Error(`Supabase fetch error: ${mainError.message}`);

      let parsedKeywords = [];
      let parsedUrls = [];

      if (mainData && mainData.length > 0) {
        parsedKeywords = JSON.parse(mainData[0].keywords || "[]");
        parsedUrls = JSON.parse(mainData[0].url || "[]");
      } else {
        // Fallback to cached data or spreadsheet API
        const cachedData = localStorage.getItem(`spreadsheet_${fileId}`);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          parsedKeywords = parsedData.keywords || [];
          parsedUrls = parsedData.competitors || [];

          if (!hasInsertedRef.current) {
            await insertFileDetails(
              parsedData.full_content,
              parsedData.keywords,
              parsedData.competitors
            );
          }
        } else {
          const response = await fetch(`/api/read-spreadsheet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_id: fileId }),
          });

          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const spreadsheetData = await response.json();
          const sheetData = spreadsheetData.full_content?.Sheet1 || [];
          const keywordsArray = sheetData
            .map((row) => row.KEYWORDS)
            .filter(Boolean);
          const competitorArray = sheetData
            .map((row) => row.COMPETITORS)
            .filter(Boolean);

          parsedKeywords = keywordsArray;
          parsedUrls = competitorArray;

          localStorage.setItem(
            `spreadsheet_${fileId}`,
            JSON.stringify(spreadsheetData)
          );

          if (!hasInsertedRef.current) {
            await insertFileDetails(sheetData, keywordsArray, competitorArray);
          }
        }
      }

      // Fetch row-specific statuses (row = false)
      const { data: rowData, error: rowError } = await supabase
        .from("file_details")
        .select("keywords, status, row_index")
        .eq("fileId", fileId)
        .eq("row", false)
        .order("row_index", { ascending: true });

      if (
        rowError &&
        !rowError.message.includes(
          "column file_details.row_index does not exist"
        )
      ) {
        throw new Error(`Row status fetch error: ${rowError.message}`);
      }

      // Initialize rowStatuses based on Supabase status
      const initialStatuses = new Array(parsedKeywords.length).fill("loading");
      if (rowData && rowData.length > 0) {
        rowData.forEach((row) => {
          const index = row.row_index - 1;
          if (index >= 0 && index < parsedKeywords.length) {
            initialStatuses[index] =
              row.status === "processed" ? "success" : "loading";
          }
        });
      }

      setKeywords(parsedKeywords);
      setUrl(parsedUrls);
      setRowStatuses(initialStatuses);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const callMainAgent = async (userId, keyword, index, currentUrl) => {
    try {
      // Insert initial record with status "processing started"
      const { error: insertError } = await supabase
        .from("file_details")
        .insert([
          {
            fileId,
            keywords: JSON.stringify([keyword]),
            status: "processing started",
            row: false,
            row_index: index + 1,
          },
        ]);

      if (insertError)
        throw new Error(`Insert row error: ${insertError.message}`);

      const payload = {
        rows_content: [
          {
            user_id: `${userId}_${index + 1}`,
            primary_keyword: keyword,
            URLs: currentUrl,
          },
        ],
      };

      const response = await fetch("/api/call-main-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setRowStatuses((prev) =>
        prev.map((status, i) =>
          i === index
            ? response.status === 200
              ? "success"
              : "disabled"
            : status
        )
      );

      if (response.status === 200) {
        // Update status to "processed" on success
        const { error: updateError } = await supabase
          .from("file_details")
          .update({ status: "processed" })
          .eq("fileId", userId)
          .eq("row_index", index + 1)
          .eq("row", false);

        if (updateError)
          throw new Error(`Update status error: ${updateError.message}`);
      }

      const data = await response.json();
      console.log(`✅ Row ${index + 1} response:`, data);
    } catch (error) {
      setRowStatuses((prev) =>
        prev.map((status, i) => (i === index ? "disabled" : status))
      );
      setApiError(error.message);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (fileId) {
      hasInsertedRef.current = false;
      fetchFromSupabase();
    }
    return () => {
      hasInsertedRef.current = false;
    };
  }, [fileId]);

  // Process rows only when keywords and url are both available
  useEffect(() => {
    const processRows = async () => {
      for (let index = 0; index < keywords.length; index++) {
        const keyword = keywords[index];
        const currentUrl = url[index] || "";
        if (keyword && rowStatuses[index] !== "success") {
          try {
            // Check status in Supabase
            const { data, error } = await supabase
              .from("file_details")
              .select("status")
              .eq("fileId", fileId)
              .eq("row_index", index + 1)
              .eq("row", false)
              .single();

            if (error && error.code !== "PGRST116") {
              if (
                error.message.includes(
                  "column file_details.row_index does not exist"
                )
              ) {
                console.warn(
                  "⚠️ Supabase schema error: 'row_index' column missing in file_details table. " +
                    "Please add it using: ALTER TABLE file_details ADD COLUMN IF NOT EXISTS row_index INTEGER;"
                );
                await callMainAgent(fileId, keyword, index, currentUrl);
              } else {
                setApiError(`Error checking status: ${error.message}`);
                setRowStatuses((prev) =>
                  prev.map((status, i) => (i === index ? "disabled" : status))
                );
              }
              continue;
            }

            if (data && data.status === "processed") {
              setRowStatuses((prev) =>
                prev.map((status, i) => (i === index ? "success" : status))
              );
              console.log(`ℹ️ Skipping processed row ${index + 1}: ${keyword}`);
              continue;
            }

            await callMainAgent(fileId, keyword, index, currentUrl);
          } catch (error) {
            setApiError(`Unexpected error checking status: ${error.message}`);
            setRowStatuses((prev) =>
              prev.map((status, i) => (i === index ? "disabled" : status))
            );
          }
        }
      }
    };

    if (keywords.length && url.length) {
      processRows();
    }
  }, [keywords, url, rowStatuses]);

  return (
    <div className="container">
      <main className="main-content step-component">
        <h3 className="text-xl font-semibold mb-4 text-blue-500 pb-8">
          2. Rows inside your spreadsheet
        </h3>

        {apiError && <div className="mt-2 text-red-500">Error: {apiError}</div>}
        {isLoading && <Loader />}

        <div className="flex flex-col gap-2">
          <div className="flex gap-8 items-center">
            <div className="font-bold">Rows</div>
            <div className="font-bold ml-auto flex items-center justify-center w-20">
              Status
            </div>
            <div className="w-16" />
          </div>

          {keywords.map((keyword, index) => (
            <div
              key={index}
              className="border-b border-[#eceef1] flex gap-8 items-center py-2"
            >
              <div className="flex-1">{keyword}</div>
              <div className="flex items-center justify-center w-20">
                {rowStatuses[index] === "loading" && (
                  <Loader className="loader-sm" />
                )}
                {rowStatuses[index] === "success" && (
                  <span className="text-green-500">✔</span>
                )}
                {rowStatuses[index] === "disabled" && (
                  <span className="text-gray-500">Disabled</span>
                )}
              </div>
              <div className="w-16">
                <button
                  disabled={rowStatuses[index] === "loading"}
                  className="redirect-btn"
                  onClick={() => {
                    updateProjectData({ activeModalTab: "Logs" });
                    router.push(`/${fileId}/${index + 1}`);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

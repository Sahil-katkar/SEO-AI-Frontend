"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function FileId() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [status, setStatus] = useState("loading"); // Tracks API status: "loading", "disabled", "success"
  const [rowStatuses, setRowStatuses] = useState([]); // Array to track status per row
  const params = useParams();
  const fileId = params.fileId;
  const router = useRouter();
  const user_id = fileId;
  console.log("fileID", fileId);

  // console.log
  useEffect(() => {
    const readSpreadSheet = async (fileId) => {
      const cachedData = localStorage.getItem(`spreadsheet_${fileId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setKeywords(parsedData.keywords);
        // return;
        setRowStatuses(new Array(parsedData.keywords.length).fill("loading"));
        return parsedData.keywords;
      }

      setIsLoading(true);
      const body = { file_id: fileId };
      try {
        const readSpreadsheetData = await fetch(`/api/read-spreadsheet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const readSpreadsheetData1 = await readSpreadsheetData.json();
        console.log("readSpreadsheetData1", readSpreadsheetData1);

        setKeywords(readSpreadsheetData1.keywords);
        setRowStatuses(
          new Array(readSpreadsheetData1.keywords.length).fill("loading")
        );
        localStorage.setItem(
          `spreadsheet_${fileId}`,
          JSON.stringify(readSpreadsheetData1)
        );
      } catch (error) {
        setApiError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const call_main_agent = async (user_id, keyword, index) => {
      const payload = {
        rows_content: [{ user_id: `${user_id}_${index + 1}`, keyword }],
      };
      console.log("payload datd", payload);

      try {
        const gdriveResponse = await fetch("/api/call-main-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setRowStatuses((prev) =>
          prev.map((status, i) =>
            i === index
              ? gdriveResponse.status === 200
                ? "success"
                : "disabled"
              : status
          )
        );

        const gdriveDetails = await gdriveResponse.json();
        // console.log("gdriveDetails", gdriveDetails);
        console.log(`Row ${index + 1} response:`, gdriveDetails);
      } catch (error) {
        // setStatus("disabled");
        setRowStatuses((prev) =>
          prev.map((status, i) => (i === index ? "disabled" : status))
        );
        setApiError(error.message);
      }
    };

    // readSpreadSheet(fileId);
    // call_main_agent(user_id);
    const processRowsSequentially = async () => {
      const keywords = await readSpreadSheet(fileId);
      for (let index = 0; index < keywords.length; index++) {
        await call_main_agent(user_id, keywords[index], index);
      }
    };

    processRowsSequentially();
  }, [fileId]);

  return (
    <div className="container">
      <main className="main-content step-component">
        <h3 className="text-xl font-semibold mb-4 text-blue-500 pb-8">
          2. Rows inside your spreadsheet
        </h3>

        <div className="input-section">{/* <h4>Rows:</h4> */}</div>

        {apiError && <div className="mt-2 text-red-500">Error: {apiError}</div>}

        {isLoading && <Loader />}

        <div className="flex flex-col gap-[8px]">
          <div className="flex gap-[30px] items-center">
            <div className="font-bold">Rows</div>
            <div className="font-bold ml-auto flex items-center justify-center max-w-[80px] w-[100%]">
              Status
            </div>
            <div className="invisible">
              <button className="redirect-btn">View</button>
            </div>
          </div>
          {keywords &&
            keywords.map((eachKeyword, index) => (
              <div
                key={index}
                className="border-b-[1px] border-[#eceef1] flex gap-[30px] items-center py-[8px]"
              >
                <div>{eachKeyword}</div>
                <div className="ml-auto flex items-center justify-center max-w-[80px] w-[100%]">
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
                <div>
                  <button
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

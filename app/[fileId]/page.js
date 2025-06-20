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
  const params = useParams();
  const fileId = params.fileId;
  const router = useRouter();
  const user_id = "1122";

  // console.log
  useEffect(() => {
    const readSpreadSheet = async (fileId) => {
      const cachedData = localStorage.getItem(`spreadsheet_${fileId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setKeywords(parsedData.keywords);
        return;
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
        setKeywords(readSpreadsheetData1.keywords);
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

    const call_main_agent = async (user_id) => {
      const payload = {
        rows_content: [{ user_id: user_id }],
      };
      try {
        const gdriveResponse = await fetch("/api/call-main-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (gdriveResponse.status === 200) {
          setStatus("success");
        } else {
          setStatus("disabled");
        }

        const gdriveDetails = await gdriveResponse.json();
        console.log("gdriveDetails", gdriveDetails);
      } catch (error) {
        setStatus("disabled");
        setApiError(error.message);
      }
    };

    readSpreadSheet(fileId);
    call_main_agent(user_id);
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
                  {status === "loading" && <Loader className="loader-sm" />}
                  {status === "success" && (
                    <span className="text-green-500">✔</span>
                  )}
                  {status === "disabled" && (
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

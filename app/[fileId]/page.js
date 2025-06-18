"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function FileId() {
  //   const { projectData, updateProjectData, setActiveStep, STEPS } =
  //     useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const params = useParams();
  const fileId = params.fileId;

  useEffect(() => {
    const readSpreadSheet = async (fileId) => {
      // Check if we have cached data for this fileId
      const cachedData = localStorage.getItem(`spreadsheet_${fileId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setKeywords(parsedData.keywords);
        return;
      }

      setIsLoading(true);
      const body = {
        file_id: fileId,
      };
      const readSpreadsheetData = await fetch(`/api/read-spreadsheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const readSpreadsheetData1 = await readSpreadsheetData.json();
      setKeywords(readSpreadsheetData1.keywords);
      // Cache the data
      localStorage.setItem(
        `spreadsheet_${fileId}`,
        JSON.stringify(readSpreadsheetData1)
      );
      setIsLoading(false);
      console.log("readSpreadsheetData1", readSpreadsheetData1);
    };
    readSpreadSheet(fileId);
  }, [fileId]);

  //   const ActiveStepComponent =
  //     stepComponents[activeStep] || (() => <div>Step not found</div>);

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
            keywords.map((eachKeyword, index) => {
              return (
                <>
                  <div
                    key={index}
                    className="border-b-[1px] border-[#eceef1] flex gap-[30px] items-center py-[8px]"
                  >
                    <div>{eachKeyword}</div>
                    <div className="ml-auto flex items-center justify-center max-w-[80px] w-[100%]">
                      <Loader className={"loader-sm"} />
                    </div>
                    <div className="">
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
                </>
              );
            })}
        </div>
      </main>
    </div>
  );
}

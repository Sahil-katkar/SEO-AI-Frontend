"use client";

import Article from "@/components/Article";
import CitableSummary from "@/components/CitableSummary";
import Loader from "@/components/common/Loader";
import Outline from "@/components/Outline";
import StatusHeading from "@/components/StatusHeading";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ToastContainer } from "react-toastify";

export default function ContentPage({
  lsiKeywordsApproveResponseData,
  row_id,
  index,
  newOutlineResponseData,
  citableSummaryResponseData,
  updatedArticleResponseData,
}) {
  const { projectData, updateProjectData } = useAppContext();
  //   const newOutlineResponseDataJson = JSON.parse(newOutlineResponseData);
  //   const articleOutline = newOutlineResponseDataJson?.article_outline_data;
  //   const articleH2Count = newOutlineResponseDataJson?.h2_count;
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

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

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
                <Outline
                  row_id={row_id}
                  newOutlineResponseData={newOutlineResponseData}
                  activeModalTab={projectData.activeModalTab}
                />
              </div>
              <div
                className={`${
                  projectData.activeModalTab === "Citable Summary"
                    ? "block"
                    : "hidden"
                }`}
              >
                <CitableSummary
                  row_id={row_id}
                  citableSummaryResponseData={citableSummaryResponseData}
                  activeModalTab={projectData.activeModalTab}
                />
              </div>
              <div
                className={`${
                  projectData.activeModalTab === "Article" ? "block" : "hidden"
                }`}
              >
                <Article
                  row_id={row_id}
                  newOutlineResponseData={newOutlineResponseData}
                  updatedArticleResponseData={updatedArticleResponseData}
                  //   articleH2Count={articleH2Count}
                  activeModalTab={projectData.activeModalTab}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

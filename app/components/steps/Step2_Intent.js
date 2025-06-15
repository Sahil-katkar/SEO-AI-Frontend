"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step2_Intent() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [apiError, setApiError] = useState(null);
  const [intentContent, setIntentContent] = useState(
    localStorage.getItem("intent") || ""
  );
  const [articleContent, setArticleContent] = useState(null);
  const [outlineContent, setOutlineContent] = useState(null);
  const [documentIds, setDocumentIds] = useState({}); // Store document IDs

  const handleGenerateLSI = async () => {
    if (!projectData.primaryKeyword) {
      alert("Please enter a primary keyword.");
      return;
    }
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockLSI = [
        { text: `what is ${projectData.primaryKeyword}`, checked: true },
        { text: `${projectData.primaryKeyword} benefits`, checked: true },
        { text: `best ${projectData.primaryKeyword} reviews`, checked: false },
        { text: `how to use ${projectData.primaryKeyword}`, checked: true },
      ];
      updateProjectData({ lsiKeywords: mockLSI });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchViewArticle = async () => {
    try {
      const res = await fetch("/api/view_article", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${e.message}`);
      }

      if (!Array.isArray(data)) {
        throw new Error("Expected an array response from /api/view_article");
      }

      const newDocumentIds = {};
      data.forEach((item) => {
        let parsedContent = item.content || "";
        parsedContent = parsedContent.replace(/^\ufeff/, ""); // Remove BOM if present

        if (item.name === "Intent") {
          try {
            const parsedIntent = JSON.parse(parsedContent);
            setIntentContent(JSON.stringify(parsedIntent, null, 2)); // Stringify for display
            localStorage.setItem("editedintent", JSON.stringify(parsedIntent));
            updateProjectData({ intent: parsedIntent });
            newDocumentIds["Intent"] = item.id;
          } catch (e) {
            console.error(`Failed to parse JSON for Intent:`, e);
            setIntentContent(`Error: Invalid JSON - ${parsedContent}`);
            localStorage.setItem("editedintent", parsedContent);
            newDocumentIds["Intent"] = item.id;
          }
        } else if (item.name === "Outline") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setOutlineContent(parsedContent);
          localStorage.setItem("editedoutline", parsedContent);
          newDocumentIds["Outline"] = item.id;
        } else if (item.name === "Article") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setArticleContent(parsedContent);
          localStorage.setItem("editedarticle", parsedContent);
          newDocumentIds["Article"] = item.id;
        }
      });

      setDocumentIds(newDocumentIds);
    } catch (error) {
      setApiError(error.message);
      console.error("fetchViewArticle error:", error);
    }
  };

  const handleEdit = async () => {
    if (!intentContent.trim()) {
      alert("Please enter an intent to edit.");
      return;
    }

    setIsLoading(true);
    const payload = {
      users_id: "1122",
      Mainkeyword: projectData.primaryKeyword || "contentful",
      edit_content: {
        intent: intentContent,
      },
    };

    try {
      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      await fetchViewArticle();
    } catch (error) {
      setApiError(error.message);
      console.error("handleEdit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomKeyword = () => {
    if (customKeywordInput.trim() === "") return;
    updateProjectData({
      customKeywords: [
        ...projectData.customKeywords,
        { text: customKeywordInput.trim(), checked: true },
      ],
    });
    setCustomKeywordInput("");
  };

  const toggleLSIKeyword = (index) => {
    updateProjectData({
      lsiKeywords: projectData.lsiKeywords.map((kw, i) =>
        i === index ? { ...kw, checked: !kw.checked } : kw
      ),
    });
  };

  const toggleCustomKeyword = (index) => {
    updateProjectData({
      customKeywords: projectData.customKeywords.map((kw, i) =>
        i === index ? { ...kw, checked: !kw.checked } : kw
      ),
    });
  };

  return (
    <div className="step-component">
      <h3>2. Primary Keyword & Intent</h3>

      <div className="input-section">
        <h4>Intent:</h4>
        <textarea
          id="primaryIntent"
          value={intentContent}
          onChange={(e) => setIntentContent(e.target.value)}
          placeholder="Enter intent"
          rows={5}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleEdit}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          Save & Generate
        </button>
      </div>

      {apiError && <div className="mt-2 text-red-500">Error: {apiError}</div>}

      {isLoading && <Loader />}

      {(intentContent || articleContent || outlineContent) && (
        <div className="generated-content mt-6">
          <h4>Generated Content:</h4>

          {intentContent && (
            <div className="mb-4">
              <h5>Intent:</h5>
              <pre className="bg-gray-100 p-4 rounded">{intentContent}</pre>
            </div>
          )}

          {articleContent && (
            <div className="mb-4">
              <h5>Article:</h5>
              <pre className="bg-gray-100 p-4 rounded">{articleContent}</pre>
            </div>
          )}

          {outlineContent && (
            <div className="mb-4">
              <h5>Outline:</h5>
              <pre className="bg-gray-100 p-4 rounded">{outlineContent}</pre>
            </div>
          )}
        </div>
      )}

      <div className="navigation mt-6">
        <button
          onClick={() => setActiveStep(STEPS[2].id)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Next: Outline Creation
        </button>
      </div>
    </div>
  );
}

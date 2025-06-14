"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step2_Intent() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(null);
  const [intentContent, setIntentContent] = useState(null);
  const [outlineContent, setOutlineContent] = useState(null);
  const [articleContent, setArticleContent] = useState(null);
  const [documentIds, setDocumentIds] = useState({});
  const intent = localStorage.getItem("intent");

  const handleViewArticle = async () => {
    setArticleLoading(true);
    setArticleError(null);
    setIntentContent(null);
    setOutlineContent(null);
    setArticleContent(null);
    setDocumentIds({});
    localStorage.removeItem("intent");
    localStorage.removeItem("outline");
    localStorage.removeItem("article");

    try {
      const response = await fetch("/api/view_article", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const rawText = await response.text();
      console.log("Raw response in handleViewArticle:", rawText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(rawText);
        } catch {
          throw new Error(
            `Error fetching article: ${response.status} ${response.statusText}`
          );
        }
        throw new Error(
          errorData.detail || `Error fetching article: ${response.status}`
        );
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${e.message}`);
      }

      const newDocumentIds = {};
      data.forEach((item) => {
        let parsedContent = item.content || "";
        parsedContent = parsedContent.replace(/^\ufeff/, "");

        if (item.name === "Intent") {
          try {
            parsedContent = JSON.parse(parsedContent);
            setIntentContent(parsedContent);
            localStorage.setItem("intent", JSON.stringify(parsedContent));
            newDocumentIds["Intent"] = item.id;
          } catch (e) {
            console.error(`Failed to parse JSON for ${item.name}:`, e);
            parsedContent = {
              error: `Invalid JSON: ${e.message}`,
              raw: parsedContent,
            };
            setIntentContent(parsedContent);
            localStorage.setItem("intent", JSON.stringify(parsedContent));
            newDocumentIds["Intent"] = item.id;
          }
        } else if (item.name === "Outline") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setOutlineContent(parsedContent);
          localStorage.setItem("outline", parsedContent);
          newDocumentIds["Outline"] = item.id;
        } else if (item.name === "Article") {
          parsedContent = parsedContent.replace(/^```markdown\n|\n```$/g, "");
          setArticleContent(parsedContent);
          localStorage.setItem("article", parsedContent);
          newDocumentIds["Article"] = item.id;
        }
      });

      setDocumentIds(newDocumentIds);
      toast.success("Article data fetched and stored successfully!");
    } catch (e) {
      console.error("Error fetching article:", e);
      setArticleError(
        `${e.message}${
          e.rawResponse ? ` (Raw: ${e.rawResponse.slice(0, 100)}...)` : ""
        }`
      );
      toast.error(`Article Fetch Error: ${e.message}`);
    } finally {
      setArticleLoading(false);
    }
  };

  const handleGenerateLSI = async () => {
    if (!projectData.primaryKeyword) {
      alert("Please enter a primary keyword.");
      return;
    }
    setIsLoading(true);

    // Simulate API call for LSI keywords
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const mockLSI = [
      { text: `what is ${projectData.primaryKeyword}`, checked: true },
      { text: `${projectData.primaryKeyword} benefits`, checked: true },
      { text: `best ${projectData.primaryKeyword} reviews`, checked: false },
      { text: `how to use ${projectData.primaryKeyword}`, checked: true },
    ];
    updateProjectData({ lsiKeywords: mockLSI });

    setIsLoading(false);
  };

  const handleEdit = async () => {
    const payload = {
      users_id: "1122",
      Mainkeyword: "contentful",
      edit_content: {
        intent: JSON.stringify({
          intent: intent,
        }),
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
      } else {
        const data = await res.json();
        console.log("Response from /api/contentEdit:", data);
      }
    } catch (error) {
      console.error("API Proxy Error:", error);
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

  // useEffect(() => {
  //   if (
  //     projectData.primaryKeyword !== "" &&
  //     projectData.lsiKeywords.length === 0
  //   ) {
  //     handleGenerateLSI();
  //   }
  // }, [projectData]);

  return (
    <div className="step-component">
      <h3>2. Primary Keyword &amp; Intent</h3>

      <h4 htmlFor="primaryKeyword">Intent:</h4>
      <textarea
        id="primaryIntent"
        value={intent}
        onChange={(e) => {
          updateProjectData({ primaryIntent: e.target.value });
          localStorage.setItem("intentEdited", e.target.value); // if you want to persist it
        }}
        placeholder="Enter intent"
        rows="5"
      />

      {isLoading && <Loader />}

      <button onClick={() => setActiveStep(STEPS[2].id)}>
        Next: Outline Creation
      </button>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
}

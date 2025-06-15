"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step6_ArticleView() {
  const { projectData, updateProjectData } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateArticle = async () => {
    setIsLoading(true);
    // Simulate API call for article generation
    // This would use ALL projectData collected so far
    console.log("Generating article with data:", projectData);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate longer generation

    let mockArticle = `<h1>${
      projectData.outline.split("\n")[0].replace("H1: ", "") ||
      "Generated Article Title"
    }</h1>\n\n`;
    mockArticle += `<p>This article discusses ${
      projectData.primaryKeyword || "the topic"
    } targeting a ${projectData.targetAudience || "general"} audience with an ${
      projectData.primaryIntent || "informational"
    } intent. The desired tone is ${
      projectData.toneOfVoice || "neutral"
    }.</p>\n\n`;

    const outlineLines = projectData.outline.split("\n").slice(1); // Skip H1
    outlineLines.forEach((line) => {
      if (line.startsWith("H2:")) {
        mockArticle += `<h2>${line.replace(
          "H2: ",
          ""
        )}</h2>\n<p>Detailed content for ${line
          .replace("H2: ", "")
          .toLowerCase()}...</p>\n`;
      } else if (line.startsWith("  H3:")) {
        mockArticle += `<h3>${line.replace(
          "  H3: ",
          ""
        )}</h3>\n<p>Specific points about ${line
          .replace("  H3: ", "")
          .toLowerCase()}...</p>\n`;
      }
    });

    if (projectData.includeCTA && projectData.ctaText) {
      mockArticle += `\n\n<p><strong>${projectData.ctaText}</strong></p>`;
    }
    mockArticle += `\n\n<p><em>(This is a mock generated article. Word count approximately ${projectData.wordCount} words.)</em></p>`;

    updateProjectData({ generatedArticle: mockArticle });
    setIsLoading(false);
  };

  const handleCopyToClipboard = () => {
    // Create a temporary textarea element to copy HTML as plain text
    const tempEl = document.createElement("div");
    tempEl.innerHTML = projectData.generatedArticle;
    navigator.clipboard
      .writeText(tempEl.innerText || tempEl.textContent)
      .then(() => alert("Article content copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err));
  };

  const handleDownload = (format = "txt") => {
    const tempEl = document.createElement("div");
    tempEl.innerHTML = projectData.generatedArticle;
    const textContent = tempEl.innerText || tempEl.textContent || "";
    const blob = new Blob([textContent], {
      type: `text/${format === "md" ? "markdown" : "plain"};charset=utf-8`,
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${projectData.projectName || "article"}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="step-component">
      <h3>6. Draft Generation & Review</h3>
      <button onClick={handleGenerateArticle} disabled={isLoading}>
        {isLoading ? "Generating Article..." : "Generate Article Draft"}
      </button>

      {isLoading && <Loader />}
      <textarea
        id="primaryIntent"
        value={localStorage.getItem("article")}
        onChange={(e) => updateProjectData({ primaryIntent: e.target.value })}
        placeholder="Enter intent"
        rows="5"
      ></textarea>

      <div>
        <h3>Updated Article: </h3>
        <button onClick={handleGenerateArticle} disabled={isLoading}>
          {isLoading ? "Generating Article..." : "Generate Article Draft"}
        </button>

        {isLoading && <Loader />}
        <textarea
          id="primaryIntent"
          value={localStorage.getItem("editedarticle")}
          onChange={(e) => updateProjectData({ primaryIntent: e.target.value })}
          placeholder="Enter intent"
          rows="5"
        ></textarea>
      </div>

      {/* {projectData.generatedArticle && !isLoading && (
        <div style={{ marginTop: "20px" }}>
          <h4>Generated Article:</h4>
          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              borderRadius: "4px",
              background: "#f9f9f9",
              minHeight: "200px",
            }}
          ></div>

          <button
            onClick={handleCopyToClipboard}
            className="secondary"
            style={{ marginTop: "15px" }}
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => handleDownload("txt")}
            className="secondary"
            style={{ marginTop: "15px" }}
          >
            Download .txt
          </button>
          <button
            onClick={() => handleDownload("md")}
            className="secondary"
            style={{ marginTop: "15px" }}
          >
            Download .md
          </button>
        </div>
      )} */}
    </div>
  );
}

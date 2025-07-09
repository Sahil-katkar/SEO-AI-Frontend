import React from "react";
import Loader from "./common/Loader";

export default function CompetitorAnalysis({
  compAnalysis,
  generateAnalysis,
  isGeneratingAnalysis,
  editCompAnalysis,
  index,
  handleEditCompAnalysis,
  handleSaveCompAnalysis,
  handleCancelCompAnalysis,
  editedCompAnalysis,
  setEditedCompAnalysis,
}) {
  console.log("index", index);

  return (
    <div className="">
      <div className="mb-[8px] flex justify-between items-center">
        <p className="font-bold text-[24px] ">Competitor Analysis</p>
        <div className="flex gap-[8px]">
          {!compAnalysis && (
            <button onClick={generateAnalysis} disabled={isGeneratingAnalysis}>
              {isGeneratingAnalysis ? (
                <Loader size={20} />
              ) : (
                "Generate Analysis"
              )}
            </button>
          )}
          {compAnalysis && (
            <>
              {!editCompAnalysis[`comp${index + 1}`] && (
                <button
                  onClick={() => {
                    handleEditCompAnalysis(index + 1);
                  }}
                >
                  Edit
                </button>
              )}
              {editCompAnalysis[`comp${index + 1}`] && (
                <>
                  <button onClick={() => handleSaveCompAnalysis(index + 1)}>
                    Save
                  </button>
                  <button onClick={() => handleCancelCompAnalysis(index + 1)}>
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <textarea
        disabled={!editCompAnalysis[`comp${index + 1}`]}
        className="focus:outline-[#1abc9c] focus:outline-2 !mb-0"
        rows="10"
        value={
          editCompAnalysis[`comp${index + 1}`]
            ? editedCompAnalysis ?? ""
            : compAnalysis ?? ""
        }
        onChange={(e) => setEditedCompAnalysis(e.target.value)}
      />
    </div>
  );
}

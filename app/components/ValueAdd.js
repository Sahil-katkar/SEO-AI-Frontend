import React from "react";
import Loader from "./common/Loader";

export default function ValueAdd({
  valueAdd,
  generateValueAdd,
  compAnalysis,
  isGeneratingValueAdd,
  editValueAdd,
  index,
  handleEditValueAdd,
  handleSaveValueAdd,
  handleCancelValueAdd,
  editedValueAdd,
  setEditedValueAdd,
}) {
  return (
    <div>
      <div className="mb-[8px] flex justify-between items-center">
        <p className="font-bold text-[24px]">Value Add</p>
        <div className="flex gap-[8px]">
          {!valueAdd && (
            <button
              onClick={generateValueAdd}
              disabled={!compAnalysis || isGeneratingValueAdd}
            >
              {isGeneratingValueAdd ? (
                <Loader size={20} />
              ) : (
                "Generate Value Add"
              )}
            </button>
          )}

          {!valueAdd ||
            (!editValueAdd[`comp${index + 1}`] && (
              <button
                onClick={() => {
                  handleEditValueAdd(index + 1);
                }}
                disabled={!compAnalysis}
              >
                Edit
              </button>
            ))}
          {editValueAdd[`comp${index + 1}`] && (
            <>
              <button onClick={() => handleSaveValueAdd(index + 1)}>
                Save
              </button>
              <button onClick={() => handleCancelValueAdd(index + 1)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        disabled={!editValueAdd[`comp${index + 1}`]}
        className="focus:outline-[#1abc9c] focus:outline-2"
        rows="10"
        value={
          editValueAdd[`comp${index + 1}`]
            ? editedValueAdd ?? ""
            : valueAdd ?? ""
        }
        onChange={(e) => setEditedValueAdd(e.target.value)}
      />
    </div>
  );
}

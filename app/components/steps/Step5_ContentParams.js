'use client';
import { useAppContext } from '@/context/AppContext';

export default function Step5_ContentParams() {
  const { projectData, updateProjectData, setActiveStep, STEPS } = useAppContext();
  const tones = ['Formal', 'Casual', 'Friendly', 'Humorous', 'Authoritative', 'Technical'];
  
  const handleNext = () => {
    // setActiveStep(STEPS[6].id);
  };

  return (
    <div className="step-component">
      <h3>5. Content Generation Parameters</h3>
      <label htmlFor="toneOfVoice">Tone of Voice:</label>
      <select
        id="toneOfVoice"
        value={projectData.toneOfVoice}
        onChange={(e) => updateProjectData({ toneOfVoice: e.target.value })}
      >
        <option value="">Select Tone...</option>
        {tones.map(tone => (
          <option key={tone} value={tone}>{tone}</option>
        ))}
      </select>

      <label htmlFor="wordCount">Approximate Word Count:</label>
      <input
        type="number"
        id="wordCount"
        value={projectData.wordCount}
        onChange={(e) => updateProjectData({ wordCount: parseInt(e.target.value) || 0 })}
        min="100"
        step="50"
      />

      <div>
        <input
          type="checkbox"
          id="includeCTA"
          checked={projectData.includeCTA}
          onChange={(e) => updateProjectData({ includeCTA: e.target.checked })}
          style={{width: 'auto', marginRight: '10px'}}
        />
        <label htmlFor="includeCTA">Include Call to Action (CTA)?</label>
      </div>

      {projectData.includeCTA && (
        <>
          <label htmlFor="ctaText">CTA Text:</label>
          <input
            type="text"
            id="ctaText"
            value={projectData.ctaText}
            onChange={(e) => updateProjectData({ ctaText: e.target.value })}
            placeholder="e.g., Sign up for our newsletter!"
          />
        </>
      )}
      <button onClick={handleNext}>Next: Generate Article</button>
    </div>
  );
}
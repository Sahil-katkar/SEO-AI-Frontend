'use client';
import { useAppContext } from '@/context/AppContext';

export default function Step4_Persona() {
  const { projectData, updateProjectData, setActiveStep, STEPS } = useAppContext();
  const audiencePersonas = ['Beginner', 'Intermediate', 'Expert', 'Technical Manager', 'Casual Reader'];
  const intents = ['Informational', 'Navigational', 'Commercial Investigation', 'Transactional'];
  
  const handleNext = () => {
    // Add validation if needed
    // if (!projectData.targetAudience || !projectData.primaryIntent) {
    //   alert("Please select audience and intent.");
    //   return;
    // }
    setActiveStep(STEPS[3].id);
  };

  return (
    <div className="step-component">
      <h3>3. Persona</h3>
      <h4 htmlFor="targetAudience">Select Persona:</h4>
      <select
        id="targetAudience"
        value={projectData.targetAudience}
        onChange={(e) => updateProjectData({ targetAudience: e.target.value })}
      >
        <option value="">Select Persona...</option>
        {audiencePersonas.map(persona => (
          <option key={persona} value={persona}>{persona}</option>
        ))}
      </select>

      {/* <label htmlFor="primaryIntent">Primary Intent:</label>
      <select
        id="primaryIntent"
        value={projectData.primaryIntent}
        onChange={(e) => updateProjectData({ primaryIntent: e.target.value })}
      >
        <option value="">Select Intent...</option>
        {intents.map(intent => (
          <option key={intent} value={intent}>{intent}</option>
        ))}
      </select> */}
      <button onClick={handleNext}>Next: Outline Creation</button>
    </div>
  );
}
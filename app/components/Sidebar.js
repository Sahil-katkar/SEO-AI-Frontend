"use client";

import { useAppContext } from "@/context/AppContext";

export default function Sidebar() {
  const { STEPS, activeStep, setActiveStep } = useAppContext();

  return (
    <aside className="sidebar">
      <h2>SEO AI</h2>
      <ul>
        {STEPS.map((step) => (
          <li
            key={step.id}
            className={activeStep === step.id ? "active" : ""}
            onClick={() => setActiveStep(step.id)}
          >
            {step.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}

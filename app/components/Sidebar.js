"use client";

import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const {
    STEPS,
    // activeStep,
    // setActiveStep
    projectData,
  } = useAppContext();

  const router = useRouter();
  const pathName = usePathname();

  console.log(pathName);
  // localStorage.getItem(`spreadsheet_${fileId}`);

  return (
    <aside className="sidebar">
      <h2 className="font-bold">SEO AI</h2>
      <ul>
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            className={`
              whitespace-nowrap
              ${step.route && pathName === step.route ? "active" : ""}
              `}
            onClick={() => {
              if (step.route === "/") {
                router.push(step.route);
              } else {
                router.push(projectData.fileId);
              }
            }}
          >
            {step.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}

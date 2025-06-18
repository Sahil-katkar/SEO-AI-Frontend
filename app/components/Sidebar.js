"use client";

import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const {
    STEPS,
    // activeStep,
    // setActiveStep
  } = useAppContext();
  const router = useRouter();
  const pathName = usePathname();

  return (
    <aside className="sidebar">
      <h2>SEO AI</h2>
      <ul>
        {STEPS.map((step) => (
          <li
            key={step.id}
            className={`
              ${pathName === "/" && step.id === "step1" ? "active" : ""}
              whitespace-nowrap`}
            onClick={() => {
              // setActiveStep(step.id);
              if (step.route === "/") {
                router.push("/");
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

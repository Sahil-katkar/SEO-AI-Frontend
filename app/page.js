"use client";

import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";

// Dynamically import step components

import Step1_ConnectGDrive from "@/components/steps/Step1_ConnectGDrive";
import Step2_Intent from "@/components/steps/Step2_Intent";
import Step3_OutlineCreation from "@/components/steps/Step3_OutlineCreation";
import Step4_Persona from "@/components/steps/Step4_Persona";
import Step5_ContentParams from "@/components/steps/Step5_ContentParams";
import Step6_ArticleView from "@/components/steps/Step6_ArticleView";
// import { useAppContext } from './context/AppContext';

const stepComponents = {
  step1: Step1_ConnectGDrive,
  step2: Step2_Intent,
  step3: Step3_OutlineCreation,
  // step4: Step4_Persona,
  // step5: Step5_ContentParams,
  step6: Step6_ArticleView,
};

export default function HomePage() {
  const { activeStep } = useAppContext();

  const ActiveStepComponent =
    stepComponents[activeStep] || (() => <div>Step not found</div>);

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <ActiveStepComponent />
      </main>
    </div>
  );
}

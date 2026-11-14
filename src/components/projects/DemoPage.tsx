import { useState } from "react";
import { BuilderExperience } from "@/components/builder/BuilderExperience";
import {
  ensureNorthstarDemoProject,
  NORTHSTAR_DEMO_ID,
  northstarDemoWorkspace,
  projectWorkspaceKey,
} from "@/lib/projects";
import "./projects.css";

/**
 * `/demo` opens the persisted Northstar workspace in the simulator view. Build
 * edits the same saved network, and Back returns to the same simulator.
 */
export default function DemoPage() {
  const [failure] = useState(() => {
    try {
      ensureNorthstarDemoProject();
      return "";
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "The Northstar demo could not be opened on this device.";
    }
  });
  return (
    <BuilderExperience
      storageKey={projectWorkspaceKey(NORTHSTAR_DEMO_ID)}
      initialView="simulate"
      demoProject
      fallbackWorkspace={northstarDemoWorkspace()}
      initialSaveError={
        failure
          ? `${failure} This demo is running without autosave. Export workspace JSON to keep your changes.`
          : undefined
      }
      closeLabel="Projects"
      onClose={() => window.location.assign("/projects")}
    />
  );
}

import { useState } from "react";
import { BuilderExperience } from "@/components/builder/BuilderExperience";
import { Button } from "@/components/ui/button";
import {
  projectWorkspaceKey,
  readProject,
  makeProjectEditable,
  NORTHSTAR_DEMO_ID,
} from "@/lib/projects";
import "./projects.css";

export default function ProjectPage({ id }: { id: string }) {
  const [initial] = useState(() => {
    try {
      const project = id === "device-draft" ? null : readProject(id);
      if (project?.kind === "dataset") makeProjectEditable(id);
      return {
        initialView:
          project?.kind === "dataset"
            ? ("simulate" as const)
            : ("build" as const),
        error: "",
      };
    } catch (error) {
      return {
        initialView: "build" as const,
        error:
          error instanceof Error
            ? error.message
            : "Could not open this project.",
      };
    }
  });
  if (initial.error)
    return (
      <main className="project-not-found">
        <h1>Project unavailable</h1>
        <p role="alert">{initial.error}</p>
        <Button asChild>
          <a href="/projects">Back to projects</a>
        </Button>
      </main>
    );
  return (
    <BuilderExperience
      storageKey={projectWorkspaceKey(id)}
      initialView={initial.initialView}
      demoProject={id === NORTHSTAR_DEMO_ID}
      closeLabel="Projects"
      onClose={() => window.location.assign("/projects")}
    />
  );
}

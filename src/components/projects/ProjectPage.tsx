import { useState } from "react";
import App from "@/App";
import { BuilderExperience } from "@/components/builder/BuilderExperience";
import { Button } from "@/components/ui/button";
import {
  projectWorkspaceKey,
  readProject,
  saveDatasetProject,
} from "@/lib/projects";
import "./projects.css";

export default function ProjectPage({ id }: { id: string }) {
  const [initial] = useState(() => {
    try {
      return {
        project: id === "device-draft" ? null : readProject(id),
        error: "",
      };
    } catch (error) {
      return {
        project: null,
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
  if (initial.project?.kind === "dataset")
    return (
      <App
        projectName={initial.project.name}
        initialProject={initial.project.state}
        onProjectChange={(state) => saveDatasetProject(id, state)}
      />
    );
  return (
    <BuilderExperience
      storageKey={projectWorkspaceKey(id)}
      closeLabel="Projects"
      onClose={() => window.location.assign("/projects")}
    />
  );
}

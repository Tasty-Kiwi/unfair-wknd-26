import { useRef, useState } from "react";
import {
  ArrowRight,
  FilePlus2,
  FolderOpen,
  HardDrive,
  Plus,
  Upload,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  createProject,
  deleteProject,
  listProjects,
  prepareProjectImport,
  projectUrl,
  type ProjectImport,
  type ProjectSummary,
} from "@/lib/projects";
import "./projects.css";

function savedProjects() {
  try {
    return listProjects();
  } catch {
    return {
      projects: [],
      errors: [
        "Browser storage is unavailable. Allow local storage to create and reopen projects. You can still explore the demo.",
      ],
    };
  }
}

export default function ProjectsPage() {
  const [saved, setSaved] = useState(savedProjects);
  const [removing, setRemoving] = useState<ProjectSummary | null>(null);
  const [removeError, setRemoveError] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("import");
  const [name, setName] = useState("");
  const [pending, setPending] = useState<ProjectImport | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const readVersion = useRef(0);

  function resetModal(next: boolean) {
    readVersion.current++;
    setOpen(next);
    setPending(null);
    setFileNames([]);
    setName("");
    setError("");
    setReading(false);
    setMode("import");
  }
  async function readFiles(files: File[]) {
    const version = ++readVersion.current;
    setPending(null);
    setFileNames([]);
    setError("");
    setReading(true);
    try {
      if (files.length > 5 || files.some((file) => file.size > 2_000_000))
        throw new Error(
          "Choose one JSON file or up to five CSV files, each smaller than 2 MB.",
        );
      const result = prepareProjectImport(
        await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            text: await file.text(),
          })),
        ),
      );
      if (version !== readVersion.current) return;
      setPending(result);
      setFileNames(files.map((file) => file.name));
      setName(
        (previous) =>
          previous ||
          (result.kind === "workspace"
            ? result.workspace.document.name
            : result.state.data.name) ||
          "Imported project",
      );
    } catch (caught) {
      if (version === readVersion.current)
        setError(
          caught instanceof Error
            ? caught.message
            : "These files could not be read.",
        );
    } finally {
      if (version === readVersion.current) setReading(false);
    }
  }
  return (
    <div className="projects-page">
      <header className="projects-header">
        <a href="/" className="wordmark" aria-label="Needtrace home">
          <img src="/favicon.svg" width="28" height="28" alt="" />
          Needtrace
        </a>
        <span className="projects-header__section">Projects</span>
        <ThemeToggle />
      </header>
      <main className="projects-main">
        <div className="projects-heading">
          <div>
            <h1>Your projects</h1>
            <p>Model your supply chain. See which orders depend on it.</p>
          </div>
          <Dialog open={open} onOpenChange={resetModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" />
                New project
              </Button>
            </DialogTrigger>
            <DialogContent className="new-project-dialog">
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
                <DialogDescription>
                  Import an existing plan or build a network from scratch.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");
                  if (mode === "import" && !pending) {
                    setError("Choose your JSON or CSV files first.");
                    return;
                  }
                  try {
                    window.location.assign(
                      projectUrl(
                        createProject(
                          name.trim(),
                          mode === "import" ? pending! : undefined,
                        ).id,
                      ),
                    );
                  } catch (caught) {
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Project could not be saved. Check browser storage and try again.",
                    );
                  }
                }}
              >
                <ToggleGroup
                  type="single"
                  value={mode}
                  aria-label="Project starting point"
                  onValueChange={(value) => {
                    if (value) {
                      setMode(value);
                      setError("");
                    }
                  }}
                >
                  <ToggleGroupItem value="import">
                    <Upload data-icon="inline-start" />
                    Import JSON / CSV
                  </ToggleGroupItem>
                  <ToggleGroupItem value="blank">
                    <FilePlus2 data-icon="inline-start" />
                    Start blank
                  </ToggleGroupItem>
                </ToggleGroup>
                {mode === "import" ? (
                  <div className="project-import">
                    <label htmlFor="project-files">Project files</label>
                    <Input
                      id="project-files"
                      type="file"
                      multiple
                      accept=".json,.csv,application/json,text/csv"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (files.length) void readFiles(files);
                        event.target.value = "";
                      }}
                      aria-describedby="project-import-help"
                    />
                    <p id="project-import-help">
                      One workspace or dataset JSON, or up to five CSV tables. 2
                      MB per file.
                    </p>
                    <details>
                      <summary>CSV format and example files</summary>
                      <p>
                        CSV replaces selected tables in the fictional demo.
                        Suppliers, components, alternatives, and omitted tables
                        stay from the demo. Use dataset JSON for a fully
                        independent plan.
                      </p>
                      <div className="project-templates">
                        <a href="/examples/domino-demo.json" download>
                          Dataset JSON
                        </a>
                        <a href="/examples/orders.csv" download>
                          Orders CSV
                        </a>
                        <a href="/examples/inventory.csv" download>
                          Inventory CSV
                        </a>
                        <a href="/examples/products.csv" download>
                          Products CSV
                        </a>
                        <a href="/examples/bom.csv" download>
                          BOM CSV
                        </a>
                        <a href="/examples/deliveries.csv" download>
                          Deliveries CSV
                        </a>
                      </div>
                    </details>
                    {reading && (
                      <p role="status">Reading and validating files…</p>
                    )}
                    {pending && (
                      <div className="project-import-preview" role="status">
                        <strong>{fileNames.join(", ")}</strong>
                        <p>
                          {pending.kind === "workspace"
                            ? `${pending.workspace.document.nodes.length} network items · ${pending.workspace.scenarios.length} saved scenarios`
                            : `${pending.state.data.orders.length} orders · ${pending.state.data.products.length} products`}
                        </p>
                        {pending.kind === "dataset" &&
                          pending.state.provenance.kind === "mixed" && (
                            <p>
                              Mixed demo + imported data. Replaced:{" "}
                              {pending.replacedTables.join(", ")}. Other tables
                              retain fictional demo values
                              {pending.state.retainedProductBoms
                                ? "; existing product BOMs are retained"
                                : ""}
                              .
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="project-blank-help">
                    Start with an empty network, then add suppliers, components,
                    receipts, products, and customer orders.
                  </p>
                )}
                <label htmlFor="project-name">Project name</label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Assembly line supply plan"
                  required
                  maxLength={120}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Could not create project</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="new-project-footer">
                  <p>
                    <HardDrive size={14} aria-hidden="true" />
                    Saved on this device
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      !name.trim() ||
                      (mode === "import" && (!pending || reading))
                    }
                  >
                    Create project
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {saved.errors.map((message, i) => (
          <Alert variant="destructive" key={i}>
            <AlertTitle>Saved project unavailable</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ))}
        <section
          className="project-library"
          aria-labelledby="saved-projects-title"
        >
          <div className="project-section-heading">
            <h2 id="saved-projects-title">
              On this device <span>{saved.projects.length}</span>
            </h2>
            <p>
              <HardDrive size={15} aria-hidden="true" />
              No account needed
            </p>
          </div>
          {saved.projects.length ? (
            <div className="project-grid">
              {saved.projects.map((project) => (
                <div className="project-card" key={project.id}>
                  <a
                    className="project-card__link"
                    href={projectUrl(project.id)}
                  >
                    <FolderOpen size={25} aria-hidden="true" />
                    <h3>{project.name}</h3>
                    <p>{project.detail}</p>
                    <span className="project-card__open">
                      Open {project.kind === "workspace" ? "network" : "plan"}
                      <ArrowRight size={17} aria-hidden="true" />
                    </span>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRemoveError("");
                      setRemoving(project);
                    }}
                  >
                    Remove <span className="sr-only">{project.name}</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="projects-empty">
              <FolderOpen size={30} aria-hidden="true" />
              <div>
                <h3>Your first supply chain starts here.</h3>
                <p>
                  Create a project with your own data, or explore the demo
                  below.
                </p>
              </div>
              <Button variant="outline" onClick={() => resetModal(true)}>
                <Plus data-icon="inline-start" />
                New project
              </Button>
            </div>
          )}
        </section>
        <Dialog
          open={removing !== null}
          onOpenChange={(open) => {
            if (!open) setRemoving(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove project?</DialogTitle>
              <DialogDescription>
                Remove “{removing?.name}” from this browser? Its local data and
                saved scenarios will be deleted. Export JSON first if you want
                to keep a copy.
              </DialogDescription>
            </DialogHeader>
            {removeError && (
              <Alert variant="destructive">
                <AlertTitle>Could not remove project</AlertTitle>
                <AlertDescription>{removeError}</AlertDescription>
              </Alert>
            )}
            <div className="new-project-footer">
              <Button variant="outline" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!removing) return;
                  try {
                    deleteProject(removing.id);
                    setSaved(savedProjects());
                    setRemoving(null);
                  } catch (caught) {
                    setRemoveError(
                      caught instanceof Error
                        ? caught.message
                        : "Check browser storage and try again.",
                    );
                  }
                }}
              >
                Remove project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <section
          className="project-demo"
          id="demo"
          aria-labelledby="demo-project-title"
        >
          <div className="project-demo__visual" aria-hidden="true">
            <Workflow size={38} />
            <span>Supply</span>
            <span>Materials</span>
            <span>Orders</span>
          </div>
          <div className="project-demo__copy">
            <p className="project-demo__label">Fictional demo project</p>
            <h2 id="demo-project-title">Northstar Precision Assembly</h2>
            <p>
              One delayed motor receipt. Ten customer orders. Trace the
              shortage, then test an approved alternative. Switch to Build to
              edit this same project. Changes save on this device.
            </p>
            <a className="project-demo__link" href="/demo">
              Open demo project
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <p className="projects-storage-note">
          <HardDrive size={16} aria-hidden="true" />
          Projects stay in this browser. Export JSON from your project to keep a
          portable backup.
        </p>
      </main>
    </div>
  );
}

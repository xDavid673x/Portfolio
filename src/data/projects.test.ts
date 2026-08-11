import { describe, expect, it } from "vitest";

import { projectById, projects } from "@/data/projects";

describe("project portfolio data", () => {
  it("keeps the three project stories complete and uniquely addressable", () => {
    expect(projects).toHaveLength(3);
    expect(new Set(projects.map((project) => project.id)).size).toBe(3);

    for (const project of projects) {
      expect(project.title).not.toHaveLength(0);
      expect(project.challenge).not.toHaveLength(0);
      expect(project.approach).not.toHaveLength(0);
      expect(project.evidence).not.toHaveLength(0);
      expect(project.nextMilestone).not.toHaveLength(0);
      expect(project.technologies.length).toBeGreaterThanOrEqual(3);
      expect(projectById[project.id]).toBe(project);
    }
  });

  it("distinguishes shipped work from current research builds", () => {
    expect(projectById["fitness-platform"].status).toBe("Completed");
    expect(projectById["fitness-platform"].evidenceType).toBe("verified");
    expect(projectById["robotic-arm"].status).toBe("In development");
    expect(projectById["robotic-arm"].evidenceType).toBe("planned");
    expect(projectById["formula-student"].status).toBe("In development");
    expect(projectById["formula-student"].evidenceType).toBe("planned");
  });
});

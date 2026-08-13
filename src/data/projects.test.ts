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

  it("links the completed group project to its public source", () => {
    expect(projectById["fitness-platform"].source).toEqual({
      href: "https://github.com/xDavid673x/Year1_GroupProject",
      label: "View project source",
    });
    expect(projectById["robotic-arm"].source).toBeUndefined();
    expect(projectById["formula-student"].source).toBeUndefined();
  });

  it("identifies the open-source hardware basis without overstating progress", () => {
    expect(projectById["robotic-arm"].summary).toContain(
      "open-source ZERO arm's printable geometry",
    );
    expect(projectById["robotic-arm"].evidenceType).toBe("planned");
  });
});

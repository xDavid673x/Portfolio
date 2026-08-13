export type ProjectVisual = "robot" | "autonomy" | "fitness";

export type Project = {
  id: string;
  title: string;
  shortTitle: string;
  status: string;
  context: string;
  summary: string;
  challenge: string;
  approach: string;
  evidence: string;
  evidenceType: "planned" | "verified";
  nextMilestone: string;
  technologies: string[];
  visual: ProjectVisual;
  tone: "violet" | "lime" | "coral";
  source?: {
    href: string;
    label: string;
  };
};

export const projects: Project[] = [
  {
    id: "robotic-arm",
    title: "Teaching a robotic arm to reach",
    shortTitle: "RL robotic arm",
    status: "In development",
    context: "Independent learning project",
    summary:
      "A simulation-first build based on the open-source ZERO arm's printable geometry, studying how reward design and observations shape reliable joint control.",
    challenge:
      "Make continuous control measurable, reproducible, and honest about failure.",
    approach:
      "Recreate the printable arm and its articulated model, define observations and actions, then isolate reward terms across fixed evaluation seeds.",
    evidence:
      "Planned validation: training curves, held-out targets, rollout comparisons, and failed reward designs.",
    evidenceType: "planned",
    nextMilestone:
      "First reproducible baseline, then a reward-term ablation.",
    technologies: ["Reinforcement learning", "Robotics", "Simulation"],
    visual: "robot",
    tone: "violet",
  },
  {
    id: "formula-student",
    title: "Building a driver that reads the track",
    shortTitle: "Formula Student autonomy",
    status: "In development",
    context: "Team engineering project",
    summary:
      "An autonomy stack that turns imperfect world signals into a dependable driving loop.",
    challenge:
      "Connect perception, planning, and control without hiding how each layer fails.",
    approach:
      "Map the signal path, define module contracts, and create replayable scenarios before optimising algorithms.",
    evidence:
      "Planned validation: scenario logs, interface tests, a latency budget, and repeatable track-level evaluation.",
    evidenceType: "planned",
    nextMilestone:
      "Locked interfaces and the first replayable integrated path.",
    technologies: ["Autonomous systems", "Planning", "Controls"],
    visual: "autonomy",
    tone: "lime",
  },
  {
    id: "fitness-platform",
    title: "Shipping a fitness platform as a team",
    shortTitle: "Fitness platform",
    status: "Completed",
    context: "First-year group project",
    summary:
      "A full-stack fitness platform spanning workouts, social features, maps, media, and data-aware coaching.",
    challenge:
      "Coordinate a broad product surface and its data flows across a group codebase.",
    approach:
      "Connect browser journeys to session-based PHP, transactional workout flows, and a normalized MySQL model.",
    evidence:
      "Transactional workouts, scored leaderboards, social flows, maps, 43 videos, and 36 PHP files passing syntax checks.",
    evidenceType: "verified",
    nextMilestone:
      "Document individual ownership and package a seeded walkthrough.",
    technologies: ["PHP", "MySQL", "JavaScript"],
    visual: "fitness",
    tone: "coral",
    source: {
      href: "https://github.com/xDavid673x/Year1_GroupProject",
      label: "View project source",
    },
  },
];

export const projectById = Object.fromEntries(
  projects.map((project) => [project.id, project]),
) as Record<string, Project>;

export type ProjectVisual = "robot" | "spider" | "fitness";

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
    id: "robosoc-spider",
    title: "Programming a hexapod to move as one",
    shortTitle: "RoboSoc spider",
    status: "Completed",
    context: "Program Lead / RoboSoc group project",
    summary:
      "As Program Lead, I am coordinating the software that turns an 18-joint Fusion-designed hexapod into a stable, testable walking platform.",
    challenge:
      "Coordinate six legs and 18 servos into stable motion while keeping simulation, inverse kinematics, and embedded behavior aligned.",
    approach:
      "Use the Fusion assembly as the kinematic source, model it in Webots, and drive alternating tripod steps through constrained inverse kinematics before physical calibration.",
    evidence:
      "Verified in Webots: forward and backward travel, left and right turns, stop and reset behavior, motor and sensor discovery, and slope-world loading.",
    evidenceType: "verified",
    nextMilestone:
      "Calibrate the physical servos and validate tripod-gait stability on hardware.",
    technologies: ["Inverse kinematics", "Webots", "Embedded control"],
    visual: "spider",
    tone: "lime",
    source: {
      href: "https://github.com/xDavid673x/RoboSoc_Spider",
      label: "View project source",
    },
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

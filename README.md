# Intelligent Systems Portfolio

A design-led portfolio for a second-year Computer Science student at the University of Manchester, focused on AI/ML, robotics, and autonomous systems.

[View the repository on GitHub](https://github.com/xDavid673x/Portfolio)

## Featured work

- **Reinforcement-learning robotic arm** — a simulation-first study of reward design, observations, and reproducible control evaluation.
- **Formula Student autonomy** — a modular perception, planning, and control loop built around replayable scenarios.
- **Fitness platform** — a completed first-year group project with workout tracking, social features, maps, media, leaderboards, and data-aware coaching.

Ongoing work is labelled honestly and presented with its next evidence milestone rather than invented results.

## Stack

- Next.js 16, React 19, and strict TypeScript
- Three.js with React Three Fiber and Drei
- GSAP and ScrollTrigger
- Tailwind CSS 4 plus a custom responsive design system
- Vitest, Testing Library, and Playwright browser verification

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The interactive hero has reduced-motion and non-WebGL fallbacks.

## Verification

```bash
npm run verify
```

This runs ESLint, TypeScript, Vitest, and the production build. Browser QA covers desktop and mobile layouts, navigation, carousel controls, horizontal overflow, reduced motion, the WebGL fallback, and console output.

## Project organization

- `src/app/` — route, metadata, and global styles
- `src/components/` — portfolio UI and project visualizations
- `src/components/three/` — interactive hero scene and fallback
- `src/data/projects.ts` — typed case-study content
- `public/images/` — optimized source-project imagery

#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

git show 6fc07e1:src/components/three/robosoc-spider-gait.ts > src/components/three/robosoc-spider-gait.ts
git show 6fc07e1:src/components/three/robosoc-spider-gait.test.ts > src/components/three/robosoc-spider-gait.test.ts
printf '%s\n' "Restored RoboSoc gait files from baseline 6fc07e1."

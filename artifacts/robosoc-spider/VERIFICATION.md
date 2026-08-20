# RoboSoc Spider Posture Verification

## Modified artifact

- `src/components/three/robosoc-spider-gait.ts`
- `src/components/three/robosoc-spider-gait.test.ts`
- commit `7815f2f`

The changed branch is the Fusion joint-command mapping and the gait target
height: femur/tibia commands are applied relative to the GLB reset angles,
`BODY_HEIGHT_MM` is `-150`, and `LIFT_MM` is `20`.

## Baseline and modified hashes

Baseline source was preserved in Git commit `6fc07e1` and recorded before the
modified hashes below.

```text
git show 6fc07e1:src/components/three/robosoc-spider-gait.ts | shasum -a 256
dbaa78a330cfcb29b503ccde48b7f58634f4a5a1edbfd589db4366b34ea51d3b  -

git show 6fc07e1:src/components/three/robosoc-spider-gait.test.ts | shasum -a 256
e0e4ddecf6fc17e923a1612241f9059bde8477049d459ae255a8b2e9dcd419e2  -

shasum -a 256 src/components/three/robosoc-spider-gait.ts src/components/three/robosoc-spider-gait.test.ts
f5259bc72d26f5941ec9072b30cdce5e2a137b38f0e589568ef7e0f78521686d  src/components/three/robosoc-spider-gait.ts
2205b1b0417fe22b0363b9dda51a2f7a4661606b3370718fbbea707a593c0588  src/components/three/robosoc-spider-gait.test.ts
```

## Verification record

```text
npm test -- --run src/components/three/robosoc-spider-gait.test.ts
Test Files  1 passed (1)
Tests  12 passed (12)
exit 0

npm run verify
Test Files  5 passed (5)
Tests  27 passed (27)
Route (app): /
exit 0
```

Browser inputs were `http://localhost:3000/#case-robosoc-spider`, the RoboSoc
card click, desktop `820 ms` frame separation, and mobile `390x844` viewport.
The spider surface reported `data-render-mode="continuous"`; desktop hashes
were `c62afa7e553444c958659994845c271b17b6ea983ca46eb725d4c604af7ca50c` and
`53e443c9c3c6163ffd03ce43df5fa0dd8394cc46d95ae23d36033f64b979e458`; mobile
hashes were `8add57e80282c077dc8da0f3a38c4339efc8f41c915abbb8710d4a94bf19e14d`
and `4cb01c0ae7e7f128b5027158bf1fbaaae121612d4b99bcc765623d11a3ac871d`.
Both pairs differ. Browser logs contained no errors or warnings.

## Rollback

Run `./artifacts/robosoc-spider/rollback.sh` from the repository root. It
restores both modified source files from the preserved baseline commit and
leaves unrelated worktree changes untouched.

Rollback was executed and then restored from the modified commit:

```text
./artifacts/robosoc-spider/rollback.sh
Restored RoboSoc gait files from baseline 6fc07e1.
baseline_after_rollback=dbaa78a330cfcb29b503ccde48b7f58634f4a5a1edbfd589db4366b34ea51d3b
modified_after_restore=f5259bc72d26f5941ec9072b30cdce5e2a137b38f0e589568ef7e0f78521686d
rollback_verification=exit 0
```

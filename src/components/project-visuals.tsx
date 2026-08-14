import styles from "./project-visuals.module.css";

export type ProjectVisualType = "robot" | "autonomy" | "fitness";

type ProjectVisualProps = {
  type: ProjectVisualType;
  className?: string;
};

const perceptionPoints = [
  [64, 84],
  [78, 72],
  [92, 62],
  [108, 55],
  [127, 51],
  [147, 53],
  [165, 60],
  [181, 71],
  [195, 85],
] as const;

const telemetryBands = ["PERCEPTION", "PLANNING", "CONTROL"] as const;

const simulationKeyTimes = "0;0.12;0.25;0.42;0.54;0.68;0.82;0.94;1";
const simulationKeySplines =
  "0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function RoboticArmVisual({ className }: { className?: string }) {
  return (
    <figure
      className={joinClassNames(styles.visual, styles.robotVisual, className)}
      role="img"
      aria-label="Reinforcement-learning simulation showing an articulated robotic arm reaching for a target payload, closing its gripper, and returning along a sampled path."
    >
      <div className={styles.technicalHeader} aria-hidden="true">
        <span>ZERO / REINFORCEMENT LEARNING</span>
        <span className={styles.headerState}>
          <i /> ROLLOUT 0247
        </span>
      </div>

      <div className={styles.robotLayout} aria-hidden="true">
        <div className={styles.robotStage}>
          <svg
            className={styles.robotSvg}
            viewBox="0 0 560 330"
            preserveAspectRatio="xMidYMid meet"
          >
            <g className={styles.robotField}>
              <path d="M34 282H530" />
              <path d="M74 282A226 226 0 0 1 500 108" />
              <path d="M102 282A198 198 0 0 1 487 128" />
              <path d="M68 75H188M68 75V195" />
            </g>

            <path
              className={styles.robotTrajectory}
              d="M144 240C210 203 259 164 327 143C393 123 449 99 514 75"
            />

            <circle className={styles.robotTraceDot} cx="0" cy="0" r="4">
              <animateMotion
                dur="9s"
                repeatCount="indefinite"
                calcMode="paced"
                path="M144 240C210 203 259 164 327 143C393 123 449 99 514 75"
              />
            </circle>

            <g className={styles.robotTargetPayload}>
              <rect x="498" y="63" width="25" height="22" rx="2" />
              <path d="M498 72H523M510 63V85" />
              <animate
                attributeName="opacity"
                dur="9s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes={simulationKeyTimes}
                keySplines={simulationKeySplines}
                values="1;1;1;0;0;0;0;1;1"
              />
            </g>

            <g className={styles.robotGoal}>
              <circle cx="514" cy="75" r="27" />
              <circle cx="514" cy="75" r="8" />
              <path d="M514 38V51M514 99V112M477 75H490M538 75H551" />
            </g>

            <g className={styles.robotBase}>
              <path className={styles.robotBasePlate} d="M72 286H198L181 315H89Z" />
              <path
                className={styles.robotPedestal}
                d="M99 286V250C99 228 116 211 138 211H148C170 211 187 228 187 250V286Z"
              />
              <circle className={styles.robotJointOuter} cx="142" cy="240" r="31" />
              <circle className={styles.robotJointCore} cx="142" cy="240" r="18" />
              <circle className={styles.robotBolt} cx="142" cy="240" r="4" />
            </g>

            <g className={styles.robotUpperAssembly}>
              <g className={styles.robotUpperLink}>
                <path
                  className={styles.robotLinkShell}
                  d="M132 220L266 143Q278 136 288 151L294 160Q300 173 286 182L155 259Q143 266 133 252L125 240Q118 228 132 220Z"
                />
                <path
                  className={styles.robotLinkInset}
                  d="M153 222L265 156Q272 152 278 160L281 165Q285 171 277 176L162 244Z"
                />
                <circle className={styles.robotJointOuter} cx="279" cy="163" r="26" />
                <circle className={styles.robotJointCore} cx="279" cy="163" r="14" />
                <circle className={styles.robotBolt} cx="279" cy="163" r="3.5" />
              </g>

              <g className={styles.robotForearmAssembly}>
                <g className={styles.robotForearmLink}>
                  <path
                    className={styles.robotLinkShell}
                    d="M273 142L395 89Q408 84 417 97L424 108Q432 121 418 130L293 185Q281 190 272 178L265 166Q257 151 273 142Z"
                  />
                  <path
                    className={styles.robotLinkInset}
                    d="M294 147L394 103Q401 100 406 106L410 112Q414 119 406 123L299 170Z"
                  />
                  <circle className={styles.robotJointOuter} cx="404" cy="111" r="21" />
                  <circle className={styles.robotJointCore} cx="404" cy="111" r="11" />
                  <circle className={styles.robotBolt} cx="404" cy="111" r="3" />
                </g>

                <g className={styles.robotWristAssembly}>
                  <path
                    className={styles.robotWristHousing}
                    d="M410 94L459 70Q469 66 475 77L481 88Q486 98 475 104L423 129Z"
                  />
                  <path className={styles.robotPalm} d="M461 70L482 59L494 83L474 96Z" />
                  <g className={styles.robotHeldPayload}>
                    <rect x="497" y="69" width="20" height="17" rx="2" />
                    <path d="M497 76H517M507 69V86" />
                    <animate
                      attributeName="opacity"
                      dur="9s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes={simulationKeyTimes}
                      keySplines={simulationKeySplines}
                      values="0;0;0;1;1;1;0;0;0"
                    />
                  </g>
                  <g className={styles.robotGripperUpper}>
                    <path d="M486 65L507 53L518 58" />
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      dur="9s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes={simulationKeyTimes}
                      keySplines={simulationKeySplines}
                      values="0 486 65;0 486 65;0 486 65;0 486 65;-11 486 65;-11 486 65;0 486 65;0 486 65;0 486 65"
                    />
                  </g>
                  <g className={styles.robotGripperLower}>
                    <path d="M492 86L514 94L520 88" />
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      dur="9s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes={simulationKeyTimes}
                      keySplines={simulationKeySplines}
                      values="0 492 86;0 492 86;0 492 86;0 492 86;11 492 86;11 492 86;0 492 86;0 492 86;0 492 86"
                    />
                  </g>

                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    dur="9s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes={simulationKeyTimes}
                    keySplines={simulationKeySplines}
                    values="0 404 111;-18 404 111;-18 404 111;-5 404 111;0 404 111;0 404 111;-18 404 111;-18 404 111;0 404 111"
                  />
                </g>

                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  dur="9s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes={simulationKeyTimes}
                  keySplines={simulationKeySplines}
                  values="0 279 163;24 279 163;24 279 163;6 279 163;0 279 163;0 279 163;24 279 163;24 279 163;0 279 163"
                />
              </g>

              <animateTransform
                attributeName="transform"
                type="rotate"
                dur="9s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes={simulationKeyTimes}
                keySplines={simulationKeySplines}
                values="0 142 240;12 142 240;12 142 240;3 142 240;0 142 240;0 142 240;12 142 240;12 142 240;0 142 240"
              />
            </g>
          </svg>

          <aside className={styles.robotSignal}>
            <div className={styles.robotSignalHeading}>
              <span>REWARD / ROLLOUT</span>
              <strong>+0.84</strong>
            </div>
            <svg viewBox="0 0 150 54" preserveAspectRatio="none">
              <path className={styles.robotSignalGrid} d="M0 17H150M0 35H150" />
              <path
                className={styles.robotSignalLine}
                d="M0 45C13 43 17 47 28 38C40 27 47 36 57 28C69 19 75 29 86 18C97 8 107 18 118 11C130 4 139 9 150 2"
              />
            </svg>
            <div className={styles.robotPolicyFlow}>
              <span>STATE</span>
              <i />
              <span>POLICY</span>
              <i />
              <span>ACTION</span>
            </div>
          </aside>

          <div className={styles.robotStageFooter}>
            <span>03 AXES / CONTINUOUS CONTROL</span>
            <span>TARGET LOCKED</span>
          </div>
        </div>
      </div>
    </figure>
  );
}

export function FormulaAutonomyVisual({ className }: { className?: string }) {
  return (
    <figure
      className={joinClassNames(styles.visual, styles.autonomyVisual, className)}
      role="img"
      aria-label="Formula Student autonomy display showing perception boundaries, a predicted driving corridor, and the perception, planning, and control pipeline."
    >
      <div className={styles.technicalHeader} aria-hidden="true">
        <span>AUTONOMY PIPELINE</span>
        <span className={styles.headerState}>
          <i /> SENSOR FUSION
        </span>
      </div>

      <div className={styles.autonomyLayout} aria-hidden="true">
        <div className={styles.trackViewport}>
          <span className={styles.viewportLabel}>PLANNED CORRIDOR</span>
          <svg
            className={styles.trackSvg}
            viewBox="0 0 260 230"
            preserveAspectRatio="xMidYMid meet"
          >
            <g className={styles.trackGrid}>
              <path d="M14 42H246M14 82H246M14 122H246M14 162H246M14 202H246" />
              <path d="M43 18V216M86 18V216M129 18V216M172 18V216M215 18V216" />
            </g>

            <path
              className={styles.trackEdge}
              d="M49 219C51 181 72 162 73 130C74 100 57 75 74 47C88 25 113 19 137 18"
            />
            <path
              className={styles.trackEdge}
              d="M204 219C201 180 176 164 177 131C179 99 205 77 187 49C174 28 156 21 137 18"
            />
            <path
              className={styles.safeCorridor}
              d="M127 218C126 184 120 164 125 132C130 103 143 77 137 48C134 33 134 24 137 18"
            />
            <path
              className={styles.plannedPath}
              d="M127 218C126 184 120 164 125 132C130 103 143 77 137 48C134 33 134 24 137 18"
            />

            <path className={styles.perceptionCone} d="M127 193L51 95L202 95Z" />
            <path className={styles.perceptionRay} d="M127 193L78 102M127 193L126 93M127 193L177 103" />

            <g className={styles.boundaryPoints}>
              {perceptionPoints.map(([x, y], index) => (
                <g key={`${x}-${y}`}>
                  <circle cx={x} cy={y} r="4" />
                  <circle cx={260 - x} cy={y} r="4" />
                  {index % 3 === 0 ? <circle cx={x} cy={y} r="9" className={styles.pointEcho} /> : null}
                </g>
              ))}
              <circle cx="58" cy="113" r="4" />
              <circle cx="202" cy="113" r="4" />
              <circle cx="50" cy="147" r="4" />
              <circle cx="210" cy="147" r="4" />
              <circle cx="47" cy="184" r="4" />
              <circle cx="213" cy="184" r="4" />
            </g>

            <g className={styles.carMarker}>
              <path d="M117 181L121 164H135L140 181L136 201H121Z" />
              <path d="M121 174H136M126 164V153M131 164V153" />
              <circle cx="121" cy="188" r="2" />
              <circle cx="136" cy="188" r="2" />
            </g>
          </svg>

          <div className={styles.trackLegend}>
            <span><i className={styles.boundaryKey} /> Boundary</span>
            <span><i className={styles.pathKey} /> Path</span>
          </div>
        </div>

        <aside className={styles.telemetryPanel}>
          <div className={styles.telemetryTitle}>
            <span>SYSTEM FLOW</span>
            <span>INPUT TO ACTUATION</span>
          </div>

          <div className={styles.pipelineBands}>
            {telemetryBands.map((band, index) => (
              <div className={styles.pipelineBand} key={band}>
                <div>
                  <span>{band}</span>
                  <small>{index === 0 ? "SENSORS" : index === 1 ? "PATH" : "VEHICLE"}</small>
                </div>
                <div className={styles.bandSignal}>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.steeringMap}>
            <span>LATERAL COMMAND</span>
            <svg viewBox="0 0 210 60" preserveAspectRatio="none">
              <path className={styles.chartGrid} d="M0 15H210M0 30H210M0 45H210" />
              <path
                className={styles.steeringLine}
                d="M0 37C18 37 27 21 46 23C64 25 69 42 88 38C109 34 111 15 132 18C155 21 164 45 184 39C198 35 201 25 210 24"
              />
            </svg>
          </div>
        </aside>
      </div>
    </figure>
  );
}

export function FitnessPlatformVisual({ className }: { className?: string }) {
  return (
    <figure
      className={joinClassNames(styles.visual, styles.fitnessVisual, className)}
      role="img"
      aria-label="Editorial visualization of verified fitness-platform features: workout tracking, leaderboards, data-aware coaching, and social activity."
    >
      <div className={styles.fitnessBrowser} aria-hidden="true">
        <div className={styles.browserBar}>
          <span className={styles.browserDots}><i /><i /><i /></span>
          <span className={styles.browserAddress}>FITNESS PLATFORM</span>
          <span className={styles.browserMenu}><i /><i /></span>
        </div>

        <div className={styles.fitnessMosaic}>
          <div className={styles.fitnessHeroTile}>
            <div className={styles.fitnessPhoto} />
            <div className={styles.fitnessPhotoWash} />
            <div className={styles.fitnessHeroCopy}>
              <span>WORKOUT TRACKING</span>
              <strong>Movement, logged<br />with evidence.</strong>
              <i>Build a workout</i>
            </div>
          </div>

          <div className={styles.scheduleTile}>
            <div className={styles.tileHeading}>
              <span>LEADERBOARDS</span>
              <i />
            </div>
            <div className={styles.scheduleRows}>
              <div><b>Weekly</b><span>Progress</span><i /></div>
              <div><b>Friends</b><span>Social</span><i /></div>
              <div><b>Global</b><span>Scored</span><i /></div>
            </div>
          </div>

          <div className={styles.membershipTile}>
            <span>AI COACH</span>
            <strong>Context from<br />your training.</strong>
            <div className={styles.membershipLines}>
              <i /><i /><i />
            </div>
          </div>

          <div className={styles.accountTile}>
            <div className={styles.accountMark}>F</div>
            <div>
              <span>SOCIAL FEED</span>
              <strong>Track. Share. Improve.</strong>
            </div>
            <i className={styles.accountArrow} />
          </div>
        </div>
      </div>
    </figure>
  );
}

export function ProjectVisual({ type, className }: ProjectVisualProps) {
  if (type === "robot") {
    return <RoboticArmVisual className={className} />;
  }

  if (type === "autonomy") {
    return <FormulaAutonomyVisual className={className} />;
  }

  return <FitnessPlatformVisual className={className} />;
}

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

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function RoboticArmVisual({ className }: { className?: string }) {
  return (
    <figure
      className={joinClassNames(styles.visual, styles.robotVisual, className)}
      role="img"
      aria-label="Reinforcement-learning workspace showing a robotic arm, its sampled trajectory, a goal position, and an abstract reward signal."
    >
      <div className={styles.technicalHeader} aria-hidden="true">
        <span>DEVELOPING</span>
        <span className={styles.headerState}>
          <i /> SIMULATION
        </span>
      </div>

      <div className={styles.robotLayout} aria-hidden="true">
        <div className={styles.robotStage}>
          <div className={styles.axisLabels}>
            <span>Z</span>
            <span>X</span>
          </div>
          <svg
            className={styles.robotSvg}
            viewBox="0 0 320 230"
            preserveAspectRatio="xMidYMid meet"
          >
            <g className={styles.robotGrid}>
              <path d="M18 194H302M18 160H302M18 126H302M18 92H302M18 58H302" />
              <path d="M48 24V208M95 24V208M142 24V208M189 24V208M236 24V208M283 24V208" />
            </g>

            <g className={styles.reachEnvelope}>
              <ellipse cx="155" cy="133" rx="111" ry="61" transform="rotate(-24 155 133)" />
              <path d="M88 180C119 155 144 127 183 112C211 101 231 80 250 57" />
              <path d="M88 180C112 166 128 149 151 141C187 128 210 98 250 57" />
            </g>

            <g className={styles.armGhost}>
              <path d="M88 174L116 142L168 124L213 85" />
              <path d="M88 174L108 134L157 103L224 70" />
            </g>

            <path
              className={styles.trajectoryGhost}
              d="M88 180C105 150 116 119 155 109C196 98 211 71 247 60"
            />
            <path
              className={styles.trajectory}
              d="M88 180C105 150 116 119 155 109C196 98 211 71 247 60"
            />

            <g className={styles.goal}>
              <circle cx="250" cy="57" r="21" />
              <circle cx="250" cy="57" r="6" />
              <path d="M250 29V40M250 74V85M222 57H233M267 57H278" />
            </g>

            <g className={styles.armBase}>
              <path d="M55 195H119L110 211H64Z" />
              <rect x="72" y="175" width="31" height="22" rx="5" />
              <circle cx="88" cy="174" r="15" />
            </g>
            <g className={styles.armUpper}>
              <path d="M88 174L127 118" />
              <path d="M96 178L135 122" />
              <circle cx="131" cy="120" r="14" />
            </g>
            <g className={styles.armForearm}>
              <path d="M132 120L191 91" />
              <path d="M138 130L197 101" />
              <circle cx="195" cy="96" r="12" />
              <path d="M204 88L224 70" />
              <path d="M213 97L232 79" />
              <path d="M224 70L237 69M232 79L238 88" />
            </g>

            <g className={styles.samplePoses}>
              <circle cx="124" cy="131" r="3" />
              <circle cx="154" cy="109" r="3" />
              <circle cx="188" cy="94" r="3" />
              <circle cx="219" cy="77" r="3" />
            </g>
          </svg>
          <div className={styles.stageLegend}>
            <span><i className={styles.legendGoal} /> Goal</span>
            <span><i className={styles.legendPath} /> Sampled path</span>
          </div>
        </div>

        <aside className={styles.rewardPanel}>
          <div className={styles.panelTitleRow}>
            <span>REWARD SIGNAL</span>
            <span>LIVE TRACE</span>
          </div>
          <svg className={styles.rewardChart} viewBox="0 0 180 86" preserveAspectRatio="none">
            <g className={styles.chartGrid}>
              <path d="M0 17H180M0 43H180M0 69H180" />
              <path d="M45 0V86M90 0V86M135 0V86" />
            </g>
            <path
              className={styles.rewardArea}
              d="M0 74C15 69 22 76 34 63C46 50 54 61 66 49C78 38 87 53 100 36C115 18 128 34 141 22C154 10 165 21 180 7V86H0Z"
            />
            <path
              className={styles.rewardLine}
              d="M0 74C15 69 22 76 34 63C46 50 54 61 66 49C78 38 87 53 100 36C115 18 128 34 141 22C154 10 165 21 180 7"
            />
          </svg>

          <div className={styles.policyNetwork}>
            <div className={styles.policyNetworkHeading}>
              <span>ACTOR-CRITIC</span>
              <b>CONF 0.96</b>
            </div>
            <svg viewBox="0 0 160 100" preserveAspectRatio="none">
              <g className={styles.networkLinks}>
                <path d="M20 20L66 16M20 20L66 43M20 48L66 16M20 48L66 43M20 48L66 72M20 78L66 43M20 78L66 72M76 16L126 30M76 43L126 30M76 43L126 64M76 72L126 64" />
              </g>
              <g className={styles.networkInput}>
                <circle cx="20" cy="20" r="5" />
                <circle cx="20" cy="48" r="5" />
                <circle cx="20" cy="78" r="5" />
              </g>
              <g className={styles.networkLatent}>
                <circle cx="72" cy="16" r="6" />
                <circle cx="72" cy="43" r="6" />
                <circle cx="72" cy="72" r="6" />
              </g>
              <g className={styles.networkOutput}>
                <circle cx="132" cy="30" r="7" />
                <circle cx="132" cy="64" r="7" />
              </g>
            </svg>
            <div className={styles.policyNetworkLegend}>
              <span>STATE</span>
              <span>LATENT</span>
              <span>ACTION</span>
            </div>
          </div>

          <div className={styles.signalFlow}>
            <span>OBSERVATION</span>
            <i />
            <span>POLICY</span>
            <i />
            <span>ACTION</span>
          </div>

          <div className={styles.policyGrid}>
            <span>JOINT STATE</span>
            <b>ENCODED</b>
            <span>TARGET DELTA</span>
            <b>TRACKED</b>
            <span>POLICY UPDATE</span>
            <b>ITERATING</b>
          </div>
        </aside>
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

"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./project-visuals.module.css";

export type ProjectVisualType = "robot" | "spider" | "fitness";

type ProjectVisualProps = {
  type: ProjectVisualType;
  className?: string;
};

const gaitBands = [
  ["TRIPOD A", "L1 / R2 / L3"],
  ["TRIPOD B", "R1 / L2 / R3"],
  ["STABILITY", "BODY LEVEL"],
] as const;

const simulationKeyTimes = "0;0.12;0.25;0.42;0.54;0.68;0.82;0.94;1";
const simulationKeySplines =
  "0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1";

const MOTIV8_HOMEPAGE_URL =
  "https://year1-group-project.vercel.app/homepage/homepage.html";

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

export function SpiderHexapodVisual({ className }: { className?: string }) {
  return (
    <figure
      className={joinClassNames(styles.visual, styles.spiderVisual, className)}
      role="img"
      aria-label="Technical hexapod robot preview showing six articulated legs, alternating tripod gait phases, and compact 18 degree-of-freedom telemetry."
    >
      <div className={styles.technicalHeader} aria-hidden="true">
        <span>ROBOSOC / HEXAPOD GAIT</span>
        <span className={styles.headerState}>
          <i /> TRIPOD STABLE
        </span>
      </div>

      <div className={styles.spiderLayout} aria-hidden="true">
        <div className={styles.spiderViewport}>
          <span className={styles.viewportLabel}>GAIT ENVELOPE</span>
          <svg
            className={styles.spiderSvg}
            viewBox="0 0 560 330"
            preserveAspectRatio="xMidYMid meet"
          >
            <g className={styles.spiderGrid}>
              <path d="M54 66H506M54 121H506M54 176H506M54 231H506M54 286H506" />
              <path d="M92 38V300M154 38V300M216 38V300M278 38V300M340 38V300M402 38V300M464 38V300" />
            </g>

            <path
              className={styles.spiderStrideEnvelope}
              d="M107 92C160 54 238 43 281 43C326 43 401 55 453 92M107 238C160 277 238 287 281 287C326 287 401 276 453 238"
            />
            <path
              className={styles.spiderPhasePathA}
              d="M98 248C143 214 154 161 111 94M282 286C282 245 281 203 280 166M462 94C417 129 407 180 449 248"
            />
            <path
              className={styles.spiderPhasePathB}
              d="M98 94C144 130 154 181 111 248M282 44C282 84 281 125 280 166M462 248C416 212 407 160 449 94"
            />

            <g className={styles.spiderBodyShadow}>
              <ellipse cx="280" cy="177" rx="94" ry="33" />
            </g>

            <g className={styles.spiderLegs}>
              <g className={styles.tripodA}>
                <path d="M223 142L165 111L104 86" />
                <path d="M281 135L281 89L281 42" />
                <path d="M337 191L394 218L457 251" />
              </g>
              <g className={styles.tripodB}>
                <path d="M337 142L397 113L458 87" />
                <path d="M281 196L281 241L280 288" />
                <path d="M223 190L166 218L105 250" />
              </g>
              <g className={styles.spiderLegJoints}>
                <circle cx="223" cy="142" r="8" />
                <circle cx="165" cy="111" r="6" />
                <circle cx="104" cy="86" r="5" />
                <circle cx="281" cy="135" r="8" />
                <circle cx="281" cy="89" r="6" />
                <circle cx="281" cy="42" r="5" />
                <circle cx="337" cy="191" r="8" />
                <circle cx="394" cy="218" r="6" />
                <circle cx="457" cy="251" r="5" />
                <circle cx="337" cy="142" r="8" />
                <circle cx="397" cy="113" r="6" />
                <circle cx="458" cy="87" r="5" />
                <circle cx="281" cy="196" r="8" />
                <circle cx="281" cy="241" r="6" />
                <circle cx="280" cy="288" r="5" />
                <circle cx="223" cy="190" r="8" />
                <circle cx="166" cy="218" r="6" />
                <circle cx="105" cy="250" r="5" />
              </g>
            </g>

            <g className={styles.spiderChassis}>
              <path d="M206 142Q225 109 281 107Q335 109 355 142L375 168L353 195Q333 223 281 225Q227 223 206 195L185 168Z" />
              <path d="M225 138Q241 124 281 123Q320 124 336 138L350 168L335 198Q320 209 281 211Q241 209 225 198L211 168Z" />
              <path d="M244 150H317M236 168H326M244 186H317" />
              <circle cx="247" cy="168" r="5" />
              <circle cx="314" cy="168" r="5" />
            </g>

            <g className={styles.spiderFootfallMarkers}>
              <circle cx="104" cy="86" r="11" />
              <circle cx="281" cy="42" r="11" />
              <circle cx="457" cy="251" r="11" />
              <circle cx="458" cy="87" r="11" />
              <circle cx="280" cy="288" r="11" />
              <circle cx="105" cy="250" r="11" />
            </g>
          </svg>

          <div className={styles.spiderLegend}>
            <span><i className={styles.tripodAKey} /> Tripod A</span>
            <span><i className={styles.tripodBKey} /> Tripod B</span>
          </div>
        </div>

        <aside className={styles.spiderTelemetry}>
          <div className={styles.spiderTelemetryTitle}>
            <span>LOCOMOTION</span>
            <span>18 DOF</span>
          </div>

          <div className={styles.spiderReadout}>
            <div>
              <span>GAIT STATE</span>
              <strong>TRIPOD WALK</strong>
            </div>
            <div className={styles.spiderMetrics}>
              <span>ROLL <b>1.8deg</b></span>
              <span>STEP <b>64%</b></span>
            </div>
          </div>

          <div className={styles.gaitBands}>
            {gaitBands.map(([band, detail]) => (
              <div className={styles.gaitBand} key={band}>
                <div>
                  <span>{band}</span>
                  <small>{detail}</small>
                </div>
                <div className={styles.gaitSignal}>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.gaitMap}>
            <span>SERVO LOAD / BODY LEVEL</span>
            <svg viewBox="0 0 210 60" preserveAspectRatio="none">
              <path className={styles.chartGrid} d="M0 15H210M0 30H210M0 45H210" />
              <path
                className={styles.gaitLine}
                d="M0 38C16 31 25 31 38 39C52 48 63 48 77 37C91 26 104 25 118 36C133 47 145 47 159 36C174 25 188 24 210 31"
              />
            </svg>
          </div>
        </aside>
      </div>
    </figure>
  );
}

export function FitnessPlatformVisual({ className }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLIFrameElement>(null);
  const activationTimer = useRef<number | undefined>(undefined);
  const timeoutTimer = useRef<number | undefined>(undefined);
  const [embedRequested, setEmbedRequested] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const activate = () => {
      window.clearTimeout(activationTimer.current);
      setEmbedRequested(true);
    };
    const activateAfterDwell = () => {
      window.clearTimeout(activationTimer.current);
      activationTimer.current = window.setTimeout(activate, 1200);
    };

    stage.addEventListener("pointerenter", activate);
    stage.addEventListener("focusin", activate);

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) activateAfterDwell();
          else window.clearTimeout(activationTimer.current);
        },
        { rootMargin: "160px 0px" },
      );
      observer.observe(stage);
    } else {
      activateAfterDwell();
    }

    return () => {
      observer?.disconnect();
      window.clearTimeout(activationTimer.current);
      window.clearTimeout(timeoutTimer.current);
      stage.removeEventListener("pointerenter", activate);
      stage.removeEventListener("focusin", activate);
    };
  }, []);

  useEffect(() => {
    if (!embedRequested || embedLoaded) return;

    timeoutTimer.current = window.setTimeout(() => {
      setEmbedFailed(true);
    }, 5000);

    return () => window.clearTimeout(timeoutTimer.current);
  }, [embedLoaded, embedRequested]);

  useEffect(() => {
    const embed = embedRef.current;
    if (!embed || !embedRequested) return;

    const markLoaded = () => setEmbedLoaded(true);
    const markFailed = () => setEmbedFailed(true);
    embed.addEventListener("load", markLoaded);
    embed.addEventListener("error", markFailed);

    return () => {
      embed.removeEventListener("load", markLoaded);
      embed.removeEventListener("error", markFailed);
    };
  }, [embedRequested]);

  return (
    <figure
      className={joinClassNames(styles.visual, styles.fitnessVisual, className)}
      role="img"
      aria-label="Motiv8 homepage hero visual showing the shipped fitness platform, its brand mark, and connected workout, social, and coaching features."
    >
      <div className={styles.technicalHeader} aria-hidden="true">
        <span>MOTIV8 / FULL-STACK PLATFORM</span>
        <span className={styles.headerState}>
          <i /> SHIPPED / VERIFIED
        </span>
      </div>

      <div className={styles.fitnessLayout} aria-hidden="true">
        <div
          className={styles.fitnessStage}
          data-embed-state={
            embedFailed ? "fallback" : embedLoaded ? "ready" : "local"
          }
          ref={stageRef}
        >
          <div className={styles.fitnessPhoto} />
          <div className={styles.fitnessPhotoWash} />
          {embedRequested && !embedFailed ? (
            <iframe
              className={styles.fitnessEmbed}
              ref={embedRef}
              onError={() => setEmbedFailed(true)}
              onLoad={() => setEmbedLoaded(true)}
              src={MOTIV8_HOMEPAGE_URL}
              title="Motiv8 hosted homepage preview"
              loading="lazy"
              referrerPolicy="no-referrer"
              scrolling="no"
              tabIndex={-1}
            />
          ) : null}
          <div className={styles.fitnessBrandLockup}>
            <span className={styles.fitnessLogo} />
            <span>TEAM PROJECT / 2025</span>
          </div>
          <div className={styles.fitnessHeroCopy}>
            <span>TRAIN SMARTER / STAY CONSISTENT</span>
            <strong>Where motivation<br />turns into results</strong>
            <i>Homepage hero / shipped</i>
          </div>
          <div className={styles.fitnessStageFooter}>
            <span>WORKOUTS / SOCIAL / COACHING</span>
            <span>HERO VERIFIED</span>
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

  if (type === "spider") {
    return <SpiderHexapodVisual className={className} />;
  }

  return <FitnessPlatformVisual className={className} />;
}

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { kitScript } from "../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 620;
const HEIGHT = 420;

const PLATE = { x: -118, y: -72, w: 248, d: 148, r: 9 };
const PLATE_H = 11;
const FOOT_H = 5;

const MOUNT = [0, 0, 40];
const L1 = 46;
const L2 = 36;
const ARM_Y = 5;
const ARM_Z = 6;
const ARM_H = 8;

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [MOUNT[0], MOUNT[1], MOUNT[2] + 22],
    [MOUNT[0] + L1 + L2 + 14, MOUNT[1], MOUNT[2] + 28],
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 46, elevation: 32 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.5, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.2, -PLATE_H - FOOT_H + 1.5, FOOT_H - 1.5, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.1, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.48 }));
  const strip = { x: PLATE.x + 12, y: PLATE.y + PLATE.d - 14, w: PLATE.w - 24, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.55, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.6, 0.55, [2, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const label = { x: PLATE.x + 14, y: PLATE.y + 10, w: 52, d: 22, r: 2 };
  out.push(S(k.slabOf(label, 0.4, 0.35, P, 3), { tone: "lo", crease: "none" }));
  out.push(
    L(
      [
        k.lineOnTop([label.x + 4, label.y + 6], [label.x + label.w - 4, label.y + 6], 0.75, P),
        k.lineOnTop([label.x + 4, label.y + 11], [label.x + label.w - 8, label.y + 11], 0.75, P),
        k.lineOnTop([label.x + 4, label.y + 16], [label.x + label.w - 12, label.y + 16], 0.75, P),
      ].join(""),
      { tone: "faint" },
    ),
  );
  return out.join("");
}

function pedestal() {
  const out = [];
  const base = { x: -18, y: -18, w: 36, d: 36, r: 4 };
  out.push(S(k.slabOf(base, 0, 5, P, 6, 0.7), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 14, 5, 6, P, 40), { tone: "mid" }));
  out.push(L(k.knurl(0, 0, 14, 5, 11, 48, P, 0.35), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 11.5, 11, 22, P, 36), { tone: "mid", crease: "lo" }));
  out.push(L(k.sideArc(0, 0, 11.5, 20, P, 18), { tone: "faint" }));
  out.push(L(k.sideArc(0, 0, 11.5, 28, P, 18), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, 13, 33, 4, P, 44), { tone: "hi" }));
  out.push(L(k.ring(0, 0, 13, 37, P, 48), { tone: "lo" }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    out.push(D([at([11 * Math.cos(a), 11 * Math.sin(a), 37])], { size: 0.42, tone: "lo" }));
  }
  const motor = { x: 16, y: -8, w: 14, d: 16, r: 2 };
  out.push(S(k.slabOf(motor, 8, 10, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(motor, 2), 18, P), { tone: "faint" }));
  out.push(S(k.cylinder(motor.x + 3, motor.y + 8, 2.2, 18, 3, P, 20), { tone: "lo" }));
  out.push(
    L(k.coil([motor.x + 7, motor.y + motor.d + 1, 12], [motor.x + 7, motor.y + motor.d + 8, 10], [motor.x + 7, motor.y + motor.d + 4], 1.2, 5, "y", P).back, {
      tone: "lo",
    }),
  );
  out.push(
    L(k.coil([motor.x + 7, motor.y + motor.d + 1, 12], [motor.x + 7, motor.y + motor.d + 8, 10], [motor.x + 7, motor.y + motor.d + 4], 1.2, 5, "y", P).front, {
      tone: "lo",
    }),
  );
  return out.join("");
}

function shoulderMount() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 10, 0, 5, P, 36), { tone: "hi" }));
  out.push(L(k.ring(0, 0, 10, 5, P, 36), { tone: "lo" }));
  const yokeL = { x: -14, y: -5, w: 10, d: 10, r: 2 };
  const yokeR = { x: 4, y: -5, w: 10, d: 10, r: 2 };
  out.push(S(k.slabOf(yokeL, 5, 16, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(yokeR, 5, 16, P, 4, 0.6), { tone: "mid" }));
  out.push(D([at([-9, 0, 21]), at([9, 0, 21]), at([-9, 0, 8]), at([9, 0, 8])], { size: 0.45 }));
  out.push(S(k.cylinder(-9, 0, 2.8, 8, 14, P, 24), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(9, 0, 2.8, 8, 14, P, 24), { tone: "mid", crease: "none" }));
  const enc = { x: -6, y: 12, w: 12, d: 8, r: 1.5 };
  out.push(S(k.slabOf(enc, 10, 6, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(enc, 1.5), 16, P), { tone: "faint" }));
  out.push(D([at([enc.x + 2, enc.y + 4, 16])], { size: 0.4, tone: "green" }));
  return out.join("");
}

function upperArm() {
  const out = [];
  const x0 = 4;
  const x1 = 4 + L1;
  const plan = { x: x0, y: -ARM_Y, w: L1, d: ARM_Y * 2, r: 2.2 };
  out.push(S(k.slabOf(plan, ARM_Z, ARM_H, P, 6, 0.9), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 3), ARM_Z + ARM_H, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([x0 + 8, -ARM_Y + 2], [x1 - 6, -ARM_Y + 2], ARM_Z + ARM_H, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([x0 + 8, ARM_Y - 2], [x1 - 6, ARM_Y - 2], ARM_Z + ARM_H, P), { tone: "faint" }));
  const tray = { x: x0 + 10, y: ARM_Y + 1, w: L1 - 18, d: 4, r: 1 };
  out.push(S(k.slabOf(tray, ARM_Z + 1, 2.2, P, 3), { tone: "lo" }));
  out.push(S(k.cylinder(x1, 0, ARM_Y + 1.5, ARM_Z + 2, 5, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(x1, 0, ARM_Y + 0.5, ARM_Z + 2, ARM_Z + 7, 22, P), { tone: "lo" }));
  for (const dx of [14, 26, 38]) {
    out.push(D([at([x0 + dx, -ARM_Y + 1.5, ARM_Z + ARM_H])], { size: 0.4 }));
  }
  return out.join("");
}

function elbowJoint() {
  const x = 4 + L1;
  const out = [];
  out.push(S(k.cylinder(x, 0, 9, ARM_Z - 1, ARM_H + 2, P, 40), { tone: "hi" }));
  out.push(L(k.ring(x, 0, 9, ARM_Z + ARM_H + 1, P, 40), { tone: "lo" }));
  out.push(S(k.slabOf({ x: x - 2, y: -11, w: 4, d: 22, r: 1.2 }, ARM_Z + 1, 5, P, 3), { tone: "mid" }));
  for (let i = -2; i <= 2; i++) {
    out.push(D([at([x + i * 2.2, 10, ARM_Z + 6])], { size: 0.38 }));
  }
  return out.join("");
}

function forearm() {
  const out = [];
  const x0 = 2;
  const x1 = L2;
  const plan = { x: x0, y: -ARM_Y + 1, w: L2 - 2, d: (ARM_Y - 1) * 2, r: 2 };
  out.push(S(k.slabOf(plan, ARM_Z + 1, ARM_H - 1, P, 6, 0.7), { tone: "mid" }));
  out.push(L(k.lineOnTop([x0 + 4, 0], [x1 - 4, 0], ARM_Z + ARM_H, P), { tone: "faint" }));
  out.push(S(k.cylinder(x1, 0, 5.5, ARM_Z + 2, 6, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(x1, 0, 5.5, ARM_Z + 2, ARM_Z + 8, 26, P), { tone: "lo" }));
  return out.join("");
}

function gripper() {
  const out = [];
  const baseX = L2 + 2;
  const body = { x: baseX, y: -6, w: 12, d: 12, r: 2 };
  out.push(S(k.slabOf(body, ARM_Z + 2, 8, P, 5, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(baseX + 6, 0, 3.2, ARM_Z + 4, 5, P, 24), { tone: "lo" }));
  const fingerL = { x: baseX + 8, y: -5, w: 10, d: 4, r: 1.2 };
  const fingerR = { x: baseX + 8, y: 1, w: 10, d: 4, r: 1.2 };
  out.push(S(k.slabOf(fingerL, ARM_Z + 3, 3.5, P, 4, 0.45), { tone: "hi", lit: true }));
  out.push(S(k.slabOf(fingerR, ARM_Z + 3, 3.5, P, 4, 0.45), { tone: "hi", lit: true }));
  out.push(L(k.lineOnTop([baseX + 9, -3], [baseX + 16, -3], ARM_Z + 6.5, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([baseX + 9, 3], [baseX + 16, 3], ARM_Z + 6.5, P), { tone: "faint" }));
  out.push(
    S(k.cylinder(baseX + 2, -8, 2, ARM_Z + 6, 8, P, 20), { tone: "mid", crease: "none" }),
    S(k.cylinder(baseX + 2, 8, 2, ARM_Z + 6, 8, P, 20), { tone: "mid", crease: "none" }),
  );
  return out.join("");
}

const mountTransform = k.translateAlong(P, MOUNT);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A six-axis-style bench robot arm on a surface plate: a pedestal and turntable carry a shoulder yoke, an upper arm, an elbow, a forearm and a two-finger gripper. Drag to swing the base, lift the shoulder and bend the elbow; the readout shows joint angles in degrees.",
  body: [
    plate(),
    pedestal(),
    `<g data-part="swivel" transform="${mountTransform}">${shoulderMount()}<g data-part="upper">${upperArm()}${elbowJoint()}<g data-part="forearm">${forearm()}${gripper()}</g></g></g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const MOUNT = ${JSON.stringify(MOUNT)};
const L1 = ${L1}, L2 = ${L2};
const DEG = 180 / Math.PI;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const swivel = svg.querySelector('[data-part="swivel"]');
const upper = svg.querySelector('[data-part="upper"]');
const forearm = svg.querySelector('[data-part="forearm"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function axisPitch(angle) {
  const ex = axisVector(P, [1, 0, 0]);
  const ez = axisVector(P, [0, 0, 1]);
  const c = Math.cos(angle), s = Math.sin(angle);
  return [
    [ex[0] * c + ez[0] * s, ex[1] * c + ez[1] * s],
    [-ex[0] * s + ez[0] * c, -ex[1] * s + ez[0] * c],
  ];
}
function yawAt(pivot, angle) {
  const o = iso(pivot, P);
  const ex = axisVector(P, [1, 0, 0]);
  const ey = axisVector(P, [0, 1, 0]);
  const c = Math.cos(angle), s = Math.sin(angle);
  const x = [ex[0] * c + ey[0] * s, ex[1] * c + ey[1] * s];
  const y = [-ex[0] * s + ey[0] * c, -ex[1] * s + ey[0] * c];
  return \`translate(\${o[0]} \${o[1]}) matrix(\${x[0]} \${x[1]} \${y[0]} \${y[1]} 0 0) translate(\${-o[0]} \${-o[1]})\`;
}
function pitchAt(pivot, angle) {
  const o = iso(pivot, P);
  const [x, z] = axisPitch(angle);
  return \`translate(\${o[0]} \${o[1]}) matrix(\${x[0]} \${x[1]} \${z[0]} \${z[1]} 0 0) translate(\${-o[0]} \${-o[1]})\`;
}
function elbowChain(shoulder, elbow) {
  const hub = 4 + L1;
  const [xa] = axisPitch(shoulder);
  const tx = hub * xa[0], ty = hub * xa[1];
  const [xb, zb] = axisPitch(elbow);
  return \`translate(\${tx} \${ty}) matrix(\${xb[0]} \${xb[1]} \${zb[0]} \${zb[1]} 0 0)\`;
}
let yaw = 0.35, shoulder = 0.55, elbow = -0.35;
let target = { yaw: 0.35, shoulder: 0.55, elbow: -0.35 };
let touring = true, visible = false, frame = 0, last = 0, clock = 0, idleTimer = 0;
const tourAt = (t) => ({
  yaw: 0.25 + Math.sin(t * 0.45) * 0.55,
  shoulder: 0.35 + Math.sin(t * 0.7 + 1) * 0.35,
  elbow: -0.15 + Math.sin(t * 0.55 + 2) * 0.45,
});
function draw() {
  const mount = translateAlong(P, MOUNT);
  swivel.setAttribute("transform", mount + " " + yawAt([0, 0, 0], yaw));
  upper.setAttribute("transform", pitchAt([0, 0, 0], shoulder));
  forearm.setAttribute("transform", elbowChain(shoulder, elbow));
  const text =
    "base " + (yaw * DEG).toFixed(0) + "° · shoulder " + (shoulder * DEG).toFixed(0) + "° · elbow " + (elbow * DEG).toFixed(0) + "°";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    clock += dt;
    const t = tourAt(clock);
    target = t;
  }
  const k = calm ? 1 : 1 - Math.exp(-dt / 0.22);
  yaw += (target.yaw - yaw) * k;
  shoulder += (target.shoulder - shoulder) * k;
  elbow += (target.elbow - elbow) * k;
  draw();
  const settled = !touring && Math.abs(target.yaw - yaw) < 0.002 && Math.abs(target.shoulder - shoulder) < 0.002 && Math.abs(target.elbow - elbow) < 0.002;
  frame = visible && (!settled || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  target = next;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 4200);
  run();
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const u = clamp((event.clientX - box.left) / box.width, 0, 1);
  const v = clamp((event.clientY - box.top) / box.height, 0, 1);
  steer({
    yaw: -0.75 + u * 1.5,
    shoulder: 0.15 + v * 0.95,
    elbow: -0.55 + u * 0.35 + v * 0.55,
  });
});
stage.addEventListener("pointerleave", () => steer(target));
stage.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 0.08 : 0.04;
  let next = { ...target };
  if (event.key === "ArrowLeft") next.yaw -= step;
  if (event.key === "ArrowRight") next.yaw += step;
  if (event.key === "ArrowUp") next.shoulder += step;
  if (event.key === "ArrowDown") next.shoulder -= step;
  if (event.key === "[") next.elbow -= step;
  if (event.key === "]") next.elbow += step;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "[", "]"].includes(event.key)) return;
  event.preventDefault();
  steer(next);
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Robot arm",
  hint: "Drag to pose · [ ] elbow · arrows base & shoulder",
  readout: "base 20° · shoulder 32° · elbow −20°",
  keys: [{ mark: "lit", label: "Gripper fingers: the end effector" }],
  caption:
    "A bench robot arm on a surface plate. The pedestal turns with the base angle; the shoulder and elbow pitch in a vertical plane. All three joints follow the pointer with eased motion, or loop quietly when idle.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Robot arm: drag to pose the joints">${svg}</div>`,
});

const outName = theme === "light" ? "mechanical-arm-light.html" : "mechanical-arm.html";
writeFileSync(join(HERE, outName), k.pageHtml({ title: "Mechanical arm", theme, body, script: kitScript() + live }));
console.log("wrote", outName);

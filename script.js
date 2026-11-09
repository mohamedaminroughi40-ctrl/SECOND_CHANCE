/* =====================================================
   VIDEO SETTINGS — put your video files in /videos
   and change the file names here if yours are different.
   ===================================================== */
const VIDEOS = {
  intro: "videos/intro.mp4",            // plays when the website first loads

  // Background loops (muted, looping) behind each mission
  bg: {
    welcome:  "videos/bg-welcome.mp4",
    mission1: "videos/bg-mission1.mp4",
    mission2: "videos/bg-mission2.mp4",
    envA:     "videos/bg-environment-a.mp4",   // unsupportive classroom
    envB:     "videos/bg-environment-b.mp4",   // supportive classroom
    mission3: "videos/bg-mission3.mp4",
    mission4: "videos/bg-mission4.mp4",
    ending:   "videos/bg-ending.mp4"
  },

  // Mission 1 video: plays right AFTER the "Can you help Lena?" countdown,
  // before the "MISSION COMPLETE" card (only once per game).
  mission1Video: "videos/before-mission1.mp4",

  // Videos that play BEFORE a mission starts. Leave "" for no video.
  before: {
    1: "",
    2: "",
    3: "",
    4: ""
  },

  // Videos that play AFTER a mission is finished. Leave "" for no video.
  after: {
    1: "videos/after-mission1.mp4",
    2: "videos/after-mission2.mp4",
    3: "videos/after-mission3.mp4",
    4: "videos/after-mission4.mp4"
  }
};

/* Optional pictures (JPG/PNG). Shown while a video loads, so there is never a black gap.
   Leave a name out (or the file missing) and it is simply ignored.
   After a video ends, its LAST FRAME stays on screen automatically. */
VIDEOS.poster = {
  intro:    "images/intro.jpg",
  welcome:  "images/welcome.jpg",
  mission1: "images/mission1.jpg",
  mission2: "images/mission2.jpg",
  mission3: "images/mission3.jpg",
  envA:     "images/environment-a.jpg",
  envB:     "images/environment-b.jpg",
  mission4: "images/mission4.jpg",
  ending:   "images/ending.jpg"
};

/* ================= Helpers ================= */
const $ = id => document.getElementById(id);
let step = 0, helped = false, corrected = false, environment = "supportive", recovery = false;

/* ---------- Video layers (2 stacked <video>s that cross-fade) ----------
   Backgrounds AND cutscenes both play here, so the video is always
   behind the option bar. When a video ends it stays paused on its last
   frame until the next video is ready, then they cross-fade. */
let bgCurrent = null;
function loadLayer(src, o = {}) {
  const A = $("bgA"), B = $("bgB");
  const vis = A.classList.contains("on") ? A : (B.classList.contains("on") ? B : null);
  const next = vis === A ? B : A;
  if (!src) { o.onFail && o.onFail(); return null; }
  next.onended = null;
  next.loop = !!o.loop;
  next.muted = o.muted !== false;
  if (o.poster) next.poster = o.poster; else next.removeAttribute("poster");
  next.onerror = () => { next.onloadeddata = null; o.onFail && o.onFail(); };
  next.onloadeddata = () => {
    next.onloadeddata = null;
    next.classList.add("on");
    if (vis) { vis.classList.remove("on"); setTimeout(() => { if (!vis.classList.contains("on")) vis.pause(); }, 950); }
    o.onShow && o.onShow(next);
    next.play().catch(() => { o.onBlocked && o.onBlocked(next); });
  };
  next.src = src;
  next.load();
  return next;
}
function setBackground(key) {
  if (key === bgCurrent) return;
  const src = VIDEOS.bg[key];
  if (!src) return;
  bgCurrent = key;
  loadLayer(src, { loop: true, muted: true, poster: VIDEOS.poster[key] });
}

/* ---------- Sheet pop-up animation ---------- */
function popSheet() {
  const s = $("sheet");
  s.classList.remove("pop", "hide");
  void s.offsetWidth;            // restart animation
  s.classList.add("pop");
  s.scrollTop = 0;
}
function hideSheet() {
  const s = $("sheet");
  s.classList.remove("pop"); s.classList.add("hide");
}

/* ---------- Scene / UI ---------- */
const setScene = (tag, speaker, line, bg) => {
  $("sceneTag").textContent = tag;
  $("speaker").textContent = speaker;
  $("line").textContent = line;
  if (bg) setBackground(bg);
};
const setUI = (k, h, d, p, buttons) => {
  $("kicker").textContent = k; $("heading").textContent = h;
  $("description").textContent = d; $("prompt").textContent = p;
  $("buttons").innerHTML = buttons;
  $("progress").style.width = (Math.min(step, 5) / 5 * 100) + "%";
  $("status").textContent = step ? ("MISSION " + step + " / 5 · STORY IN PROGRESS") : "INTERACTIVE STORY · IDENTITY × AGENCY";
  popSheet();
};
const overlay = html => { $("overlayCard").innerHTML = html; $("overlay").classList.remove("hidden"); };
const closeOverlay = () => $("overlay").classList.add("hidden");

/* ================= Cutscene (plays in the background layer) ================= */
let cutNext = null, cutDone = true, cutEl = null;
function playCutscene(src, label, next, posterKey) {
  if (!src) { next && next(); return; }
  cutNext = next; cutDone = false;
  hideSheet();                                   // option bar slides down, video stays behind
  $("game").classList.add("cutting");
  $("cutLabel").textContent = label || "";
  $("cutPlay").classList.add("hidden");
  $("cutUI").classList.remove("hidden");
  bgCurrent = "cutscene:" + src;
  cutEl = loadLayer(src, {
    loop: false, muted: false, poster: VIDEOS.poster[posterKey],
    onShow: v => { v.onended = finishCutscene; },
    onBlocked: () => $("cutPlay").classList.remove("hidden"),   // browser blocked sound autoplay
    onFail: finishCutscene                                       // missing file → skip on
  });
}
function cutPlayClick() {
  if (!cutEl) return;
  cutEl.muted = false;
  cutEl.play().then(() => $("cutPlay").classList.add("hidden")).catch(finishCutscene);
}
function finishCutscene() {
  if (cutDone) return;
  cutDone = true;
  if (cutEl) { cutEl.onended = null; cutEl.pause(); }    // pause = last frame stays on screen
  $("game").classList.remove("cutting");
  $("cutUI").classList.add("hidden");
  const n = cutNext; cutNext = null;
  n && n();                                              // next scene: bar pops up over the last frame
}
/* After a mission: play its cutscene, then continue */
const afterMission = n => playCutscene(VIDEOS.after[n], "MISSION " + n + " · COMPLETE", n < 4 ? () => go(n + 1) : ending);

/* Start mission n: plays its "before" video first (if you set one), then the mission */
const go = n => {
  const start = [null, mission1, mission2, mission3, mission4][n];
  playCutscene(VIDEOS.before[n], "MISSION " + n + " · INTRO", start);
};

/* ================= Story ================= */
function showWelcome() {
  step = 0;
  setScene("CINEMATIC STORY", "NARRATOR", "A new school day. A new chance.", "welcome");
  setUI("WELCOME TO THE STORY", "A NEW CHANCE",
    "Lena believes she is a weak English learner. Today, your choices and her actions will shape what happens next.",
    "Your mission: help Lena discover that she has a voice worth sharing.",
    `<button class="primary center" onclick="startGame()">▶ START GAME</button>`);
}
function startGame() { step = 1; go(1); }

function mission1() {
  setScene("MISSION 1 · FIRST OPPORTUNITY", "TEACHER", "Lena, would you like to answer this question?", "mission1");
  setUI("MISSION 1 · FIRST OPPORTUNITY", "The teacher calls on Lena",
    "Lena knows the answer. But her heart beats faster, and she is afraid of making a mistake.",
    "The scene pauses on Lena’s hesitant expression. What should the class do?",
    `<button class="good" onclick="helpLena()">YES — LET’S HELP LENA</button><button onclick="letDecide()">LET LENA DECIDE</button>`);
}
let callVideoSeen = false;
/* Mission 1 video: plays right after the countdown, before the "MISSION COMPLETE" card */
function afterCountdown(fn) {
  if (callVideoSeen || !VIDEOS.mission1Video) { fn(); return; }
  callVideoSeen = true;
  playCutscene(VIDEOS.mission1Video, "MISSION 1 · VIDEO", fn);
}
function helpLena() {
  helped = true;
  setScene("MISSION 1 · SUPPORT HER", "LENA", "I… I think I know the answer.");
  hideSheet();
  overlay(`<div class="kicker">AUDIENCE PARTICIPATION</div><h2>Can you help Lena?</h2><p>When the conductor counts to three, everyone shout together:</p><div class="count" id="count">3</div><div class="chant hidden" id="chant">GO, LENA! GO, LENA!</div><p id="countText">Get ready…</p><button class="primary center" onclick="beginCount()">START THE COUNTDOWN</button>`);
}
function beginCount() {
  let n = 3;
  $("countText").textContent = "Count together!";
  $("count").textContent = n;
  const timer = setInterval(() => {
    n--;
    if (n > 0) { $("count").textContent = n; }
    else {
      clearInterval(timer);
      $("count").classList.add("hidden");
      $("chant").classList.remove("hidden");
      $("countText").textContent = "Shout it together!";
      setTimeout(() => {
        closeOverlay();
        afterCountdown(() => {
          step = 2;
          setScene("MISSION COMPLETE · FIRST COURAGE", "LENA", "Okay… I’ll try. The answer is…");
          setUI("MISSION COMPLETE", "She raises her hand!",
            "Your encouragement helped create a supportive moment. Lena still chose to take the action herself.",
            "Identity can influence agency — and support can make action feel possible.",
            `<button class="primary center" onclick="afterMission(1)">CONTINUE TO MISSION 2 →</button>`);
          $("progress").style.width = "40%";
        });
      }, 2200);
    }
  }, 900);
}
function letDecide() {
  setScene("MISSION 1 · HER CHOICE", "NARRATOR", "Lena looks around. The room feels quiet.");
  setUI("A MOMENT OF CHOICE", "Give Lena a little time",
    "No one pressures her. She takes a breath and decides whether she is ready.", "What should happen?",
    `<button class="good" onclick="helpLena()">OFFER ENCOURAGEMENT</button><button class="bad" onclick="missed()">MOVE ON WITHOUT HER</button>`);
}
function missed() {
  setScene("OPPORTUNITY MISSED", "LENA", "Maybe next time…");
  setUI("OPPORTUNITY MISSED", "The chance passes",
    "Lena keeps her answer in her notebook. Her belief that she is a weak learner grows stronger.",
    "You can rewind this moment and choose to support her.",
    `<button class="primary center" onclick="mission1()">↺ REWIND SCENE</button>`);
}

function mission2() {
  step = 2;
  setScene("MISSION 2 · A MISTAKE", "LENA", "Yesterday, I go to the library.", "mission2");
  setUI("MISSION 2 · MISTAKES ARE PART OF LEARNING", "Lena makes a mistake",
    "She said “go” instead of “went.” The camera freezes. What should Lena do now?", "Choose her next action:",
    `<button class="good" onclick="tryAgain()">A. TRY AGAIN — CORRECT THE SENTENCE</button><button class="bad" onclick="giveUp()">B. GIVE UP — STOP PARTICIPATING</button>`);
}
function tryAgain() {
  corrected = true; step = 3;
  setScene("MISSION 2 · TRY AGAIN", "LENA", "Yesterday, I went to the library. Oh! I corrected it.");
  setUI("MISSION COMPLETE · FIRST ACHIEVEMENT UNLOCKED", "She corrects herself!",
    "Lena notices that a mistake is not proof that she cannot learn. It is part of learning.",
    "Achievement unlocked: “I made a mistake, but I corrected it. I can improve.”",
    `<button class="primary center" onclick="afterMission(2)">CONTINUE TO MISSION 3 →</button>`);
  $("progress").style.width = "60%";
}
function giveUp() {
  setScene("MISSION 2 · SETBACK", "LENA", "I’m sorry… I don’t want to try anymore.");
  setUI("A SETBACK", "Lena feels discouraged",
    "Giving up makes her old belief stronger. But one setback does not have to define her journey.",
    "Would you give Lena another chance?",
    `<button class="good" onclick="tryAgain()">YES — LET HER REDO IT</button><button class="primary center" onclick="afterMission(2)">CONTINUE THE STORY</button>`);
}

function mission3() {
  step = 3;
  setScene("MISSION 3 · THE CLASSROOM", "NARRATOR", "The teacher invites Lena to share another idea.", "mission3");
  setUI("MISSION 3 · ENVIRONMENT MATTERS", "Choose Lena’s classroom",
    "The classroom environment can either restrict or support her agency. Choose the scene you want Lena to experience.",
    "Which environment should she learn in?",
    `<button class="bad" onclick="envA()">A. UNSUPPORTIVE CLASSROOM</button><button class="good" onclick="envB()">B. SUPPORTIVE CLASSROOM</button>`);
}
function envA() {
  environment = "unsupportive";
  setScene("ENVIRONMENT A · UNSUPPORTIVE", "CLASSMATE", "That’s wrong!", "envA");
  setUI("ENVIRONMENT A", "Lena withdraws",
    "A classmate laughs. The teacher interrupts. Lena lowers her eyes and decides not to share her next idea.",
    "This environment discourages action. Would you like to change the classroom?",
    `<button class="good" onclick="mission3()">↺ CHOOSE A DIFFERENT ENVIRONMENT</button><button class="primary center" onclick="afterMission(3)">CONTINUE →</button>`);
}
function envB() {
  environment = "supportive";
  setScene("ENVIRONMENT B · SUPPORTIVE", "TEACHER", "Take your time, Lena. We’re listening.", "envB");
  setUI("ENVIRONMENT B", "Lena feels supported",
    "Her classmates listen respectfully. The teacher gives her time. Lena shares her idea, even though she is not completely sure.",
    "A supportive environment opens space for agency — Lena still takes the action.",
    `<button class="primary center" onclick="afterMission(3)">CONTINUE TO MISSION 4 →</button>`);
}

function mission4() {
  step = 4;
  setScene("MISSION 4 · A NEW CHANCE", "TEACHER", "Who can tell us another example?", "mission4");
  setUI("MISSION 4 · TAKE THE INITIATIVE", "Lena acts on her own",
    "No one prompts her. Lena remembers that she can learn and improve. She raises her hand by herself.",
    "What happens next?",
    `<button class="good" onclick="independent()">LET LENA PARTICIPATE</button><button onclick="pauseMoment()">PAUSE — SHOW HER INNER THOUGHT</button>`);
}
function pauseMoment() {
  setScene("INNER VOICE · LENA", "LENA’S INNER VOICE", "I might make mistakes, but I can learn. I have something to say.");
  setUI("HER INNER VOICE", "A new belief is forming",
    "Her identity is changing through her actions and experiences.", "Continue Lena’s final moment.",
    `<button class="primary center" onclick="independent()">CONTINUE →</button>`);
}
function independent() {
  step = 5;
  setScene("MISSION COMPLETE · A NEW IDENTITY", "LENA", "I have an idea. May I share it?");
  setUI("MISSION COMPLETE", "Lena raises her hand independently",
    "Her agency has grown, and her identity is no longer fixed by her earlier belief.",
    "Identity and agency influence each other in a continuous relationship.",
    `<button class="primary center" onclick="afterMission(4)">▶ WATCH THE ENDING</button>`);
  $("progress").style.width = "100%";
}
function ending() {
  setScene("FINAL CINEMATIC · LENA’S MESSAGE", "LENA",
    "Thank you for giving me a new chance. I can learn. I can improve. And I have a voice worth sharing.", "ending");
  setUI("THE END · YOUR JOURNEY CONTINUES", "A NEW CHANCE",
    "Lena’s journey reminds us: the way learners see themselves can influence what they do, and their actions can transform how they see themselves.",
    "IDENTITY ↔ AGENCY · THE RELATIONSHIP BETWEEN IDENTITY AND AGENCY IN LANGUAGE LEARNING",
    `<button class="primary center" onclick="restart()">↺ PLAY AGAIN</button>`);
  $("footLeft").textContent = "GAME COMPLETE · 5 MISSIONS";
}
function restart() {
  helped = false; corrected = false; environment = "supportive"; callVideoSeen = false;
  $("footLeft").textContent = "5 MISSIONS · CLASSROOM STORY";
  showWelcome();
  $("progress").style.width = "0%";
}

/* ================= Boot: intro video first ================= */
window.addEventListener("load", () => {
  playCutscene(VIDEOS.intro, "INTRO", showWelcome, "intro");
});
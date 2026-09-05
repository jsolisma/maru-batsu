/* Headless test harness for Maru Batsu.
   Loads the real index.html in jsdom, stubs the browser APIs the app touches
   (audio, speech, vibration), and drives it by clicking actual buttons — so
   these tests exercise the UI layer, not a stripped-down copy of the logic. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const HTML = path.join(__dirname, "index.html");

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (detail ? " — " + detail : "")); }
}

// stub the APIs jsdom lacks, before the app's script runs
function stubs(w) {
  w.AudioContext = function () {
    return {
      state: "running", currentTime: 0, resume() {}, destination: {},
      createOscillator: () => ({ type: "", frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }),
      createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} })
    };
  };
  w.speechSynthesis = { getVoices: () => [], speak() {}, cancel() {}, onvoiceschanged: null };
  w.SpeechSynthesisUtterance = function () {};
  w.navigator.vibrate = () => true;
  w.confirm = () => true;
}

function load(seed) {
  // run the page as a real script so top-level declarations land in the
  // global lexical scope, the way they do in a browser
  const dom = new JSDOM(fs.readFileSync(HTML, "utf8"), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://example.test/",
    beforeParse(w) {
      stubs(w);
      let s = seed || 1;
      w.Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    }
  });
  return dom.window;
}

const $ = (w, id) => w.document.getElementById(id);
const visible = el => el && !el.hidden;
const tiles = w => [...$(w, "answers").children];

// ── 1. first paint ───────────────────────────────────────────────
{
  const w = load();
  check("boots without throwing", !!$(w, "glyph"));
  check("a question is on screen", $(w, "glyph").textContent.length > 0);
  check("four answer buttons", tiles(w).length === 4, "got " + tiles(w).length);
  check("slots hidden on a character question", !visible($(w, "slots")));
  check("level chip is a button", $(w, "levelChip").tagName === "BUTTON");
}

// ── 2. answering ─────────────────────────────────────────────────
{
  const w = load();
  const before = $(w, "scoreLabel").textContent;
  tiles(w)[0].click();
  check("answer marks the button", /right|wrong/.test(tiles(w)[0].className));
  check("all buttons disabled after answering", tiles(w).every(b => b.disabled));
  check("feedback line is filled in", $(w, "reading").textContent.trim().length > 1);
  check("score label updates", $(w, "scoreLabel").textContent !== before);
  const stamp = $(w, "stamp");
  check("stamp shows", stamp.classList.contains("show"));
  check("stamp is maru or batsu", /circle|line/.test(stamp.innerHTML));
}

// ── 3. the stuck-tiles regression ────────────────────────────────
{
  const w = load(7);
  // force course order so spelling questions appear at level 1
  w.eval('S.order="course"; S.ladder=true; newRound();');
  let sawWord = false;
  for (let i = 0; i < 400; i++) {
    if ($(w, "ask").textContent === "Spell this word") {
      sawWord = true;
      const t = tiles(w);
      t.forEach(b => { if (!b.disabled) b.click(); });   // fill the slots
      w.eval("next();");                                  // move on immediately
      check("slots hidden again on the next character question",
            $(w, "ask").textContent === "Spell this word" || !visible($(w, "slots")));
      check("no stale tiles left behind",
            $(w, "ask").textContent === "Spell this word" || $(w, "slots").children.length === 0);
      break;
    }
    const t = tiles(w); (t.find(b => !b.disabled) || t[0]).click();
    w.eval("next();");
  }
  check("spelling questions do appear", sawWord);
}

// ── 4. spelling question integrity ───────────────────────────────
{
  const w = load(3);
  w.eval('S.order="course"; S.ladder=true; newRound();');
  let checked = 0;
  for (let i = 0; i < 600 && checked < 5; i++) {
    if ($(w, "ask").textContent === "Spell this word") {
      const pool = w.eval("activePool().map(c=>c.ch)");
      const target = w.eval("q.target.join('')");
      const tileChars = tiles(w).map(b => b.textContent);
      check("every tile is an unlocked character", tileChars.every(c => pool.includes(c)),
            "tiles " + tileChars.join(",") + " pool " + pool.join(","));
      check("slot count matches the word", $(w, "slots").children.length === w.eval("q.target.length"));
      check("the word is spellable from the tiles",
            w.eval("q.target").every(u => tileChars.includes(u)), target);
      checked++;
    }
    const t = tiles(w); (t.find(b => !b.disabled) || t[0]).click();
    w.eval("next();");
  }
  check("saw several spelling questions", checked >= 5, "saw " + checked);
}

// ── 5. spelling correctly is scored correctly ────────────────────
{
  const w = load(11);
  w.eval('S.order="course"; S.ladder=true; newRound();');
  for (let i = 0; i < 400; i++) {
    if ($(w, "ask").textContent === "Spell this word") {
      const target = w.eval("q.target");
      const word = w.eval("q.word[0]");
      const okBefore = w.eval(`(S.wordStats["${word}"]||{ok:0}).ok`);
      target.forEach(u => {
        const b = tiles(w).find(x => x.textContent === u && !x.disabled);
        if (b) b.click();
      });
      check("correct spelling is counted",
            w.eval(`S.wordStats["${word}"].ok`) === okBefore + 1);
      check("slots turn green", [...$(w, "slots").children].every(s => s.classList.contains("ok")));
      break;
    }
    const t = tiles(w); (t.find(b => !b.disabled) || t[0]).click();
    w.eval("next();");
  }
}

// ── 6. undo ──────────────────────────────────────────────────────
{
  const w = load(5);
  w.eval('S.order="course"; S.ladder=true; newRound();');
  for (let i = 0; i < 400; i++) {
    if ($(w, "ask").textContent === "Spell this word" && w.eval("q.target.length") > 1) {
      tiles(w).find(b => !b.disabled).click();
      check("a tile fills a slot", $(w, "slots").children[0].textContent.length > 0);
      w.eval("undoTile()");
      check("undo clears the slot", $(w, "slots").children[0].textContent === "");
      check("undo re-enables the tile", tiles(w).some(b => !b.disabled && !b.classList.contains("used")));
      break;
    }
    const t = tiles(w); (t.find(b => !b.disabled) || t[0]).click();
    w.eval("next();");
  }
}

// ── 7. level picker ──────────────────────────────────────────────
{
  const w = load();
  w.eval('S.order="course"; S.ladder=true; newRound();');
  $(w, "levelChip").click();
  check("picker opens", $(w, "sheetLevels").classList.contains("show"));
  const btns = [...$(w, "lvGrid").children];
  check("one button per level", btns.length === w.eval("deck().length") - 1);
  // pick the button labelled "5" and confirm the header agrees
  const five = btns.find(b => b.querySelector("span").textContent === "5");
  five.click();
  check("picking level 5 gives level 5", $(w, "levelLabel").textContent === "Level 5",
        "header says " + $(w, "levelLabel").textContent);
  check("level 5 means 6 characters", w.eval("activePool().length") === 6);
  check("picker closes after choosing", !$(w, "sheetLevels").classList.contains("show"));
  // and back down
  $(w, "levelChip").click();
  [...$(w, "lvGrid").children].find(b => b.querySelector("span").textContent === "2").click();
  check("jumping back works", $(w, "levelLabel").textContent === "Level 2");
}

// ── 8. ladder keys don't collide across orders ───────────────────
{
  const w = load();
  const keys = w.eval(`
    (()=>{const out=[];
      [["gojuon",1,0],["freq",1,0],["course",1,0],["gojuon",1,1],["gojuon",0,1]].forEach(c=>{
        S.order=c[0]; S.sets={hira:!!c[1],kata:!!c[2]}; out.push(courseKey());
      }); return out;})()`);
  check("every order/set combination has its own key", new Set(keys).size === keys.length, keys.join(","));

  // the reported bug: gojuon's word leaking into course order
  w.eval('S.order="gojuon"; S.sets={hira:true,kata:false}; S.extras={dakuten:false,yoon:false}; setLevel(2); featuredWords();');
  w.eval('S.order="course"; newRound();');
  const spellable = w.eval(`
    (()=>{const have=new Set(activePool().map(c=>c.ch));
      return featuredWords().every(x=>units(x[0]).every(u=>have.has(u)));})()`);
  check("featured words are always spellable with the current pool", spellable);
}

// ── 9. unlocking ─────────────────────────────────────────────────
{
  const w = load();
  w.eval('S.order="course"; S.ladder=true; setLevel(2);');
  const before = w.eval("level()");
  // bank every requirement, then answer once to trigger the check
  w.eval(`
    activePool().forEach(c=>{ const r=rec(c.ch); r.lok=TO_UNLOCK; });
    featuredWords().forEach(x=>{ const r=wrec(x[0]); r.lok=WORD_GOAL; });
  `);
  const gained = w.eval("checkUnlock()");
  check("meeting both gates unlocks exactly one character", gained.length === 1);
  check("level advanced by one", w.eval("level()") === before + 1);
  check("character counts reset on unlock", w.eval("activePool().every(c=>okCount(c.ch)===0)"));
  check("word counts reset on unlock", w.eval("Object.values(S.wordStats).every(r=>r.lok===0)"));
  // and the gate really is a gate
  w.eval("activePool().forEach(c=>{ rec(c.ch).lok=TO_UNLOCK; });");
  check("characters alone don't unlock while words are owed",
        w.eval("featuredWords().length===0 || checkUnlock().length===0"));
}

// ── 10. persistence (writes are debounced, so this one waits) ────
async function persistence() {
  const w = load();
  w.eval('S.order="course"; setLevel(9); save();');
  await new Promise(r => setTimeout(r, 300));
  const raw = w.localStorage.getItem("maru-batsu.v1");
  check("state is written to localStorage", !!raw);
  const saved = JSON.parse(raw);
  check("level is stored under the course key", saved.levels["#c"] === 9, JSON.stringify(saved.levels));
  check("stored keys are the documented ones",
        ["sets","extras","dir","voice","beeps","order","ladder","levels","featured","wordStats","stats"]
          .every(k => k in saved));

  // a reload must come back to the same place
  const w2 = load();
  w2.localStorage.setItem("maru-batsu.v1", raw);
  const w3 = load();
  w3.localStorage.setItem("maru-batsu.v1", raw);
  w3.eval("S = load();");
  check("reloading restores the saved level", w3.eval('S.order="course", level()') === 9,
        "got " + w3.eval('S.order="course", level()'));
}

// ── 11. no ambiguous character questions ─────────────────────────
{
  const w = load(13);
  w.eval('S.order="course"; S.dir="romaji2kana"; S.ladder=false; newRound();');
  let bad = 0, seen = 0;
  for (let i = 0; i < 300; i++) {
    if ($(w, "ask").textContent !== "Spell this word") {
      const labels = tiles(w).map(b => b.textContent.replace(/^\d/, ""));
      if (new Set(labels).size !== labels.length) bad++;
      seen++;
    }
    const t = tiles(w); (t.find(b => !b.disabled) || t[0]).click();
    w.eval("next();");
  }
  check("no duplicate options in sound → character mode", bad === 0, bad + " of " + seen);
}

// ── 12. settings round-trip ──────────────────────────────────────
{
  const w = load();
  $(w, "btnSettings").click();
  check("settings open", $(w, "sheetSettings").classList.contains("show"));
  const orderChips = [...$(w, "orderRow").children];
  check("three unlock orders offered", orderChips.length === 3);
  orderChips[2].click();                       // course order
  check("selecting course order sticks", w.eval("S.order") === "course");
  $(w, "closeSettings").click();
  check("settings close and a round starts", !$(w, "sheetSettings").classList.contains("show"));
  check("a question is showing after the settings close", $(w, "glyph").textContent.length > 0);
}

persistence().then(() => {
console.log("\n" + "─".repeat(52));
console.log(`  ${pass} passed, ${fail} failed`);
if (failures.length) { console.log("\nFAILURES:"); failures.forEach(f => console.log("  ✕ " + f)); }
console.log("─".repeat(52));
process.exit(fail ? 1 : 0);
});

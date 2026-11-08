/* 철학과 키우기 — 엔진 (돈 단위: 만원) */
const $ = s => document.querySelector(s);
const rnd = Math.random, R = (a, b) => Math.floor(rnd() * (b - a + 1)) + a, pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randn = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const lognorm = (mu, s) => Math.exp(mu + s * randn());
function won(n) { const neg = n < 0; n = Math.abs(n); let s; if (n >= 1e8) s = (n / 1e8).toFixed(1).replace(/\.0$/, '') + '조'; else if (n >= 1e4) s = (n / 1e4).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + '억'; else s = Math.round(n).toLocaleString() + '만'; return (neg ? '-' : '') + s + '원'; }
const num = n => Math.floor(n).toLocaleString();
const pct = p => (p * 100 < 10 ? (p * 100).toFixed(1) : Math.round(p * 100)) + '%';

const MONTH_SEC = 25, SAVE_KEY = 'philoLife_v6', END_KEY = 'philoEnds_v6';
let S = null, speed = 1, paused = false, monthT = 0, tab = 'home';
let SEEN = {}; try { SEEN = JSON.parse(localStorage.getItem(END_KEY)) || {}; } catch (e) {}
const C = () => COUNTRIES[S.c];
const node = () => NODES[S.pos];
const age = () => 22 + Math.floor(S.months / 12);
const vm = k => 1 + S.val[k] * .15;
const rentNow = () => Math.round(HOUSES[S.house].rent * C().rent);
const living = () => C().live + rentNow() + Math.round((S.kids || 0) * 50 * C().live / 110);
const nodeName = k => k === 'pressprep' ? C().press.prep : k === 'tprep' ? C().teach.prep : k === 'teacher' ? C().teach.job : k === 'lawprep' ? (C().law ? C().law.prep : '로스쿨') : k === 'lawyer' ? (C().law ? C().law.job : '변호사') : k === 'lecturer' ? C().lec.n : NODES[k].n;
const ranksOf = k => k === 'teacher' ? C().teach.ranks : NODES[k].ranks;
const rankName = (k = S.pos) => { const r = ranksOf(k); return r ? r[rankIdx(k)] : nodeName(k); };
const needOf = k => k === 'tutor' ? Math.max(8, S.tu.st * 4) : k === 'counselor' ? Math.max(6, S.cs.cl * 2) : 0;
function W() { return needOf(S.pos) || node().W || 0; }
const SIDE_OK = ['alba', 'tutor', 'writer', 'youtube', 'counselor', 'speaker'];
const isSide = k => S.sides.includes(k);
const act = () => (S.tgt !== 'main' && isSide(S.tgt)) ? S.tgt : S.pos;
const rankIdx = k => k === 'writer' ? S.wr.rank : k === 'youtube' ? S.yt.rank : k === 'counselor' ? S.cs.rank : k === 'speaker' ? S.sp.rank : S.rank;
const expMonths = () => ['journalist', 'editor', 'ngo', 'aiethics', 'company', 'civil', 'teacher', 'instructor', 'academy', 'lecturer', 'professor', 'lawyer', 'startup', 'union'].reduce((a, k) => a + (S.hist[k] || 0), 0);
function addSide(k, quiet) {
  if (!SIDE_OK.includes(k) || isSide(k) || S.pos === k) return false;
  if (S.sides.length >= 2) { if (!quiet) toast('부업은 2개까지. 하나를 정리하자.'); return false; }
  S.sides.push(k); S.tgt = k; if (k === 'tutor') S.tu.st = S.tu.st || 0;
  say(`➕ 부업 시작: ${NODES[k].e} ${NODES[k].n}`); render(); return true;
}
function removeSide(k) { S.sides = S.sides.filter(x => x !== k); if (S.tgt === k) S.tgt = 'main'; say(`➖ 부업 정리: ${NODES[k].n}`); render(); }

/* ───────── 새 인생 ───────── */
function newLife(c, name) {
  S = { c, name, y: 2026, m: 3, months: 0, mo: COUNTRIES[c].start || 0, fa: 0, hp: 100, mental: 75,
    st: { study: 5, speak: 3, work: 3 }, pos: 'none', rank: 0, posMonths: 0, rankMonths: 0, hist: {}, done: {}, it: {}, house: 0, partner: 0,
    val: { money: 0, wisdom: 0, people: 0 }, econ: 1, trend: 1, burnouts: 0, rest: 0, work: 0, tgt: 'main',
    tu: { st: 0 }, wr: { ms: 0, books: 0, sales: 0, best: 0, royal: [], sell: 1, rej: 0, rank: 0 }, yt: { subs: 0, prog: 0, videos: 0, months: 0, last: 0, bait: 1, warned: {}, rank: 0 },
    su: { cash: 0, buff: 0 }, ac: { st: 8, low: 0 }, law: { phase: 'admit', m: 0, tries: 0 }, papers: 0, perfSum: 0, perfN: 0, fails: 0,
    sides: [], wk: {}, cs: { cl: 0, rank: 0 }, sp: { prog: 0, talks: 0, rank: 0 }, kids: 0, married: 0,  huntMonths: 0, lecMonths: 0, lecApply: 0, lecCut: 0, sagesDone: {}, ends: {}, topEnd: null, log: [], chicken: 0, courseM: {}, lastNet: null };
  Object.keys(NODES).forEach(k => S.hist[k] = 0);
}

/* ───────── 능력치 ───────── */
function grow(k, base) {
  let a = base * (1 - S.st[k] / 110) * (S.it.mac ? 1.25 : 1) * (C()[k] || 1);
  if (k === 'study') a *= vm('wisdom');
  if (S.mental < 20) a *= .5;
  const before = Math.floor(S.st[k]); S.st[k] = clamp(S.st[k] + a, 0, 100);
  return Math.floor(S.st[k]) > before;
}

/* ───────── 탭 = 노동 ───────── */
function tap(e) {
  if (busy() || paused || !S) return;
  if (S.rest > 0) { toast('😵 번아웃으로 쉬는 중… (' + S.rest + '개월)'); return; }
  if (S.hp < 1) { pop(e, '지쳤다… 잠깐 쉬자', '#ff6b6b'); return; }
  S.hp -= 1; let label = ''; if (S.it.chair) S.hp += .25;
  const k = act(), main = k === S.pos, n = NODES[k];
  if (k === 'alba' && !main) {
    const g = C().pay.alba / 20; S.mo += g; label = '+' + won(g);
    if (grow('work', .01)) label += ` · 📊 실무 ${Math.floor(S.st.work)}!`;
  } else if (k === 'none') { label = '🤔 생각 중…'; if (grow('study', .03)) label = `🧠 학문 ${Math.floor(S.st.study)}!`; }
  else {
    S.wk[k] = (S.wk[k] || 0) + 1; if (main) S.work++;
    const w = main ? W() : needOf(k), cnt = main ? S.work : S.wk[k];
    const up = grow(n.stat, w && cnt > w ? .012 : main ? .025 : .02);
    if (main && (S.pos === 'startup' || S.pos === 'lawyer')) grow('speak', .01);
    if (main && S.pos === 'company') grow('speak', .008);
    label = up ? `${STATS[n.stat].e} ${STATS[n.stat].n} ${Math.floor(S.st[n.stat])}!` : (w ? `노동 ${cnt}/${w}` : '');
    if (k === 'writer') { S.wr.ms = Math.min(100, S.wr.ms + .15 + S.st.study / 250); if (!up) label = `✍️ 원고 ${Math.floor(S.wr.ms)}%`; if (S.wr.ms >= 100 && !S.wr.told) { S.wr.told = 1; say('📄 원고 완성! 홈에서 투고할 수 있다.'); } }
    if (k === 'youtube') { S.yt.prog += 2 + S.st.speak / 12; if (!up) label = `🎬 편집 ${Math.min(100, Math.floor(S.yt.prog))}%`; if (S.yt.prog >= 100) upload(); }
    if (k === 'speaker') { S.sp.prog += 2 + S.st.speak / 15; if (!up) label = `🎤 강연 준비 ${Math.min(100, Math.floor(S.sp.prog))}%`; if (S.sp.prog >= 100) talk(); }
    if (w && cnt === w) label = '✔ 이번 달 노동 완료!'; else if (w && cnt > w && !up) label = `💪 추가 노동 (${STATS[n.stat].n} ↑)`;
  }
  pop(e, label); bump(); draw();
}

/* ───────── 월말 정산 ───────── */
function monthEnd() {
  const n = node(), w = W(), P = C().pay; let ratio = w ? Math.min(1, S.work / w) : 1;
  if (S.leave > 0) { S.leave--; ratio = 1; if (!S.leave) say('👶 육아휴직 끝. 다시 출근.'); }
  let inc = 0, out = living();
  if (S.rest > 0) S.rest--;
  if (S.careCost > 0) { S.careCost--; out += Math.round(150 * C().live / 110); }
  if (S.care > 0) { S.care--; if (!S.care) say('🏥 부모님이 많이 나아지셨다. 다시 내 삶으로.'); }
  S.months++; S.m++; if (S.m > 12) { S.m = 1; S.y++; }
  S.hist[S.pos] = (S.hist[S.pos] || 0) + 1; S.posMonths++; S.rankMonths++;
  const yearly = (S.posMonths % 12 === 0);

  switch (S.pos) {
    case 'alba': inc = P.alba * (1 + .1 * S.rank) * ratio;
      if (S.rank < 4 && S.rankMonths >= 6 && ratio >= 1 && rnd() < .25) { S.rank++; S.rankMonths = 0; say(`🎉 알바 레벨업: ${n.ranks[S.rank]}`); } break;
    case 'hunt': { S.huntMonths++;
      if (ratio >= 1) {
        const shin = C().shinsotsu ? (S.months <= 12 ? 2 : .45) : 1;
        const exp = Math.min(.08, expMonths() / 500), p = clamp((.02 + S.st.work / 450 + (S.huntBuff || 0) + exp) * S.econ * C().hunt * (exp > .02 ? Math.max(1, shin) : shin) * vm('money'), .01, .5);
        if (rnd() < p) modalMsg('🎉 최종 합격!', `${exp > .02 ? '경력직으로 ' : ''}취준 ${S.huntMonths}개월 만에. (이번 달 확률 ${pct(p)})<br>"철학과요? 질문 많이 하시겠네요."${exp > .02 ? '<br>이전 경력 덕분에 대리로 입사!' : ''}`, () => { setPos('company'); if (exp > .02) S.rank = 1; });
        else { S.mental -= 4; say(pick(['📩 "귀하의 뛰어난 역량에도 불구하고…"', '📩 서류 탈락. 자소서의 "실존"이 문제였을까.', '📩 최종 면접 탈락. "질문이 너무 많으셨어요."', '📩 인적성 탈락. 가족유사성 때문이다.']) + ` (확률 ${pct(p)})`); }
      } else say('📝 이번 달엔 노동을 다 못 채워서 지원서를 못 냈다.');
      break; }
    case 'company': {
      inc = P.company * [1, 1.25, 1.55, 1.9, 2.8, 6][S.rank]; S.perfSum += ratio; S.perfN++;
      const need = (n.promoY[S.rank] || 99) * 12 / C().promo;
      if (S.m === 12 && S.rank < 5 && S.rankMonths >= need) {
        const perf = S.perfSum / Math.max(1, S.perfN);
        let p = (.15 + S.st.work / 350 + S.st.speak / 600 + (S.perfBonus || 0)) * perf * vm('money'); if (S.rank >= 3) p *= .4; p = clamp(p, .02, .75);
        if (rnd() < p) { S.rank++; S.rankMonths = 0; S.perfSum = S.perfN = 0; say(`🎉 ${n.ranks[S.rank]} 승진! (확률 ${pct(p)})`); if (S.rank >= 5) trigger('ceo'); }
        else { S.mental -= 8; say(`😶 승진 누락… (확률 ${pct(p)})`); }
      }
      if (S.leave > 0) {} else if (S.econ < .82 && rnd() < .008 * C().layoff) { S.mental -= 25; const sev = Math.round(inc * 4); say('📦 구조조정 통보를 받았다.'); modalMsg('📦 구조조정', `불황으로 희망퇴직 대상이 됐다. 위로금 ${won(sev)}.`, () => { S.mo += sev; setPos('none'); }); }
      break; }
    case 'gongsi':
      if (S.m === 4 && S.posMonths >= 6) {
        const p = clamp(.02 + S.st.work / 330, .02, .3) * (S.c === 'kr' ? 1.1 : 1);
        if (rnd() < p) modalMsg('🎉 공무원 시험 합격!', `합격 확률은 ${pct(p)}였다.`, () => setPos('civil'));
        else { S.mental -= 12; say(`📉 불합격… 커트라인과 0.5점 차이. (확률 ${pct(p)})`); }
      } break;
    case 'civil': inc = P.civil * [1, 1.25, 1.55, 1.95, 2.5, 3.2, 4.5][S.rank];
      if (S.m === 1 && S.rank < 6 && S.rankMonths >= n.promoY[S.rank] * 12) {
        const p = S.rank === 5 ? clamp(.03 + S.fa / 1e4, .03, .3) : clamp(.45 + S.st.work / 300, .1, .9);
        if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`🎉 ${n.ranks[S.rank]} 승진! (확률 ${pct(p)})`); if (S.rank >= 6) trigger('minister'); } else say(`😶 승진 심사 탈락 (확률 ${pct(p)})`);
      } break;
    case 'tprep': { const T = C().teach;
      if (T.ref) { if (S.posMonths >= T.ref && ratio >= .8) { if (rnd() < T.p[0]) modalMsg('🎉 수습 통과!', `${T.job}으로 임용됐다. 공무원 신분이다.`, () => setPos('teacher')); else say('📋 수습 평가 보류. 몇 달 더…'); } }
      else if (S.m === T.exam && S.posMonths >= 6) {
        const p = clamp(T.p[0] + S.st.study / T.p[1], .02, .85);
        if (rnd() < p) modalMsg('🎉 합격!', `${T.prep.split(' (')[0]} 합격. (확률 ${pct(p)}) 이제 ${T.job}이다.`, () => setPos('teacher'));
        else { S.mental -= 10; say(`📉 불합격. 내년에 다시. (확률 ${pct(p)})`); }
      } break; }
    case 'teacher': { const T = C().teach; inc = P.teacher * (1 + .15 * S.rank);
      if (T.agreg) {
        if (S.rank === 0 && S.m === 6 && S.rankMonths >= 24) { const p = clamp(.03 + S.st.study / 700, .03, .2); if (rnd() < p) { S.rank = 1; S.rankMonths = 0; say(`🎉 agrégation 합격! (확률 ${pct(p)})`); } else say(`📉 agrégation 불합격 (확률 ${pct(p)})`); }
        else if (S.rank === 1 && S.m === 9 && S.rankMonths >= 60 && S.st.study >= 65) { const p = .15 * vm('wisdom'); if (rnd() < p) { S.rank = 2; say('🎓 프레파(khâgne) 교수로 발탁!'); trigger('prepa'); } }
      } else if (S.m === 3 && S.rank < 3 && S.rankMonths >= 96) {
        const p = clamp(.3 + S.st.speak / 300, .1, .8); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`🎉 ${T.ranks[S.rank]}(으)로! (확률 ${pct(p)})`); if (S.rank >= 3) trigger('teacher'); }
      } break; }
    case 'tutor': inc = tutorMonth(S.work, () => setPos('none')); break;
    case 'instructor': inc = 300 * P.alba / 200 * ratio; break;
    case 'academy': {
      const a = S.ac, cap = [40, 120, 300, 700, 1500][S.rank];
      const g = a.st * (.022 + S.st.speak / 2000 + S.fa / 1e4) * vm('people') * S.econ * C().academy * (1 - a.st / cap) * (.4 + rnd() * 1.2);
      a.st = clamp(a.st + Math.round(g) + (rnd() < .35 ? 1 : 0) - Math.round(a.st * .012 * (ratio < .8 ? 3 : 1)) - (rnd() < .15 ? 1 : 0), 0, cap);
      inc = a.st * 30 * C().academy; out += Math.round(400 * (1 + S.rank * 1.5) * C().rent);
      const th = [0, 30, 90, 240, 600], yrs = [0, 24, 60, 120, 180];
      if (S.rank < 4 && a.st >= th[S.rank + 1] && S.posMonths >= yrs[S.rank + 1] && rnd() < .3) { S.rank++; say(`🏫 확장: ${n.ranks[S.rank]} (학생 ${a.st}명)`); if (S.rank >= 4) trigger('school'); }
      if (a.st < 3) a.low++; else a.low = 0;
      if (a.low >= 6) { say('🚪 학생이 없어 문을 닫았다…'); S.mental -= 25; setPos('none'); }
      break; }
    case 'master': inc = 50;
      if (S.posMonths % 6 === 1) out += C().phd.tuition;
      if (S.posMonths >= 24 && S.posMonths % 6 === 0) {
        if (S.st.study >= 25) { S.done.master = 1; modalChoice('🎓 석사 졸업!', '논문 통과. 이제 어디로?', [['박사과정 진학', () => setPos('phd')], ['여기까지', () => setPos('none')]]); }
        else { S.mental -= 10; say(`📄 논문 심사 탈락. 한 학기 연장… (학문 ${Math.floor(S.st.study)}/25)`); }
      } break;
    case 'phd': { const D = C().phd; inc = D.stipend; if (S.posMonths % 6 === 1) out += D.tuition;
      if (ratio >= .8) { const p = (S.st.study / 900 + (S.paperBuff || 0)) * vm('wisdom'); S.paperBuff = 0; if (rnd() < p) { S.papers++; S.fa += 3; say(`📄 논문 게재! (${S.papers}편, 확률 ${pct(p)})`); } }
      if (S.posMonths >= D.months - 12 && S.papers >= D.papers) { S.done.phd = 1; modalChoice('🎓 박사 학위!', `${(S.posMonths / 12).toFixed(1)}년 걸렸다.`, [[`${C().lec.n}로 임용에 도전`, () => setPos('lecturer')], ['학계를 떠난다', () => setPos('none')]]); }
      else if (S.posMonths >= D.months + 48) { S.mental -= 25; modalMsg('📜 수료…', '학위 없이 수료로 끝났다.', () => setPos('none')); }
      break; }
    case 'lecturer': { const L = C().lec; S.lecMonths++;
      if (S.lecCut > 0) { S.lecCut--; inc = 0; } else inc = (S.c === 'de' ? P.postdoc : P.lecturer);
      if ((S.m === 2 || S.m === 8) && rnd() < L.cut && S.lecCut === 0) { S.lecCut = 6; S.mental -= 8; say('📭 다음 학기 강의 배정이 없다. 6개월간 수입 0.'); }
      if (ratio >= .8 && rnd() < S.st.study / 1000 * vm('wisdom')) { S.papers++; say(`📄 논문 게재 (${S.papers}편)`); }
      if (S.m === 3 || S.m === 9) { S.lecApply++;
        const p = clamp(.004 + S.papers * .006 + S.st.study / 3000 + S.fa / 4e4, .003, .15) * L.p * Math.sqrt(S.econ);
        if (rnd() < p) modalMsg('🎉 교수 임용!', `${S.lecApply}번째 지원 만에. (확률 ${pct(p)})`, () => setPos('professor'));
        else { S.mental -= 6; say(`📩 임용 탈락 (지원자 ${R(80, 400)}명 · 확률 ${pct(p)} · ${S.lecApply}번째)`); }
      }
      if (L.cap && S.lecMonths >= L.cap && S.pos === 'lecturer') { S.wissOut = 1; S.mental -= 20; modalMsg('⏳ 학술기간제법 만료', '박사 전후 12년 기간제 상한에 걸렸다. 더 이상 대학과 계약할 수 없다.', () => setPos('none')); }
      break; }
    case 'professor': inc = P.professor * (1 + .2 * S.rank);
      if (ratio >= .8 && rnd() < S.st.study / 600 * vm('wisdom')) { S.papers++; S.fa += 8; say(`📄 논문 게재 (${S.papers}편)`); }
      S.fa += S.papers * .05;
      if (S.m === 3) {
        if (S.rank === 0 && S.rankMonths >= 72 && S.papers >= 10) { S.rank = 1; S.rankMonths = 0; say('🎉 부교수 승진!'); }
        else if (S.rank === 1 && S.rankMonths >= 72 && S.papers >= 20) { S.rank = 2; S.rankMonths = 0; say('🎉 정교수! 정년 보장.'); }
        else if (S.rank === 2 && S.papers >= 40 && S.fa >= 4000) { S.rank = 3; say('🧙 석학으로 불리기 시작했다.'); trigger('scholar'); }
      } break;
    case 'lawprep': { const Lw = C().law, l = S.law; l.m++;
      if (l.phase === 'admit') { if (l.m >= 4 && ratio >= .8) { const p = clamp(Lw.admit[0] + S.st.study / Lw.admit[1], .03, .85); l.tries++;
          if (rnd() < p) { l.phase = 'school'; l.m = 0; say(`🎉 로스쿨 합격! (확률 ${pct(p)}) 철학과 출신이 유리했다.`); }
          else { l.m = -8; S.mental -= 8; say(`📉 입학 불합격. 내년에 다시. (확률 ${pct(p)})`); } } }
      else if (l.phase === 'school') { out += Lw.tuition / 12; if (l.m >= Lw.years * 12) { l.phase = 'bar'; l.m = 0; } }
      else if (l.phase === 'bar' && l.m % 12 === 1) { const p = clamp(Lw.bar + S.st.study / 400 - .1, .1, .95);
        if (rnd() < p) modalMsg('⚖️ 변호사 시험 합격!', `(확률 ${pct(p)}) 오늘부터 ${Lw.job}.`, () => setPos('lawyer'));
        else { S.mental -= 12; say(`📉 변호사 시험 불합격 (확률 ${pct(p)}). 1년 뒤 재시험.`); } }
      break; }
    case 'lawyer': inc = P.lawyer * [1, 1.8, 4][S.rank];
      if (S.m === 1 && S.rank < 2) { const need = [60, 96][S.rank]; if (S.rankMonths >= need) { const p = clamp((S.rank ? .25 : .5) + S.st.work / 300, .1, .85) * vm('money'); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`⚖️ ${n.ranks[S.rank]}! (확률 ${pct(p)})`); if (S.rank >= 2) trigger('lawyer'); } else say(`😶 승진 보류 (확률 ${pct(p)})`); } }
      break;
    case 'youtube': ytMonth(() => setPos('none')); break;
    case 'startup': { const s = S.su, burn = [150, 300, 700, 1500, 4000, 8000, 0][S.rank], rev = [0, 80, 400, 1600, 6000, 20000, 0][S.rank] * S.econ;
      s.cash += rev - burn; inc = [0, 0, 400, 800, 1500, 3000, 0][S.rank];
      if (ratio >= .8 && S.rank < 6) { const p = clamp([.03, .025, .02, .015, .012, .008][S.rank] * (1 + S.st.work / 150) * S.econ * (C().startup || 1) * vm('money') + s.buff, .004, .1); s.buff = 0;
        if (S.rankMonths >= 6 && rnd() < p) { S.rank++; S.rankMonths = 0; const f = [0, 0, 5e4, 3e5, 3e6, 2e7, 0][S.rank]; s.cash += f; say(`🚀 ${n.ranks[S.rank]}! ${f ? '투자 ' + won(f) : ''} (확률 ${pct(p)})`); if (S.rank >= 6) { S.mo += 1e7; trigger('thiel'); } } }
      if (s.cash < 0) { S.fails++; S.mental -= 30; modalMsg('💥 폐업', `회사 통장이 바닥났다. ${S.fails}번째 실패.`, () => { setPos('none'); if (S.fails >= 3) trigger('diogenes'); }); }
      break; }
    case 'pressprep': { const Pr = C().press;
      const ok = Pr.exam ? (S.m === Pr.exam && S.posMonths >= 6) : ratio >= 1;
      if (ok) { const shin = C().shinsotsu ? (S.months <= 14 ? 1.6 : .5) : 1; const p = clamp((Pr.p[0] + S.st.study / Pr.p[1]) * shin * S.econ, .01, .4);
        if (rnd() < p) modalMsg('📰 합격!', `${Pr.prep.split(' (')[0]} 끝. (확률 ${pct(p)}) 수습기자로 첫 출근.`, () => setPos('journalist'));
        else { S.mental -= Pr.exam ? 10 : 3; say(`📉 ${Pr.exam ? '언론사 시험 낙방' : '이번 달 지원 탈락'} (확률 ${pct(p)})`); } }
      break; }
    case 'journalist': inc = P.company * .9 * [1, 1.2, 1.5, 1.9, 2.3][S.rank];
      if (S.m === 1 && S.rank < 4 && S.rankMonths >= n.promoY[S.rank] * 12) { const p = clamp(.35 + S.st.study / 300 + S.fa / 5000, .1, .85); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`📰 ${n.ranks[S.rank]}! (확률 ${pct(p)})`); if (S.rank >= 4) trigger('press'); } else say(`😶 인사 발령 누락 (확률 ${pct(p)})`); }
      if (ratio >= 1 && rnd() < .04 + S.st.study / 2000) { S.fa += 40; say('🗞️ 단독 기사! 명성 +40'); }
      if (S.econ < .8 && rnd() < .01) { S.mental -= 20; modalMsg('📉 언론사 구조조정', '종이 신문 부수가 또 줄었다. 희망퇴직.', () => setPos('none')); }
      break;
    case 'editor': inc = P.company * .75 * [1, 1.25, 1.6, 2.5][S.rank];
      if (S.m === 1 && S.rank < 3 && S.rankMonths >= n.promoY[S.rank] * 12) { const p = clamp(.3 + S.st.study / 300 + (S.rank === 2 ? -.15 : 0), .05, .8); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`📖 ${n.ranks[S.rank]}! (확률 ${pct(p)})`); if (S.rank >= 3) trigger('editor'); } else say(`😶 승진 보류 (확률 ${pct(p)})`); }
      if (ratio >= 1 && rnd() < .03 * S.trend) { S.fa += 20; S.mo += 300; say('✨ 투고함에서 원석을 발견했다! 내가 만든 책이 베스트셀러. 보너스 300만원'); }
      break;
    case 'counselor': inc = counselMonth(S.work); break;
    case 'speaker': break;
    case 'ngo': inc = P.company * .6 * [1, 1.2, 1.4, 1.6][S.rank];
      if (S.m === 2 && S.rank < 3 && S.rankMonths >= n.promoY[S.rank] * 12) { const p = clamp(.4 + S.st.speak / 300, .1, .85); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`🌱 ${n.ranks[S.rank]}! (확률 ${pct(p)})`); if (S.rank >= 3) trigger('citizen'); } else say(`😶 이번엔 다른 사람이 맡았다 (확률 ${pct(p)})`); }
      if (ratio >= 1 && rnd() < .02) { S.fa += 30; say('📜 우리 단체의 정책 제안이 법안에 반영됐다! 명성 +30'); }
      break;
    case 'aiethics': inc = P.company * 1.5 * [1, 1.4, 2, 3][S.rank] * (C().startup || 1) ** .3;
      if (S.m === 1 && S.rank < 3 && S.rankMonths >= n.promoY[S.rank] * 12) { const p = clamp(.3 + S.st.study / 300 + S.st.work / 400, .1, .8); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`🤖 ${n.ranks[S.rank]}! (확률 ${pct(p)})`); if (S.rank >= 3) trigger('aiethics'); } else say(`😶 승진 보류 (확률 ${pct(p)})`); }
      if (S.trend < .8 && rnd() < .015) { S.mental -= 20; modalMsg('📉 AI 윤리팀 해체', '"윤리는 다음 분기에 다시 검토하겠습니다." 팀이 통째로 사라졌다.', () => setPos('none')); }
      break;
    case 'union': inc = P.alba * 1.25;
      if (S.m === 5 && S.rank < 4 && S.rankMonths >= n.promoY[S.rank] * 12) { const p = clamp(.4 + S.st.speak / 300 + S.fa / 5000, .1, .9); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`✊ ${n.ranks[S.rank]} 선출! (확률 ${pct(p)})`); if (S.rank >= 4) trigger('revolution'); } else say(`🗳️ 낙선 (확률 ${pct(p)})`); }
      break;
  }
  for (const sd of S.sides) {
    S.hist[sd] = (S.hist[sd] || 0) + 1;
    if (sd === 'tutor') inc += tutorMonth(S.wk.tutor || 0, () => removeSide('tutor'));
    if (sd === 'youtube') ytMonth(() => removeSide('youtube'));
    if (sd === 'counselor') inc += counselMonth(S.wk.counselor || 0) * .7;
  }
  if (S.sides.length) S.mental -= S.sides.length * .8;
  S.wk = {};
  if (S.wr.royal.length) { const r = S.wr.royal.shift(); inc += r; }
  S.mo += inc - out; S.lastNet = { inc: Math.round(inc), out: Math.round(out) };
  if (S.it.mustache) S.fa += Math.max(0, S.fa - (S.faLast ?? S.fa)) * .5; S.faLast = S.fa;
  S.mental = clamp(S.mental + 2 + (S.partner ? 1.5 : 0) + (S.it.cat ? 3 : 0) - (C().rain && rnd() < .3 ? 4 : 0) - (S.mo < 0 ? 1 : 0) - (C().medical && S.mental < 30 ? 0 : 0), 0, 100);
  if (S.c === 'fr' && S.fa >= 3000) trigger('pantheon');
  S.econ = clamp(S.econ + (1 - S.econ) * .04 + randn() * .045, .6, 1.4);
  S.trend = clamp(S.trend + (1 - S.trend) * .05 + randn() * .04, .5, 2);
  if (S.mental <= 0 && S.rest === 0) { S.burnouts++; S.rest = 3; S.mental = 60; modalMsg('🫠 번아웃', `몸과 마음이 멈췄다. 3개월간 아무것도 할 수 없다. (${S.burnouts}/3)`, () => { if (S.burnouts >= 3) trigger('burnout'); }); }
  if (S.mo < (S.c === 'us' ? -20000 : -8000) && !['master', 'phd', 'lawprep'].includes(S.pos)) trigger('diogenes');
  for (const k in S.st) S.st[k] = clamp(S.st[k], 0, 100);
  S.work = 0;
  paydayToast();
  const a = age();
  if (SAGES[a] && !S.sagesDone[a] && S.m >= 3) { S.sagesDone[a] = 1; sage(a); }
  else if (rnd() < .18 && !busy()) randomEvent();
  if (a >= 70 && !S.retired) { S.retired = 1; finalEnding(); }
  save(); render();
}

/* ───────── 본업·부업 공용 월 처리 ───────── */
function tutorMonth(work, quit) {
  const need = Math.max(8, S.tu.st * 4), r = Math.min(1, work / need), inc = S.tu.st * 50 * r;
  const pg = S.tu.st === 0 ? .1 + work / 60 : (.18 + S.st.speak / 150 + S.fa / 3000) * vm('people') * C().tutor;
  if (S.tu.st < 8 && rnd() < pg) { S.tu.st++; say(`📞 새 과외 학생! (학생 ${S.tu.st}명)`); }
  let q = 0; for (let i = 0; i < S.tu.st; i++) if (rnd() < (r < .8 ? .15 : .05)) q++;
  if (q) { S.tu.st -= q; say(`😢 과외 학생 ${q}명이 그만뒀다. "학원 다니래요."`); }
  return inc;
}
function ytMonth(quit) {
  const y = S.yt; y.months++; y.subs = Math.floor(y.subs * .98);
  if (y.months === 12 && y.subs < 1000 && !y.warned[12]) { y.warned[12] = 1; modalChoice('📺 1년 했는데 망했다', `영상 ${y.videos}개, 구독자 ${num(y.subs)}명. 수익 창출(1,000명)도 못 넘겼다.`, [['그래도 계속', () => { S.mental -= 10; }], ['접는다', quit]]); }
  if (y.months === 60 && y.subs < 1e4 && !y.warned[60]) { y.warned[60] = 1; modalChoice('📺 5년째…', `구독자 ${num(y.subs)}명. 친구들이 "아직도 해?"라고 묻는다.`, [['10년은 해봐야지', () => { S.mental -= 15; }], ['접는다', quit]]); }
  if (y.months === 120 && y.subs < 1e5 && !y.warned[120]) { y.warned[120] = 1; modalChoice('📺 10년 했는데 망했다', `영상 ${y.videos}개, 구독자 ${num(y.subs)}명. 실버 버튼은 오지 않았다.`, [['이건 내 삶이다. 계속', () => { S.mental -= 20; S.val.wisdom += .5; }], ['이제 놓아준다', quit]]); }
}
function counselMonth(work) {
  const c = S.cs, need = Math.max(6, c.cl * 2), r = Math.min(1, work / need), inc = c.cl * 40 * r * C().pay.alba / 200;
  const pg = (.12 + S.st.speak / 200 + S.st.study / 400 + S.fa / 5000) * vm('people');
  if (c.cl < 40 && rnd() < pg) { c.cl += 1 + (rnd() < .2 ? 1 : 0); }
  let q = 0; for (let i = 0; i < c.cl; i++) if (rnd() < (r < .8 ? .12 : .04)) q++; c.cl -= q;
  const th = [0, 8, 20, 35]; let nr = 0; th.forEach((t, i) => { if (c.cl >= t) nr = i; });
  if (nr > c.rank) { c.rank = nr; say(`🛋️ 상담: ${NODES.counselor.ranks[c.rank]} (내담자 ${c.cl}명)`); if (c.rank >= 3) trigger('counsel'); }
  return inc;
}
function talk() {
  const p = S.sp; p.prog = 0; p.talks++;
  const fee = Math.round((30 + S.fa / 15) * (C().pay.alba / 200) * (.6 + rnd() * .8));
  S.mo += fee; S.fa += 5 + S.st.speak / 10;
  const th = [0, 800, 3000, 8000, 20000]; let nr = 0; th.forEach((t, i) => { if (S.fa >= t) nr = i; });
  if (nr > p.rank) { p.rank = nr; say(`🎤 강연가: ${NODES.speaker.ranks[p.rank]}!`); if (p.rank >= 4) trigger('agora'); }
  say(`🎤 강연 ${p.talks}회차: 강연료 ${won(fee)}${rnd() < .2 ? ' · 질문 시간에 "그래서 답이 뭐예요?"를 들었다' : ''}`);
}
/* ───────── 작가·유튜버 ───────── */
function submitMs() {
  const w = S.wr; if (w.ms < 100 || (S.pos !== 'writer' && !isSide('writer'))) return;
  if (w.rank === 0) {
    const p = clamp(.005 + Math.pow(S.st.study / 100, 2.5) * .4, .005, .45);
    if (rnd() < p) { w.rank = 1; w.debut = 1; w.ms = 0; w.told = 0; S.mo += 500; S.fa += 50; modalMsg('🏆 신춘문예 당선!', `${w.rej}번 떨어진 끝에. (확률 ${pct(p)}) 상금 500만원.`); }
    else { w.rej++; w.ms = 55; w.told = 0; S.mental -= 6; modalMsg('📩 낙선', `${w.rej}번째 낙선. (확률 ${pct(p)})<br>원고를 고쳐 쓰자. 진척도 55%로.`); }
  } else {
    const p = clamp(.1 + S.st.study / 200, .1, .6);
    if (rnd() < p) {
      w.books++; w.ms = 0; w.told = 0;
      const sales = Math.floor(lognorm(Math.log(1500 * Math.pow(S.st.study / 40, 2) * (1 + Math.log10(1 + S.fa / 500)) * S.trend * w.sell * (C().writer || 1) * vm('people')), 1.1));
      w.sell = 1; w.sales += sales; w.best = Math.max(w.best, sales); S.fa += sales / 150 * C().fame;
      const roy = sales * .15; for (let i = 0; i < 12; i++) w.royal[i] = (w.royal[i] || 0) + roy * (i < 3 ? .2 : .4 / 9);
      S.mo += 300;
      let nr = 2; if (w.books >= 3) nr = 3; if (w.best >= 1e5) nr = 4; if (w.sales >= 200e4 && w.books >= 6) nr = 5; if (nr > w.rank) w.rank = nr;
      modalMsg(sales >= 1e5 ? '🔥 베스트셀러!' : '📚 책이 나왔다', `${w.books}번째 책. ${num(sales)}부 팔렸다. (출판 확률 ${pct(p)})<br>선인세 300만원 + 인세는 1년에 걸쳐.${sales < 1000 ? '<br>…초판 1쇄도 다 안 팔렸다.' : ''}`, () => { if (w.rank >= 5) trigger('classic'); });
    } else { w.rej++; w.ms = 60; w.told = 0; S.mental -= 5; modalMsg('📩 출판 거절', `"요즘 이런 책은 안 팔려서요." (확률 ${pct(p)})`); }
  }
  render();
}
function upload() {
  const y = S.yt; y.prog = 0; y.videos++;
  let v = lognorm(Math.log(30 * Math.pow(1 + S.st.speak / 15, 2) * Math.pow(1 + y.subs / 300, .5) * S.trend * y.bait * (C().youtube || 1) * vm('people')), 1.2);
  y.bait = 1; let hit = false; if (rnd() < .015) { v *= 40; hit = true; }
  v = Math.floor(v); y.last = v; const ns = Math.floor(v * (.005 + rnd() * .015)); y.subs += ns;
  if (y.subs >= 1000) S.mo += v * .00025 * C().pay.alba / 200;
  S.fa += v / 5000 * C().fame;
  const th = [0, 1e3, 1e4, 1e5, 1e6, 1e7]; let nr = 0; th.forEach((t, i) => { if (y.subs >= t) nr = i; });
  if (nr > y.rank) { y.rank = nr; say(`🏅 유튜브 ${NODES.youtube.ranks[y.rank]} 달성!`); if (y.rank >= 5) trigger('platform'); }
  say(hit ? `🚀 알고리즘 떡상!! 조회수 ${num(v)}, 구독자 +${num(ns)}` : `📤 업로드: 조회수 ${num(v)}, 구독자 +${num(ns)}${v < 50 ? ' (한 명은 엄마)' : ''}`);
}

/* ───────── 진로 변경 ───────── */
function costOf(k) { if (k === 'tprep') return C().teach.cost || 0; return NODES[k].cost || 0; }
function setPos(k) {
  S.pos = k; S.rank = 0; S.posMonths = 0; S.rankMonths = 0; S.work = 0; S.tgt = 'main'; S.perfSum = S.perfN = 0;
  if (k === 'tutor' && !S.hist.tutor) S.tu.st = 0;
  if (k === 'academy') S.ac = { st: 8, low: 0 };
  if (k === 'startup') S.su = { cash: NODES.startup.cost, buff: 0 };
  if (k === 'lawprep') S.law = { phase: 'admit', m: 0, tries: 0 };
  S.sides = S.sides.filter(x => x !== k);
  render();
}
function tryStart(k, asSide) {
  const n = NODES[k]; if (!n.req(S) || S.pos === k) return;
  if (asSide) { addSide(k); tab = 'home'; render(); return; }
  const cost = costOf(k);
  const go = () => { if (cost) S.mo -= cost; say(`${n.e} ${nodeName(k)} 시작!`); setPos(k); tab = 'home'; render(); };
  if (S.pos !== 'none') modalChoice('🔀 진로 변경', `<b>${nodeName(S.pos)}</b>을(를) 그만두고 <b>${nodeName(k)}</b>(으)로?${cost ? `<br>비용 ${won(cost)}` : ''}<br><small>직급은 처음부터. 능력치·경력·부업은 그대로.</small>`, [['간다', go], ['아니다', () => {}]]);
  else go();
}

/* ───────── 이벤트·거장·엔딩 ───────── */
function randomEvent() {
  const pool = EVENTS.filter(e => !e.w || e.w(S));
  let r = rnd() * pool.reduce((a, e) => a + e.p, 0), ev = pool[0];
  for (const e of pool) { r -= e.p; if (r <= 0) { ev = e; break; } }
  if (ev.o) modalChoice(ev.t, ev.d || '', ev.o.map(o => [o[0], () => say(`${ev.t.split(' ')[0]} ${o[1](S)}`)]));
  else say(`${ev.t} — ${ev.fx(S)}`);
}
function sage(a) {
  const s = SAGES[a];
  modal(`<div class="big">${s[0]}</div><div class="kicker">${a}세의 어느 밤</div><h2>${s[1]}</h2><p class="q">${s[2]}</p>` + SAGE_OPTS.map((o, i) => `<button class="opt" data-sv="${i}">${o[0]}<small>${o[2]}</small></button>`).join(''));
  document.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => { const o = SAGE_OPTS[+b.dataset.sv]; S.val[o[1]]++; close(); say(`${s[0]} ${s[1]}에게: ${o[0]}`); });
}
function trigger(k) {
  if (S.ends[k]) return; S.ends[k] = 1;
  if (!['burnout', 'diogenes'].includes(k)) S.topEnd = S.topEnd || k;
  showEnd(k, !['burnout', 'diogenes'].includes(k));
}
function finalEnding() {
  let k; const v = S.val;
  if (S.topEnd) k = v.wisdom >= 3 ? 'sage' : v.people >= 3 ? 'friend' : S.topEnd;
  else if (S.wissOut && !S.hist.professor) k = 'wiss';
  else if (S.lecMonths >= 120 && !S.hist.professor) k = 'lecturer';
  else if (S.huntMonths >= 48 && !S.hist.company) k = 'hunt';
  else if (S.kids && S.val.people >= 1 && rnd() < .6) k = 'family';
  else if (S.c === 'kr' && (S.chicken || rnd() < .4)) k = 'chicken';
  else { const top = Object.keys(v).sort((a, b) => v[b] - v[a])[0]; k = !v[top] ? 'normal' : top === 'wisdom' ? 'hermit' : top === 'people' ? 'warm' : 'normal'; }
  showEnd(k, false);
}
function showEnd(k, canGo) {
  SEEN[k] = 1; try { localStorage.setItem(END_KEY, JSON.stringify(SEEN)); } catch (e) {}
  if (!canGo) try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  const e = ENDINGS[k];
  modal(`<div class="big">${e[0]}</div><div class="kicker">ENDING</div><h2>${e[1]}</h2><p>${e[2]}</p>
    <div class="endstat">${C().f} ${S.name} · ${age()}세 · ${node().e} ${rankName()}<br>💰 ${won(S.mo)} · ⭐ ${num(S.fa)} · 🧠${Math.floor(S.st.study)} 🗣️${Math.floor(S.st.speak)} 📊${Math.floor(S.st.work)}<br>엔딩 도감 ${Object.keys(SEEN).length}/${Object.keys(ENDINGS).length}</div>
    ${canGo ? '<button class="opt center" id="eGo">아니, 더 살아보겠다 →</button>' : ''}<button class="opt center primary" id="eRe">다시 태어나기 👶</button>`);
  $('#eRe').onclick = () => { close(); try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; startScreen(); };
  if (canGo) $('#eGo').onclick = close;
}

/* ───────── 저장 ───────── */
function save() { if (S) try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }

/* ───────── UI 도우미 ───────── */
function modal(h) { $('#box').innerHTML = h; $('#modal').classList.add('on'); }
function close() { $('#modal').classList.remove('on'); render(); }
const busy = () => $('#modal').classList.contains('on');
function modalMsg(t, d, after) { modal(`<h2>${t}</h2><p>${d}</p><button class="opt center primary" id="mOk">확인</button>`); $('#mOk').onclick = () => { close(); if (after) after(); }; }
function modalChoice(t, d, opts) { modal(`<h2>${t}</h2>${d ? `<p>${d}</p>` : ''}${opts.map((o, i) => `<button class="opt" data-mc="${i}">${o[0]}</button>`).join('')}`);
  document.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => { close(); opts[+b.dataset.mc][1](); render(); }); }
let bubT; function say(t) { if (!S) return; S.log.unshift(`<span class="ld">${S.y}.${String(S.m).padStart(2, '0')}</span> ${t}`); if (S.log.length > 150) S.log.pop();
  const b = $('#bub'); if (b) { b.innerHTML = t; b.classList.add('on'); clearTimeout(bubT); bubT = setTimeout(() => b.classList.remove('on'), 5000); } }
let toastT; function toast(t) { const el = $('#toast'); if (!el) return; el.innerHTML = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }
function paydayToast() { const n = S.lastNet; if (!n) return; const net = n.inc - n.out; toast(`💸 월말 정산 <b>${net >= 0 ? '+' : ''}${won(net)}</b><small>수입 ${won(n.inc)} · 지출 ${won(n.out)}</small>`); }
function pop(e, t, col) { if (!t) return; const st = $('#stage'), r = st.getBoundingClientRect(); const c = document.createElement('div'); c.className = 'coin'; c.textContent = t; if (col) c.style.color = col;
  const x = e && e.clientX ? e.clientX - r.left : r.width / 2, y = e && e.clientY ? e.clientY - r.top : r.height / 2;
  c.style.left = clamp(x - 40, 4, r.width - 150) + 'px'; c.style.top = (y - 24) + 'px'; st.appendChild(c); setTimeout(() => c.remove(), 900); }
function bump() { const c = $('#char'); if (!c) return; c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }
function face() { if (S.rest > 0) return '😵'; const a = age(); if (a >= 62) return '🧓'; if (a >= 45) return '🧔';
  const k = act(); if (k !== S.pos) return { alba: '🧑‍🍳', tutor: '🧑‍🏫', writer: '🧑‍🎨', youtube: '🤳', counselor: '🧘', speaker: '🎤' }[k];
  return { none: '🧑', alba: '🧑‍🍳', hunt: '🧑‍💻', company: S.rank >= 4 ? '🤵' : '🧑‍💼', gongsi: '📖', civil: '🧑‍💼', tprep: '🧑‍🎓', teacher: '🧑‍🏫', tutor: '🧑‍🏫', instructor: '🧑‍🏫', academy: '👨‍🏫', master: '🧑‍🎓', phd: '🧑‍🔬', lecturer: '🧑‍🏫', professor: '👨‍🏫', lawprep: '🧑‍🎓', lawyer: '🧑‍⚖️', writer: '🧑‍🎨', youtube: '🤳', startup: S.rank >= 5 ? '🤑' : '🧑‍💻', union: '✊', pressprep: '🧑‍💻', journalist: '🕵️', editor: '🤓', counselor: '🧘', speaker: '🎤', ngo: '🙋', aiethics: '🧑‍💻' }[S.pos] || '🧑'; }

/* ───────── 지금 할 일 (가이드) ───────── */
function goal() {
  const g = (t, b, act) => ({ t, b, act });
  if (isSide('writer') && S.wr.ms >= 100) return g('부업 원고 완성!', '투고해보자. 본업은 그대로.', [S.wr.rank ? '📮 출판사에 투고' : '📮 신춘문예 투고', submitMs]);
  switch (S.pos) {
    case 'none': return g('할 일을 고르자', '🌳 진로에서 하나 골라 시작하세요. 그동안 탭하면 생각(학문)이 쌓여요.', ['🌳 진로 보기', () => { tab = 'tree'; render(); }]);
    case 'alba': return g('이번 달 노동 채우기', `노동 ${S.work}/${W()} — 다 채우면 월급 전액. 6개월 넘게 성실하면 더 좋은 알바로.`);
    case 'hunt': { const shin = C().shinsotsu ? (S.months <= 12 ? 2 : .45) : 1; const ex = Math.min(.08, expMonths() / 500), p = clamp((.02 + S.st.work / 450 + (S.huntBuff || 0) + ex) * S.econ * C().hunt * (ex > .02 ? Math.max(1, shin) : shin) * vm('money'), .01, .5);
      return g('노동을 채워 지원서 내기', `이번 달 합격 확률 <b>${pct(p)}</b>.${expMonths() > 10 ? ' 💼 경력 가산점.' : ''}${C().shinsotsu ? (S.months <= 12 ? ' 🎴 신졸 카드 사용 중 (x2)' : ' ⚠️ 기졸 — 확률 대폭 하락') : ''} 실무가 오를수록 ↑. 생활비는 ＋부업(알바·과외)으로.`); }
    case 'gongsi': return g('4월 시험까지 버티기', `합격 확률 ${pct(clamp(.02 + S.st.work / 330, .02, .3))}. 수입이 없으니 투잡 알바를 섞자.`);
    case 'tprep': { const T = C().teach; return T.ref ? g('수습 기간 채우기', `${T.ref}개월 수습 후 임용 평가 (${S.posMonths}/${T.ref}개월).`) : g(`${T.exam}월 시험 준비`, `합격 확률 ${pct(clamp(T.p[0] + S.st.study / T.p[1], .02, .85))}. 학문이 오를수록 ↑.`); }
    case 'master': return g('석사 논문', `${S.posMonths}/24개월 · 학문 ${Math.floor(S.st.study)}/25`);
    case 'phd': return g('논문 게재하기', `논문 ${S.papers}/${C().phd.papers}편 · ${S.posMonths}/${C().phd.months - 12}개월 이상`);
    case 'lecturer': return g('3월·9월 임용 공고', `임용 확률 ${pct(clamp(.004 + S.papers * .006 + S.st.study / 3000 + S.fa / 4e4, .003, .15) * C().lec.p * Math.sqrt(S.econ))} · 논문 ${S.papers}편${C().lec.cap ? ` · ⏳ 기간제 상한 ${S.lecMonths}/${C().lec.cap}개월` : ''}`);
    case 'lawprep': { const l = S.law, Lw = C().law; return l.phase === 'admit' ? g('입학 시험 준비', `합격 확률 ${pct(clamp(Lw.admit[0] + S.st.study / Lw.admit[1], .03, .85))} (철학과 = 유리)`) : l.phase === 'school' ? g('로스쿨 졸업까지', `${Math.floor(l.m / 12)}/${Lw.years}년 · 학비 연 ${won(Lw.tuition)}`) : g('변호사 시험', `합격 확률 ${pct(clamp(Lw.bar + S.st.study / 400 - .1, .1, .95))}`); }
    case 'writer': return S.wr.ms >= 100 ? g('원고 완성!', '투고하자. 떨어지면 고쳐 쓴다.', [S.wr.rank ? '📮 출판사에 투고' : '📮 신춘문예 투고', submitMs]) : g('원고 쓰기 (탭)', `진척 ${Math.floor(S.wr.ms)}% · 써도 돈은 0. 생활비는 투잡 알바로.`);
    case 'youtube': return g('영상 만들기 (탭)', `편집 ${Math.min(100, Math.floor(S.yt.prog))}% → 100%면 자동 업로드 · 구독자 ${num(S.yt.subs)}`);
    case 'tutor': return g('학생 모으기', S.tu.st ? `학생 ${S.tu.st}명 · 노동 ${S.work}/${W()} 채우면 안 그만둔다` : '탭 = 전단지 붙이기. 많이 붙일수록 첫 학생이 빨리 온다.');
    case 'pressprep': { const Pr = C().press; return g(Pr.exam ? `${Pr.exam}월 언론사 시험` : '노동을 채워 지원하기', `합격 확률 ${pct(clamp(Pr.p[0] + S.st.study / Pr.p[1], .01, .4))} · 학문이 오를수록 ↑`); }
    case 'counselor': return g('내담자 지키기', `내담자 ${S.cs.cl}명 · 상담 ${S.work}/${W()} 채우면 안 떠난다`);
    case 'speaker': return g('강연 준비 (탭)', `준비 ${Math.min(100, Math.floor(S.sp.prog))}% → 강연. 강연료는 명성에 비례`);
    case 'startup': return g('다음 투자 단계', `회사 현금 ${won(S.su.cash)} · 바닥나면 폐업`);
    default: { const w = W(); return g('이번 달 노동 채우기', w ? `노동 ${S.work}/${w} — 승진 평가에 반영돼요.` : ''); }
  }
}

/* ───────── 시작 화면 ───────── */
function startScreen() {
  let sel = 'kr'; const sv = load();
  $('#app').innerHTML = `<div class="start">
    <div class="logo">🛋️</div><h1>철학과 키우기</h1><p class="sub">"철학과 가서 뭐 먹고 살래?"<br>그 질문이 현실이 된 날부터, 70세까지.</p>
    ${sv && sv.c ? `<button class="btn primary wide" id="cont">▶ 이어하기 · ${COUNTRIES[sv.c].f} ${sv.name} ${22 + Math.floor(sv.months / 12)}세</button>` : ''}
    <div class="sec">1. 이름</div><input id="nm" class="inp" maxlength="8" value="${pick(['현배', '지훈', '서연', '민준', '하은', '도윤'])}">
    <div class="sec">2. 어느 나라 철학과를 졸업할까?</div>
    <div class="cgrid">${Object.keys(COUNTRIES).map(k => { const c = COUNTRIES[k]; return `<button class="cty ${k === sel ? 'on' : ''}" data-c="${k}"><div class="ctop"><span class="flag">${c.f}</span><b>${c.n}</b></div><div class="ctag">${c.tag}</div>${c.pros.map(x => `<div class="pro">＋ ${x}</div>`).join('')}${c.cons.map(x => `<div class="con">－ ${x}</div>`).join('')}</button>`; }).join('')}</div>
    <button class="btn primary wide big" id="go">졸업하기 🎓</button>
    <p class="foot">엔딩 도감 ${Object.keys(SEEN).length} / ${Object.keys(ENDINGS).length} · 한 인생 약 4시간 · 자동 저장</p></div>`;
  document.querySelectorAll('[data-c]').forEach(d => d.onclick = () => { sel = d.dataset.c; document.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === d)); });
  if (sv && sv.c) $('#cont').onclick = () => { S = sv; buildGame(); };
  $('#go').onclick = () => { newLife(sel, $('#nm').value.trim() || '무명'); buildGame(); intro(); };
}
function intro() {
  const c = C();
  modal(`<div class="big">${c.f}</div><div class="kicker">${S.y}년 ${S.m}월 · 22세 · ${c.n}</div><h2>졸업식 날</h2>
  <p>학사모를 던졌다. 떨어진 학사모를 줍다가 깨달았다. "철학과 가서 뭐 먹고 살래?" — 그게 <b>오늘부터 현실</b>이다.</p>
  <div class="real"><b>${c.n} 철학과의 현실</b>${c.real.map(x => `<div>· ${x}</div>`).join('')}</div>
  <div class="howto"><div>👆 <b>탭 = 노동.</b> 고른 일을 한다. 체력이 닳는다.</div><div>⏳ <b>25초 = 한 달.</b> 월말에 월급과 생활비(${won(living())})가 정산된다.</div><div>🎲 <b>합격·승진·출간은 확률.</b> 능력치가 확률을 올린다.</div></div>
  <button class="opt center primary" id="iGo">일단 뭐라도 하자 →</button>`);
  $('#iGo').onclick = () => { close(); tab = 'tree'; render(); };
}

/* ───────── 게임 화면 ───────── */
function buildGame() {
  $('#app').innerHTML = `
  <header class="hud">
    <div class="hrow"><div class="date" id="date"></div><div class="money" id="mo"></div><div class="spd"><button id="pz">⏸</button><button id="sp">1x</button></div></div>
    <div class="bars"><div class="bar"><span>⚡</span><div class="g"><i id="hpb"></i></div></div><div class="bar"><span>💗</span><div class="g"><i id="mnb"></i></div></div><div class="fame">⭐ <b id="fa"></b></div><div class="econ" id="econ"></div></div>
    <div class="mbar"><i id="mbar"></i></div>
  </header>
  <section class="stage" id="stage">
    <div class="bubble" id="bub"></div><div class="toast" id="toast"></div><div class="bg" id="bg"></div><div class="char" id="char"></div>
    <div class="tag" id="tag"></div><div class="work" id="workw"><div class="wg"><i id="wg"></i></div><span id="wl"></span></div>
  </section>
  <div class="seg" id="seg"></div>
  <main class="panel" id="panel"></main>
  <nav class="nav" id="nav"></nav>`;
  $('#stage').addEventListener('pointerdown', tap);
  $('#pz').onclick = () => { paused = !paused; draw(); };
  $('#sp').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; paused = false; draw(); };
  render();
}
function render() { if (!S || !$('#nav')) return; renderNav(); renderP(); draw(); }
function renderNav() {
  const T = [['home', '🏠', '홈'], ['tree', '🌳', '진로'], ['shop', '🛒', '상점'], ['log', '📔', '기록']];
  $('#nav').innerHTML = T.map(t => `<button data-t="${t[0]}" class="${tab === t[0] ? 'on' : ''}"><b>${t[1]}</b>${t[2]}</button>`).join('');
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); window.scrollTo({ top: 0 }); });
}
function draw() {
  if (!S || !$('#mo')) return;
  $('#date').innerHTML = `${C().f} ${S.y}.${String(S.m).padStart(2, '0')}<small>${age()}세${S.partner ? ' 💞' : ''}</small>`;
  $('#mo').textContent = won(S.mo); $('#mo').classList.toggle('neg', S.mo < 0);
  $('#pz').textContent = paused ? '▶' : '⏸'; $('#sp').textContent = speed + 'x';
  $('#mbar').style.width = (monthT / MONTH_SEC * 100) + '%';
  $('#hpb').style.width = S.hp + '%'; $('#mnb').style.width = S.mental + '%'; $('#mnb').classList.toggle('low', S.mental < 25);
  $('#fa').textContent = num(S.fa);
  $('#econ').textContent = S.econ >= 1.12 ? '📈호황' : S.econ <= .85 ? '📉불황' : '';
  $('#char').textContent = face(); $('#bg').textContent = HOUSES[S.house].e + (S.it.cat ? '🐈' : '') + (S.it.mac ? '💻' : '');
  const k = act(), main = k === S.pos;
  $('#tag').textContent = main ? `${node().e} ${rankName()}` : `${NODES[k].e} 부업: ${rankName(k)}`;
  const w = main ? W() : needOf(k), cnt = main ? S.work : (S.wk[k] || 0); let pr = 0, lab = '';
  if (k === 'alba' && !main) lab = `탭 1번 = ${won(C().pay.alba / 20)}`;
  else if (k === 'writer') { pr = S.wr.ms; lab = `원고 ${Math.floor(pr)}%`; }
  else if (k === 'youtube') { pr = Math.min(100, S.yt.prog); lab = `편집 ${Math.floor(pr)}%`; }
  else if (k === 'speaker') { pr = Math.min(100, S.sp.prog); lab = `강연 준비 ${Math.floor(pr)}%`; }
  else if (w) { pr = Math.min(100, cnt / w * 100); lab = `${main ? '이번 달 노동' : k === 'counselor' ? '상담' : '과외 수업'} ${cnt}/${w}`; }
  else lab = S.pos === 'none' ? '탭 = 생각하기' : '';
  $('#wg').style.width = pr + '%'; $('#wg').classList.toggle('full', pr >= 100); $('#wl').textContent = lab;
  const tg = [['main', `${node().e} ${S.pos === 'none' ? '생각하기' : '본업'}`, S.pos === 'none' ? '' : rankName()]].concat(S.sides.map(k => [k, `${NODES[k].e} ${NODES[k].n}`, '부업' + (k === 'alba' ? ` +${won(C().pay.alba / 20)}/탭` : '')]));
  const segH = tg.map(t => `<button class="${(t[0] === 'main' ? !isSide(S.tgt) : S.tgt === t[0]) ? 'on' : ''}" data-g="${t[0]}">${t[1]}<small>${t[2]}</small></button>`).join('') + (S.sides.length < 2 ? '<button class="add" data-g="add">＋<small>부업</small></button>' : '');
  const seg = $('#seg'); if (seg._h !== segH) { seg._h = segH; seg.innerHTML = segH; seg.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (b.dataset.g === 'add') { sidePicker(); return; } S.tgt = b.dataset.g; draw(); }); }
  if (tab === 'home') { const gl = $('#goalB'); if (gl) { const g = goal(); gl.innerHTML = g.b; } }
}

/* ───────── 패널 ───────── */
function nodeState(k) { if (S.pos === k) return 'cur'; if (isSide(k)) return 'side'; if (NODES[k].req(S)) return 'open'; if (S.hist[k] > 0) return 'past'; return 'lock'; }
function reqText(k) { if (k === 'tprep') { const t = C().teach.need; return t === 'master' ? '석사 졸업' : '학문 ' + t.split(' ')[1]; } if (k === 'lawprep' && !C().law) return `${C().n}에선 법학 학사부터 다시 해야 한다 (불가)`; return NODES[k].reqT; }
function nodeDesc(k) { if (k === 'tprep') { const T = C().teach; return T.ref ? `석사 후 ${T.ref}개월 수습. 통과하면 ${T.job}(공무원).` : `매년 ${T.exam}월 시험. 합격하면 ${T.job}.${T.cost ? ' 과정 비용 ' + won(T.cost) + '.' : ''}`; }
  if (k === 'teacher') return `${C().teach.ranks.join(' → ')}. 월 ${won(C().pay.teacher)}부터.`;
  if (k === 'lawprep' && C().law) { const L = C().law; return `입학 시험 → ${L.years}년 과정(학비 연 ${won(L.tuition)}) → 변호사 시험.`; }
  if (k === 'lecturer') return C().lec.cap ? `포스닥으로 하빌리타치온. 3·9월 교수 공고. ⏳ ${C().lec.cap / 12}년 안에 못 되면 학술기간제법으로 퇴출.` : NODES[k].d;
  if (k === 'phd') { const D = C().phd; return `약 ${Math.round(D.months / 12)}년 · 논문 ${D.papers}편 게재해야 졸업 · 월 ${won(D.stipend)} 지원${D.tuition ? ' · 학기 등록금 ' + won(D.tuition) : ' · 학비 없음'}`; }
  if (k === 'master') return `2년 · 학기 등록금 ${C().phd.tuition ? won(C().phd.tuition) : '없음'} · 학문 25가 넘어야 졸업.`;
  const pay = { alba: 'alba', company: 'company', civil: 'civil', professor: 'professor', lawyer: 'lawyer' }[k];
  return NODES[k].d + (pay && C().pay[pay] ? ` 월 ${won(C().pay[pay])}부터.` : '');
}
function renderP() {
  const P = $('#panel'); if (!P) return; let h = '';
  if (tab === 'home') {
    const g = goal(), n = node();
    h += `<div class="goal"><div class="gt">🎯 ${g.t}</div><div class="gb" id="goalB">${g.b}</div>${g.act ? `<button class="btn primary wide" id="gAct">${g.act[0]}</button>` : ''}</div>`;
    h += `<div class="card"><div class="ct">${n.e} <b>${nodeName(S.pos)}</b> <span class="mut">${S.posMonths}개월째</span></div>${ranksOf(S.pos) ? `<div class="lad">${ranksOf(S.pos).map((x, i) => `<span class="${i === rankIdx(S.pos) ? 'on' : i < rankIdx(S.pos) ? 'd' : ''}">${x}</span>`).join('')}</div>` : ''}${detail()}</div>`;
    h += S.sides.map(k => `<div class="card side"><div class="ct">${NODES[k].e} <b>${NODES[k].n}</b> <span class="mut">부업 · ${S.hist[k] ? Math.floor(S.hist[k]) + '개월' : '이번 달 시작'}</span><button class="mini" data-rm="${k}">그만두기</button></div>${ranksOf(k) && k !== 'alba' ? `<div class="lad">${ranksOf(k).map((x, i) => `<span class="${i === rankIdx(k) ? 'on' : i < rankIdx(k) ? 'd' : ''}">${x}</span>`).join('')}</div>` : ''}${sideDetail(k)}</div>`).join('');
    if (!S.sides.length && S.pos !== 'none') h += `<button class="btn wide ghost" id="addSide">＋ 부업 추가하기 <small>(알바·과외·글쓰기·유튜브)</small></button>`;
    h += `<div class="card"><div class="ct small">능력치 <span class="mut">탭할수록 오른다 · 높을수록 천천히</span></div>${Object.keys(STATS).map(k => `<div class="sk"><span>${STATS[k].e} ${STATS[k].n}</span><div class="g"><i style="width:${S.st[k]}%"></i></div><b>${Math.floor(S.st[k])}</b></div>`).join('')}</div>`;
    if (S.lastNet) h += `<div class="card"><div class="kv"><span>지난달 수입</span><b class="pos">+${won(S.lastNet.inc)}</b></div><div class="kv"><span>지난달 지출 (생활비+월세${S.pos === 'academy' ? '+임대료' : ''})</span><b class="neg">-${won(S.lastNet.out)}</b></div></div>`;
    if (age() >= 60) h += `<button class="btn wide ghost" id="retire">🌅 은퇴하고 엔딩 보기</button>`;
  }
  if (tab === 'tree') {
    h = `<div class="sec">🌳 진로 <small>칸을 누르면 자세히 · 능력치는 어디서든 그대로</small></div>` + BRANCHES.map(b => `<div class="br"><div class="bh">${b.e} ${b.n}</div><div class="chips">${b.nodes.map((k, i) => { const st = nodeState(k); return `${i ? '<span class="ar">›</span>' : ''}<button class="nc ${st}" data-nd="${k}">${NODES[k].e} ${nodeName(k).split(' (')[0]}${st === 'lock' ? ' 🔒' : st === 'cur' ? ' ●' : st === 'side' ? ' ＋' : ''}</button>`; }).join('')}</div></div>`).join('');
  }
  if (tab === 'shop') {
    h = SHOP.map(s => `<div class="sec">${s.sec}</div>` + s.items.map(i => { const owned = !i.course && S.it[i.id], lv = S.courseM[i.id + 'n'] || 0, cost = i.course ? Math.round(i.c * Math.pow(1.35, lv)) : i.c, done = i.course && S.courseM[i.id] === S.months;
      return `<div class="row"><div class="ic">${i.e}</div><div class="tx"><b>${i.n}</b><small>${i.d}${i.course ? ` · 한 달 1번 · 현재 ${Math.floor(S.st[i.course])}` : ''}</small></div><button class="btn" data-buy="${i.id}" ${owned || done || S.mo < cost ? 'disabled' : ''}>${owned ? '보유' : done ? '이번 달 완료' : won(cost)}</button></div>`; }).join('')).join('');
    h += `<div class="sec">🏠 집 <small>월세는 매달 빠진다</small></div>` + HOUSES.map((x, i) => `<div class="row ${i === S.house ? 'cur' : ''}"><div class="ic">${x.e}</div><div class="tx"><b>${x.n}</b><small>${x.rent ? '월세 ' + won(Math.round(x.rent * C().rent)) : '월세 없음'}${x.buy ? ' · ' + won(x.buy) : ''}</small></div>${i === S.house ? '<button class="btn" disabled>사는 중</button>' : i === S.house + 1 ? `<button class="btn" data-h="${i}" ${S.mo < x.buy ? 'disabled' : ''}>이사</button>` : `<button class="btn" disabled>${i < S.house ? '✔' : '🔒'}</button>`}</div>`).join('');
  }
  if (tab === 'log') {
    h = `<div class="sec">📔 일지</div><div class="log">${S.log.slice(0, 60).join('<br>') || '아직 비어 있다.'}</div>`;
    h += `<div class="sec">🏁 엔딩 도감 <small>${Object.keys(SEEN).length} / ${Object.keys(ENDINGS).length}</small></div><div class="endg">${Object.keys(ENDINGS).map(k => `<div class="${SEEN[k] ? '' : 'lk'}">${SEEN[k] ? ENDINGS[k][0] + ' ' + ENDINGS[k][1] : '❓ ???'}</div>`).join('')}</div>
    <div class="card"><div class="mut">💡 진로의 정상은 각각 엔딩. 70세에 은퇴하면 걸어온 길과 거장들에게 한 대답으로 엔딩이 갈린다. 실패에도 엔딩이 있다.</div></div>
    <button class="btn wide danger" id="wipe">이번 인생 포기하고 처음부터</button>`;
  }
  P.innerHTML = h;
  const g = $('#gAct'); if (g) g.onclick = goal().act[1];
  P.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => removeSide(b.dataset.rm));
  P.querySelectorAll('[data-ms]').forEach(b => b.onclick = submitMs);
  if ($('#addSide')) $('#addSide').onclick = sidePicker;
  P.querySelectorAll('[data-nd]').forEach(b => b.onclick = () => nodeSheet(b.dataset.nd));
  P.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy));
  P.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const i = +b.dataset.h, x = HOUSES[i]; if (S.mo < x.buy) return; S.mo -= x.buy; S.house = i; say(`${x.e} ${x.n}(으)로 이사!`); if (i === HOUSES.length - 1) trigger('island'); render(); });
  if ($('#retire')) $('#retire').onclick = () => { S.retired = 1; finalEnding(); };
  if ($('#wipe')) $('#wipe').onclick = () => modalChoice('정말?', '이번 인생이 사라진다.', [['처음부터', () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; startScreen(); }], ['취소', () => {}]]);
}
function buy(id) {
  const it = SHOP.flatMap(s => s.items).find(x => x.id === id);
  if (it.course) { const lv = S.courseM[id + 'n'] || 0, cost = Math.round(it.c * Math.pow(1.35, lv)); if (S.mo < cost || S.courseM[id] === S.months) return; S.mo -= cost; S.courseM[id + 'n'] = lv + 1; S.courseM[id] = S.months; S.st[it.course] = clamp(S.st[it.course] + 3 * (1 - S.st[it.course] / 120), 0, 100); toast(`${it.e} ${STATS[it.course].n} ${Math.floor(S.st[it.course])}!`); }
  else { if (S.mo < it.c || S.it[id]) return; S.mo -= it.c; S.it[id] = 1; toast(`${it.e} ${it.n} 구입!`); }
  render();
}
function nodeSheet(k) {
  const n = NODES[k], st = nodeState(k), cost = costOf(k);
  modal(`<div class="big">${n.e}</div><h2>${nodeName(k)}</h2><p>${nodeDesc(k)}</p>
   <div class="kvbox"><div class="kv"><span>시작 조건</span><b>${reqText(k)}</b></div><div class="kv"><span>탭하면 오르는 능력</span><b>${STATS[n.stat].e} ${STATS[n.stat].n}</b></div>${cost ? `<div class="kv"><span>비용</span><b>${won(cost)}</b></div>` : ''}${S.hist[k] ? `<div class="kv"><span>경험</span><b>${S.hist[k]}개월</b></div>` : ''}</div>
   ${st === 'open' ? `<button class="opt center primary" id="ndGo">본업으로 시작</button>` : st === 'cur' ? '<button class="opt center" disabled>지금 본업</button>' : st === 'side' ? '<button class="opt center" id="ndRm">부업 그만두기</button>' : `<button class="opt center" disabled>🔒 아직 조건이 안 된다</button>`}${SIDE_OK.includes(k) && st === 'open' ? `<button class="opt center" id="ndSide">＋ 부업으로 같이 하기 <small>본업은 그대로 · 최대 2개</small></button>` : ''}<button class="opt center" id="ndX">닫기</button>`);
  if ($('#ndGo')) $('#ndGo').onclick = () => { close(); tryStart(k); };
  if ($('#ndSide')) $('#ndSide').onclick = () => { close(); tryStart(k, true); };
  if ($('#ndRm')) $('#ndRm').onclick = () => { close(); removeSide(k); };
  $('#ndX').onclick = close;
}
function sideDetail(k) {
  const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
  if (k === 'alba') return kv('탭 1번', won(C().pay.alba / 20)) + kv('20번 탭', '= 알바 한 달 월급');
  if (k === 'tutor') return kv('학생', S.tu.st + '명') + kv('이번 달 수업', `${S.wk.tutor || 0}/${Math.max(8, S.tu.st * 4)}`);
  if (k === 'writer') return kv('원고', Math.floor(S.wr.ms) + '%') + kv('책 / 판매', `${S.wr.books}권 / ${num(S.wr.sales)}부`) + (S.wr.ms >= 100 ? `<button class="btn wide primary" data-ms="1">📮 투고하기</button>` : '');
  if (k === 'youtube') return kv('구독자', num(S.yt.subs)) + kv('마지막 조회수', num(S.yt.last));
  if (k === 'counselor') return kv('내담자', S.cs.cl + '명') + kv('이번 달 상담', `${S.wk.counselor || 0}/${needOf('counselor')}`);
  if (k === 'speaker') return kv('강연', S.sp.talks + '회') + kv('준비', Math.floor(S.sp.prog) + '%');
  return '';
}
function sidePicker() {
  const opts = SIDE_OK.filter(k => k !== S.pos && !isSide(k));
  modal(`<h2>＋ 부업 고르기</h2><p>본업은 그대로 두고 같이 한다. 체력은 나눠 쓴다. 부업 하나마다 매달 멘탈 -1.</p>` + opts.map(k => `<button class="opt" data-ps="${k}">${NODES[k].e} ${NODES[k].n}<small>${{ alba: `탭 1번 = ${won(C().pay.alba / 20)} · 실무 ↑`, tutor: '학생 1명당 월 50만원 · 말 ↑ · 경력이 학원 강사 조건으로 쌓인다', writer: '원고를 쓰면 학문 ↑ · 다 쓰면 투고 (확률)', youtube: '편집하면 말 ↑ · 업로드 조회수는 운', counselor: '내담자 1명당 월 40만원 · 말 ↑', speaker: '강연 준비 100% → 강연료 (명성 비례)' }[k]}</small></button>`).join('') + `<button class="opt center" id="psX">닫기</button>`);
  document.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { close(); addSide(b.dataset.ps); });
  $('#psX').onclick = close;
}
function detail() {
  const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`, P = C().pay;
  switch (S.pos) {
    case 'none': return kv('수입', '없음') + kv('생활비', won(living()) + '/월');
    case 'hunt': return kv('취준 기간', S.huntMonths + '개월') + kv('수입', '없음 — 투잡 알바로 버티기');
    case 'gongsi': return kv('공시 기간', S.posMonths + '개월') + kv('시험', '매년 4월');
    case 'tprep': return kv('준비 기간', S.posMonths + '개월');
    case 'lawprep': return kv('단계', {admit:'입학 시험 준비',school:'재학 중',bar:'변호사 시험'}[S.law.phase]);
    case 'alba': return kv('월급 (노동 다 채우면)', won(P.alba * (1 + .1 * S.rank)));
    case 'company': { const need = Math.ceil((NODES.company.promoY[S.rank] || 99) / C().promo); return kv('월급', won(P.company * [1, 1.25, 1.55, 1.9, 2.8, 6][S.rank])) + kv('승진 심사', S.rank >= 5 ? '정상' : S.rankMonths >= need * 12 ? '올해 12월' : `${Math.ceil((need * 12 - S.rankMonths) / 12)}년 후`) + kv('구조조정 위험', S.econ < .85 ? '⚠️ 불황' : '낮음'); }
    case 'civil': return kv('월급', won(P.civil * [1, 1.25, 1.55, 1.95, 2.5, 3.2, 4.5][S.rank])) + kv('승진', '근속 후 매년 1월 심사');
    case 'teacher': return kv('월급', won(P.teacher * (1 + .15 * S.rank)));
    case 'tutor': return kv('학생', S.tu.st + '명 / 8') + kv('월수입', won(S.tu.st * 50));
    case 'instructor': return kv('월급', won(300 * P.alba / 200));
    case 'academy': return kv('학생', S.ac.st + '명 / 수용 ' + [40, 120, 300, 700, 1500][S.rank]) + kv('임대료', won(Math.round(400 * (1 + S.rank * 1.5) * C().rent))) + kv('다음 확장', ['30명·2년', '90명·5년', '240명·10년', '600명·15년', '-'][S.rank]);
    case 'phd': case 'lecturer': case 'professor': return kv('게재 논문', S.papers + '편') + (S.pos === 'lecturer' ? kv('임용 지원', S.lecApply + '번') + (S.lecCut ? kv('강의 배정', `없음 (${S.lecCut}개월 남음)`) : '') : '');
    case 'lawyer': return kv('월급', won(P.lawyer * [1, 1.8, 4][S.rank]));
    case 'journalist': return kv('월급', won(P.company * .9 * [1, 1.2, 1.5, 1.9, 2.3][S.rank]));
    case 'editor': return kv('월급', won(P.company * .75 * [1, 1.25, 1.6, 2.5][S.rank]));
    case 'ngo': return kv('월급', won(P.company * .6 * [1, 1.2, 1.4, 1.6][S.rank]));
    case 'aiethics': return kv('월급', won(P.company * 1.5 * [1, 1.4, 2, 3][S.rank] * (C().startup || 1) ** .3)) + kv('위험', S.trend < .8 ? '⚠️ 붐이 꺼지는 중' : '낮음');
    case 'counselor': return sideDetail('counselor');
    case 'speaker': return sideDetail('speaker');
    case 'writer': return kv('낸 책 / 판매', `${S.wr.books}권 / ${num(S.wr.sales)}부`) + kv('낙선·거절', S.wr.rej + '번');
    case 'youtube': return kv('구독자', num(S.yt.subs)) + kv('마지막 조회수', num(S.yt.last)) + kv('운영', `${Math.floor(S.yt.months / 12)}년 ${S.yt.months % 12}개월`);
    case 'startup': return kv('회사 현금', won(S.su.cash)) + kv('실패', S.fails + '번');
    default: return '';
  }
}

/* ───────── 루프 ───────── */
let last = performance.now(), drawT = 0;
function loop(now) {
  const dt = Math.min(.25, (now - last) / 1000); last = now;
  if (S && $('#mo') && !busy() && !paused) {
    S.hp = clamp(S.hp + 2.4 * dt * speed * (S.it.coffee ? 1.4 : 1) * (S.rest > 0 ? 0 : 1), 0, 100);
    monthT += dt * speed; if (monthT >= MONTH_SEC) { monthT = 0; monthEnd(); }
    drawT += dt; if (drawT > .2) { drawT = 0; draw(); }
  }
  requestAnimationFrame(loop);
}
window.__game = { NODES, talk, addSide, removeSide, get S() { return S; }, monthEnd, tap, setPos, tryStart, submitMs, newLife, buildGame };
startScreen(); requestAnimationFrame(loop);

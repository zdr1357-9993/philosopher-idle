/* 철학과 키우기 — 게임 엔진 */
const $ = s => document.querySelector(s);
const rnd = Math.random;
const R = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randn = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const lognorm = (mu, sig) => Math.exp(mu + sig * randn());
const UNITS = ['', '만', '억', '조', '경'];
function won(n) { const neg = n < 0; n = Math.abs(n); if (n < 1e4) return (neg ? '-' : '') + Math.floor(n).toLocaleString() + '원';
  let i = 0; while (n >= 1e4 && i < 4) { n /= 1e4; i++; } const s = n >= 1000 ? Math.floor(n).toLocaleString() : n >= 100 ? Math.floor(n) : n.toFixed(1).replace(/\.0$/, '');
  return (neg ? '-' : '') + s + UNITS[i] + '원'; }
const num = n => Math.floor(n).toLocaleString();
const pct = p => (p * 100).toFixed(p < .1 ? 1 : 0) + '%';

const MONTH_SEC = 25;           // 1x 속도에서 한 달 = 25초
const SAVE_KEY = 'philoLife_v5', END_KEY = 'philoEnds_v5';
let S = null, speed = 1, paused = false, monthT = 0, tab = 'tree';
let SEEN = {}; try { SEEN = JSON.parse(localStorage.getItem(END_KEY)) || {}; } catch (e) {}

/* ───────── 새 인생 ───────── */
function newLife(c, name) {
  const C = COUNTRIES[c];
  S = { c, name, y: 2026, m: 3, months: 0, mo: C.startMoney || 0, th: 10, fa: 0, hp: 100, mental: 70,
    sk: { office: 3, teach: 3, research: 5, write: 5, video: 1, biz: 1 },
    pos: 'none', rank: 0, posMonths: 0, rankMonths: 0, hist: {}, done: {}, it: {}, house: 0, partner: 0,
    val: { money: 0, wisdom: 0, people: 0 }, econ: 1, trend: 1, burnouts: 0, rest: 0, work: 0, tgt: 'main',
    tu: { st: 0 }, wr: { ms: 0, books: 0, sales: 0, best: 0, royal: [], sell: 1, rej: 0 },
    yt: { subs: 0, prog: 0, videos: 0, months: 0, last: 0, bait: 1, warned: {} },
    su: { cash: 0, buff: 0 }, ac: { st: 0, low: 0 }, papers: 0, perfSum: 0, perfN: 0, fails: 0,
    huntMonths: 0, lecMonths: 0, lecApply: 0, sagesDone: {}, ends: {}, topEnd: null, log: [], courses: {}, chicken: 0 };
  Object.keys(NODES).forEach(k => S.hist[k] = 0);
}
const age = () => 22 + Math.floor(S.months / 12);
const node = () => NODES[S.pos];
const C = () => COUNTRIES[S.c];
const bonus = k => (C().bonus || {})[k] || 1;
const vm = k => 1 + S.val[k] * .15;
const rentNow = () => HOUSES[S.house].rent * (C().rentx || 1);
const living = () => C().live + rentNow();
function W() { const n = node(); if (S.pos === 'tutor') return Math.max(8, S.tu.st * 5); if (S.pos === 'writer' || S.pos === 'youtube') return 0; return n.W; }

/* ───────── 숙련도 ───────── */
function gain(k, base) {
  if (!k) return 0;
  let a = base * (1 - S.sk[k] / 110) * (S.it.mac ? 1.25 : 1);
  if (k === 'research') a *= (C().research || 1) * vm('wisdom');
  if (k === 'teach') a *= (C().teach || 1);
  if (C().veteran) a *= 1 + Math.min(.5, S.posMonths / 120);
  if (S.mental < 20) a *= .5;
  S.sk[k] = clamp(S.sk[k] + a, 0, 100); return a;
}

/* ───────── 탭 = 노동 ───────── */
function tap(e) {
  if (busy() || paused) return;
  let label = '';
  if (S.rest > 0) { say('😵 번아웃으로 쉬는 중… 탭해도 몸이 안 움직인다.'); return; }
  if (S.hp < 1) { pop(e, '지쳤다…', '#ff6b6b'); return; }
  S.hp -= 1;
  const t = S.tgt;
  if (t === 'read') {
    const g = (1 + S.sk.research / 25) * (S.it.books ? 2 : 1) * vm('wisdom'); S.th += g; S.mental = clamp(S.mental + .05, 0, 100);
    gain('research', .008); label = `🧠+${g.toFixed(1)}`;
  } else if (t === 'side') {
    const g = 5e4 * (C().salary || 1); S.mo += g; gain('office', .008); S.mental -= .05; S.hist.alba += 1 / 25;
    label = '+' + won(g);
  } else {
    const n = node();
    if (S.pos === 'none') { S.th += .5; label = '🤔 생각 중…'; }
    else {
      S.work += (C().work || 1);
      const a = gain(n.tapSkill, .035);
      if (S.pos === 'company' || (S.pos === 'alba' && S.rank >= 4)) gain('biz', .012);
      if (S.pos === 'master' || S.pos === 'phd') S.th += .3;
      label = `${SKILLS[n.tapSkill].e}+${(a * 10).toFixed(2)}`;
      if (S.pos === 'writer') { const g = .15 + S.sk.write / 250; S.wr.ms = Math.min(100, S.wr.ms + g); label = `✍️ 원고 ${Math.floor(S.wr.ms)}%`; if (S.wr.ms >= 100 && !S.wr.told) { S.wr.told = 1; say('📄 원고 완성! 📋 현황 탭에서 투고할 수 있다.'); } }
      if (S.pos === 'youtube') { S.yt.prog += 2 + S.sk.video / 12; label = `🎬 편집 ${Math.min(100, Math.floor(S.yt.prog))}%`; if (S.yt.prog >= 100) upload(); }
      const w = W(); if (w && S.work > w * 1.5) { S.mental -= .25 * (S.it.chair ? .5 : 1); label += ' 😓'; }
    }
  }
  pop(e, label); bump(); draw();
}

/* ───────── 한 달이 지나면 ───────── */
function monthEnd() {
  const n = node(), w = W(), ratio = w ? Math.min(1, S.work / w) : 1, sal = C().salary || 1;
  let income = 0, out = living(), notes = [];
  if (S.rest > 0) { S.rest--; notes.push('번아웃 휴식 중'); }
  S.months++; S.m++; if (S.m > 12) { S.m = 1; S.y++; }
  S.hist[S.pos] = (S.hist[S.pos] || 0) + 1; S.posMonths++; S.rankMonths++;

  switch (S.pos) {
    case 'alba': income = n.pay * n.rankPay[S.rank] * ratio * sal;
      if (S.rank < 4 && S.rankMonths >= 6 && ratio >= 1 && rnd() < .25) { S.rank++; S.rankMonths = 0; say(`🎉 알바 레벨업: ${n.ranks[S.rank]}`); } break;
    case 'tutor': {
      const need = Math.max(8, S.tu.st * 5), r = Math.min(1, S.work / need);
      income = S.tu.st * 50e4 * r * sal;
      const pGain = S.tu.st === 0 ? .1 + S.work / 60 : (.18 + S.sk.teach / 150 + S.fa / 3000) * vm('people');
      if (S.tu.st < 8 && rnd() < pGain) { S.tu.st++; say(`📞 새 학생이 왔다! (학생 ${S.tu.st}명)`); }
      let q = 0; for (let i = 0; i < S.tu.st; i++) if (rnd() < (r < .8 ? .15 : .05)) q++;
      if (q) { S.tu.st -= q; say(`😢 학생 ${q}명이 그만뒀다. "학원 다니래요."`); }
      break; }
    case 'instructor': income = n.pay * ratio * sal; break;
    case 'academy': {
      const a = S.ac, cap = [40, 120, 300, 700, 1500][S.rank];
      const g = a.st * (.022 + S.sk.teach / 2000 + S.fa / 1e5) * vm('people') * S.econ * bonus('academy') * (1 - a.st / cap) * (.4 + rnd() * 1.2);
      a.st = clamp(a.st + Math.round(g) + (rnd() < .35 ? 1 : 0) - Math.round(a.st * .012 * (ratio < .8 ? 3 : 1)) - (rnd() < .15 ? 1 : 0), 0, cap);
      const rent = 400e4 * (1 + S.rank * 1.5); income = a.st * 30e4 * sal; out += rent;
      const th = [0, 30, 90, 240, 600], yrs = [0, 24, 60, 120, 180];
      if (S.rank < 4 && a.st >= th[S.rank + 1] && S.posMonths >= yrs[S.rank + 1]) {
        if (rnd() < .3) { S.rank++; say(`🏫 확장 성공: ${n.ranks[S.rank]} (학생 ${a.st}명)`); if (S.rank >= 4) trigger('school'); }
      }
      if (a.st < 3) a.low++; else a.low = 0;
      if (a.low >= 6) { say('🚪 학생이 없어 학원 문을 닫았다…'); S.mental -= 25; setPos('none', true); }
      break; }
    case 'hunt': S.huntMonths++;
      if (ratio >= 1) {
        const p = clamp((.02 + S.sk.office / 500 + (S.huntBuff || 0)) * S.econ * (C().work ? 1.1 : 1) * vm('money'), .01, .45);
        if (rnd() < p) { modalMsg('🎉 최종 합격!', `지원서 ${S.huntMonths}개월 만에 붙었다. (이번 달 합격 확률 ${pct(p)})<br>"철학과요? 질문 많이 하시겠네요." 첫 출근은 다음 달.`, () => setPos('company', true)); }
        else { S.mental -= 4; say(pick(['📩 "귀하의 뛰어난 역량에도 불구하고…"', '📩 서류 탈락. 자소서의 "실존"이 문제였을까.', '📩 최종 면접 탈락. "질문이 너무 많으셨어요."', '📩 인적성 탈락. 가족유사성 때문이다.']) + ` (확률 ${pct(p)})`); }
      } else say('📝 이번 달엔 지원서를 다 못 냈다. 노동 게이지를 채우자.');
      break;
    case 'company': {
      income = n.rankPay[S.rank] * sal * bonus('company'); S.perfSum += ratio; S.perfN++;
      if (ratio < .5) say('😬 팀장: "요즘 좀 느슨한 것 같은데?"');
      const need = (n.promoYears[S.rank] || 99) * 12 * (C().slowPromo || 1);
      if (S.m === 12 && S.rank < 6 && S.rankMonths >= need) {
        const perf = S.perfSum / Math.max(1, S.perfN);
        let p = (.15 + S.sk.office / 350 + S.sk.biz / 500 + (S.perfBonus || 0)) * perf * vm('money'); if (S.rank >= 4) p *= .4; p = clamp(p, .02, .75);
        if (rnd() < p) { S.rank++; S.rankMonths = 0; S.perfSum = S.perfN = 0; say(`🎉 연말 평가: ${n.ranks[S.rank]} 승진! (확률 ${pct(p)})`); if (S.rank >= 6) trigger('ceo'); }
        else { S.mental -= 8; say(`😶 승진 누락… 동기가 먼저 갔다. (확률 ${pct(p)})`); }
      }
      if (S.econ < .85 && rnd() < .02 * (C().layoff || 1) * (S.rank >= 4 ? 1.5 : 1)) { S.mental -= 25; modalMsg('📦 구조조정', `경기 침체로 희망퇴직 대상이 됐다. 위로금 ${won(income * 6)}.`, () => { S.mo += income * 6; setPos('none', true); }); }
      break; }
    case 'gongsi':
      if (S.m === 4 && S.posMonths >= 6) {
        const p = clamp(.02 + S.sk.office / 330, .02, .32) * bonus('civil');
        if (rnd() < p) modalMsg('🎉 공무원 시험 합격!', `합격 확률은 ${pct(p)}였다. 노량진 컵밥과 작별이다.`, () => setPos('civil', true));
        else { S.mental -= 12; say(`📉 불합격… 커트라인과 0.5점 차이. (확률 ${pct(p)})`); }
      } break;
    case 'civil': income = n.rankPay[S.rank] * sal;
      if (S.m === 1 && S.rank < 6) {
        const need = n.promoYears[S.rank] * 12;
        if (S.rankMonths >= need) {
          const p = S.rank === 5 ? clamp(.03 + S.fa / 1e5, .03, .3) : clamp(.45 + S.sk.office / 300, .1, .9) * bonus('civil');
          if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`🎉 ${n.ranks[S.rank]}(으)로 승진! (확률 ${pct(p)})`); if (S.rank >= 6) trigger('minister'); }
          else say(`😶 올해 승진 심사 탈락 (확률 ${pct(p)})`);
        }
      } break;
    case 'master': income = n.pay * sal;
      if (S.posMonths % 6 === 1 && !C().freeGrad) { out += 450e4; notes.push('등록금 450만원'); }
      if (S.posMonths >= 24 && S.posMonths % 6 === 0) {
        if (S.sk.research >= 25) { S.done.master = 1; modalChoice('🎓 석사 졸업!', '논문 심사를 통과했다. 이제 어디로?', [['박사과정 진학', () => setPos('phd', true)], ['학계는 여기까지', () => setPos('none', true)]]); }
        else { S.mental -= 10; say(`📄 논문 심사 탈락. 한 학기 연장… (연구력 ${Math.floor(S.sk.research)}/25)`); }
      } break;
    case 'phd': income = n.pay * sal;
      if (ratio >= .8) { const p = (S.sk.research / 900 + (S.paperBuff || 0)) * vm('wisdom'); S.paperBuff = 0; if (rnd() < p) { S.papers++; S.fa += 5; say(`📄 논문 게재! (총 ${S.papers}편, 확률 ${pct(p)})`); } }
      if (S.posMonths >= 48 && S.papers >= 3) { S.done.phd = 1; modalChoice('🎓 박사 학위!', `${Math.floor(S.posMonths / 12)}년 걸렸다. 이제 진짜 시작이다.`, [['시간강사로 임용에 도전', () => setPos('lecturer', true)], ['학계를 떠난다', () => setPos('none', true)]]); }
      else if (S.posMonths >= 108) { S.mental -= 25; modalMsg('📜 박사 수료…', '9년이 지났다. 학위 없이 수료로 끝났다.', () => setPos('none', true)); }
      break;
    case 'lecturer': income = n.pay * sal; S.lecMonths++;
      if (ratio >= .8 && rnd() < S.sk.research / 1000 * vm('wisdom')) { S.papers++; say(`📄 논문 게재! (총 ${S.papers}편)`); }
      if (S.m === 3 || S.m === 9) {
        S.lecApply++;
        const p = clamp(.008 + S.papers * .012 + S.sk.research / 1500 + S.fa / 2e5, .005, .3) * bonus('professor') * Math.sqrt(S.econ);
        if (rnd() < p) modalMsg('🎉 교수 임용!', `${S.lecApply}번째 지원 만에. (확률 ${pct(p)}) 연구실 문패에 이름이 붙었다.`, () => setPos('professor', true));
        else { S.mental -= 7; say(`📩 임용 탈락. 지원자 ${R(80, 400)}명 중 최종 2인까지 갔다… (확률 ${pct(p)}, ${S.lecApply}번째)`); }
      } break;
    case 'professor': income = n.rankPay[S.rank] * sal * bonus('professor');
      if (ratio >= .8 && rnd() < S.sk.research / 600 * vm('wisdom')) { S.papers++; S.fa += 10; say(`📄 논문 게재 (총 ${S.papers}편)`); }
      S.fa += S.papers * .3;
      if (S.m === 3) {
        if (S.rank === 0 && S.rankMonths >= 72 && S.papers >= 10) { S.rank = 1; S.rankMonths = 0; say('🎉 부교수 승진!'); }
        else if (S.rank === 1 && S.rankMonths >= 72 && S.papers >= 20) { S.rank = 2; S.rankMonths = 0; say('🎉 정교수 승진! 정년이 보장됐다.'); }
        else if (S.rank === 2 && S.papers >= 40 && S.fa >= 5000) { S.rank = 3; say('🧙 석학으로 불리기 시작했다.'); trigger('scholar'); }
      } break;
    case 'writer': break;
    case 'youtube': {
      const y = S.yt; y.months++; y.subs = Math.floor(y.subs * .98);
      if (y.months === 12 && y.subs < 1000 && !y.warned[12]) { y.warned[12] = 1; modalChoice('📺 1년 했는데 망했다', `영상 ${y.videos}개, 구독자 ${num(y.subs)}명. 수익 창출 조건(1,000명)도 못 넘겼다.`, [['그래도 계속한다', () => { S.mental -= 10; }], ['접는다', () => setPos('none', true)]]); }
      if (y.months === 60 && y.subs < 1e4 && !y.warned[60]) { y.warned[60] = 1; modalChoice('📺 5년째…', `구독자 ${num(y.subs)}명. 친구들은 "아직도 해?"라고 묻는다.`, [['10년은 해봐야지', () => { S.mental -= 15; }], ['접는다', () => setPos('none', true)]]); }
      if (y.months === 120 && y.subs < 1e5 && !y.warned[120]) { y.warned[120] = 1; modalChoice('📺 10년 했는데 망했다', `영상 ${y.videos}개. 구독자 ${num(y.subs)}명. 실버 버튼은 끝내 오지 않았다.`, [['이건 내 삶이다. 계속', () => { S.mental -= 20; S.val.wisdom += .5; }], ['이제 놓아준다', () => setPos('none', true)]]); }
      if (rnd() < .003) { y.subs = Math.floor(y.subs * .6); S.mental -= 15; say('⚠️ 저작권 경고로 채널이 일시 정지됐다! 구독자 -40%'); }
      break; }
    case 'startup': {
      const s = S.su, burn = [300, 500, 900, 1800, 4000, 8000, 0][S.rank] * 1e4, rev = [0, 80, 400, 1600, 6000, 20000, 0][S.rank] * 1e4 * S.econ;
      s.cash += rev - burn; income = [0, 0, 400, 800, 1500, 3000, 0][S.rank] * 1e4;
      if (ratio >= .8 && S.rank < 6) {
        const p = clamp([.06, .05, .04, .035, .03, .025][S.rank] * (1 + S.sk.biz / 70) * S.econ * bonus('startup') * vm('money') + s.buff, .005, .4); s.buff = 0;
        if (rnd() < p) { S.rank++; const fund = [0, 0, 5e8, 30e8, 300e8, 2000e8, 0][S.rank]; s.cash += fund; say(`🚀 ${node().ranks[S.rank]} 달성! ${fund ? '투자금 ' + won(fund) : ''} (확률 ${pct(p)})`); if (S.rank >= 6) { S.mo += 1000e8; trigger('thiel'); } }
      }
      if (S.rank < 6 && rnd() < .006) { s.cash -= burn * 3; say('💥 공동창업자가 지분을 들고 떠났다! 현금 타격.'); }
      if (s.cash < 0) { S.fails++; S.mental -= 30; modalMsg('💥 폐업', `통장이 바닥났다. ${S.fails}번째 실패. 차고 문을 닫았다.`, () => { setPos('none', true); if (S.fails >= 3) trigger('diogenes'); }); }
      break; }
    case 'union': income = n.rankPay[S.rank] * sal;
      if (S.m === 5 && S.rank < 4 && S.rankMonths >= n.promoYears[S.rank] * 12) { const p = clamp(.4 + S.sk.teach / 300 + S.fa / 5e4, .1, .9); if (rnd() < p) { S.rank++; S.rankMonths = 0; say(`✊ ${n.ranks[S.rank]}(으)로 선출! (확률 ${pct(p)})`); if (S.rank >= 4) trigger('revolution'); } else say(`🗳️ 선거 낙선 (확률 ${pct(p)})`); }
      break;
  }
  // 인세
  if (S.wr.royal.length) { const r = S.wr.royal.shift(); income += r; if (r > 0) notes.push('인세 ' + won(r)); }
  S.mo += income - out; S.lastNet = income - out;

  // 니체 콧수염: 이번 달 얻은 명성 x1.5
  if (S.it.mustache) S.fa += Math.max(0, S.fa - (S.faLast || S.fa)) * .5; S.faLast = S.fa;
  // 멘탈·변수
  S.mental = clamp(S.mental + 2 + (S.partner ? 1.5 : 0) + (S.it.cat ? 3 : 0) - (C().rain && rnd() < .3 ? 4 : 0) - (S.mo < 0 ? 1 : 0), 0, 100);
  if (S.c === 'fr' && S.fa >= 3e4) trigger('pantheon');
  S.econ = clamp(S.econ + (1 - S.econ) * .04 + randn() * .045, .5, 1.5);
  S.trend = clamp(S.trend + (1 - S.trend) * .05 + randn() * .04, .4, 2.5);
  if (S.mental <= 0 && S.rest === 0) { S.burnouts++; S.rest = 3; S.mental = 60; modalMsg('🫠 번아웃', `몸과 마음이 멈췄다. 3개월간 아무것도 할 수 없다. (${S.burnouts}/3)`, () => { if (S.burnouts >= 3) trigger('burnout'); }); }
  if (S.mo < -8e7) trigger('diogenes');
  S.work = 0;

  // 거장 & 랜덤 이벤트
  const a = age();
  if (SAGES[a] && !S.sagesDone[a] && S.m >= 3) { S.sagesDone[a] = 1; sage(a); }
  else if (rnd() < .2) randomEvent();
  if (a >= 70 && !S.retired) { S.retired = 1; finalEnding(); }
  save(); renderP(); draw();
}

/* ───────── 작가: 투고 / 유튜브: 업로드 ───────── */
function submitMs() {
  const w = S.wr; if (w.ms < 100) return;
  const r = S.pos === 'writer' ? S.rank : 0;
  if (r === 0) {
    const p = clamp(.005 + Math.pow(S.sk.write / 100, 2.5) * .4, .005, .45);
    if (rnd() < p) { S.rank = 1; w.debut = 1; w.ms = 0; w.told = 0; S.mo += 500e4; S.fa += 50; modalMsg('🏆 신춘문예 당선!', `${w.rej}번 떨어진 끝에 등단했다. (당선 확률 ${pct(p)}) 상금 500만원.`); }
    else { w.rej++; w.ms = 55; w.told = 0; S.mental -= 6; modalMsg('📩 낙선', `"아쉽게도…" ${w.rej}번째 낙선이다. (당선 확률 ${pct(p)})<br>원고를 고쳐 쓰자. 진척도 55%로.`); }
  } else {
    const p = clamp(.1 + S.sk.write / 200, .1, .6);
    if (rnd() < p) {
      w.books++; w.ms = 0; w.told = 0;
      const sales = Math.floor(lognorm(Math.log(1500 * Math.pow(S.sk.write / 40, 2) * (1 + Math.log10(1 + S.fa / 500)) * S.trend * w.sell * bonus('writer') * vm('people')), 1.1));
      w.sell = 1; w.sales += sales; w.best = Math.max(w.best, sales); S.fa += sales / 150 * (C().fame || 1);
      const roy = sales * 1500; for (let i = 0; i < 12; i++) w.royal[i] = (w.royal[i] || 0) + roy * (i < 3 ? .2 : .4 / 9);
      S.mo += 300e4;
      let nr = 2; if (w.books >= 3) nr = 3; if (w.best >= 1e5) nr = 4; if (w.sales >= 200e4 && w.books >= 6) nr = 5; if (nr > S.rank) S.rank = nr;
      modalMsg(sales >= 1e5 ? '🔥 베스트셀러!' : '📚 책이 나왔다', `${w.books}번째 책. 판매 ${num(sales)}부 (출판 확률 ${pct(p)}). 선인세 300만원 + 인세는 12개월에 걸쳐 들어온다.${sales < 1000 ? '<br>…초판 1쇄도 다 안 팔렸다.' : ''}`, () => { if (S.rank >= 5) trigger('classic'); });
    } else { w.rej++; w.ms = 60; w.told = 0; S.mental -= 5; modalMsg('📩 출판 거절', `"요즘 이런 책은 안 팔려서요." (출판 확률 ${pct(p)})`); }
  }
  renderP(); draw();
}
function upload() {
  const y = S.yt; y.prog = 0; y.videos++;
  let v = lognorm(Math.log(30 * Math.pow(1 + S.sk.video / 15, 2) * Math.pow(1 + y.subs / 300, .5) * S.trend * y.bait * bonus('youtube') * vm('people')), 1.2);
  y.bait = 1; let hit = false; if (rnd() < .015) { v *= 40; hit = true; }
  v = Math.floor(v); y.last = v; const ns = Math.floor(v * (.005 + rnd() * .015)); y.subs += ns;
  if (y.subs >= 1000) { const rev = v * 2.5 * (C().salary || 1); S.mo += rev; }
  S.fa += v / 5000 * (C().fame || 1);
  const th = [0, 1e3, 1e4, 1e5, 1e6, 1e7]; let nr = 0; th.forEach((t, i) => { if (y.subs >= t) nr = i; });
  if (nr > S.rank) { S.rank = nr; say(`🏅 ${node().ranks[S.rank]} 달성!`); if (S.rank >= 5) trigger('platform'); }
  say(hit ? `🚀 알고리즘 떡상!! 조회수 ${num(v)}회, 구독자 +${num(ns)}` : `📤 업로드: 조회수 ${num(v)}회, 구독자 +${num(ns)}${v < 50 ? ' (그중 한 명은 엄마)' : ''}`);
}

/* ───────── 진로 변경 ───────── */
function setPos(k, forced) {
  S.pos = k; S.rank = 0; S.posMonths = 0; S.rankMonths = 0; S.work = 0; S.tgt = 'main'; S.perfSum = S.perfN = 0;
  if (k === 'tutor') S.tu.st = 0;
  if (k === 'academy') { S.ac = { st: 8, low: 0 }; }
  if (k === 'startup') S.su = { cash: NODES.startup.cost, buff: 0 };
  if (k === 'writer') { const w = S.wr; S.rank = w.books ? (w.best >= 1e5 ? 4 : w.books >= 3 ? 3 : 2) : (w.debut ? 1 : 0); }
  if (k === 'youtube') { const th = [0, 1e3, 1e4, 1e5, 1e6, 1e7]; th.forEach((t, i) => { if (S.yt.subs >= t) S.rank = i; }); }
  renderP(); draw();
}
function tryStart(k) {
  const n = NODES[k]; if (!n.req(S)) return;
  if (S.pos === k) return;
  const go = () => { if (n.cost) S.mo -= n.cost; if (S.pos === 'writer' && S.rank >= 1) S.wr.debut = 1; say(`${n.e} ${n.n}의 길을 걷기 시작했다.`); setPos(k); tab = 'status'; renderNav(); renderP(); };
  if (S.pos !== 'none') modalChoice('🔀 진로 변경', `지금 하는 <b>${node().n}</b>을(를) 그만두고 <b>${n.n}</b>(으)로 갈까?${n.cost ? `<br>초기 비용 ${won(n.cost)}` : ''}<br><small>직급·진행은 처음부터 다시 시작한다.</small>`, [['간다', go], ['아니다', () => {}]]);
  else go();
}

/* ───────── 이벤트 ───────── */
function randomEvent() {
  const pool = EVENTS.filter(e => (!e.w || e.w(S)) && (!e.w2 || e.w2(S)));
  let sum = pool.reduce((a, e) => a + e.p, 0), r = rnd() * sum, ev = pool[0];
  for (const e of pool) { r -= e.p; if (r <= 0) { ev = e; break; } }
  if (ev.o) modalChoice(ev.t, ev.d || '', ev.o.map(o => [o[0], () => say(`${ev.t.split(' ')[0]} ${o[1](S)}`)]));
  else { const m = ev.fx(S); say(`${ev.t} — ${m}`); }
}
function sage(a) {
  const s = SAGES[a];
  modal(`<div class="big">${s[0]}</div><div class="kicker">${a}세의 어느 밤</div><h2>${s[1]}</h2><p class="q">${s[2]}</p>` +
    SAGE_OPTS.map((o, i) => `<button class="opt" data-sv="${i}">${o[0]}<small>${o[2]}</small></button>`).join(''));
  document.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => { const o = SAGE_OPTS[+b.dataset.sv]; S.val[o[1]]++; close(); say(`${s[0]} ${s[1]}에게 답했다: ${o[0]}`); });
}

/* ───────── 엔딩 ───────── */
function trigger(k) {
  if (S.ends[k]) return; S.ends[k] = 1;
  const big = ['thiel', 'scholar', 'school', 'classic', 'platform', 'revolution', 'minister', 'ceo', 'pantheon', 'island'];
  if (big.includes(k)) S.topEnd = S.topEnd || k;
  showEnd(k, !['burnout', 'diogenes'].includes(k));
}
function finalEnding() {
  let k;
  if (S.topEnd) k = S.val.wisdom >= 3 ? 'sage' : S.val.people >= 3 ? 'friend' : S.topEnd;
  else if (S.lecMonths >= 120 && !S.hist.professor) k = 'lecturer';
  else if (S.huntMonths >= 48 && !S.hist.company) k = 'hunt';
  else if (S.c === 'kr' && (S.chicken || rnd() < .4)) k = 'chicken';
  else { const v = S.val, top = Object.keys(v).sort((a, b) => v[b] - v[a])[0]; k = v[top] === 0 ? 'normal' : top === 'wisdom' ? 'hermit' : top === 'people' ? 'warm' : 'normal'; }
  S.ends[k] = 0; showEnd(k, false);
}
function showEnd(k, canGo) {
  SEEN[k] = 1; try { localStorage.setItem(END_KEY, JSON.stringify(SEEN)); } catch (e) {}
  if (!canGo) try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  const e = ENDINGS[k];
  modal(`<div class="big">${e[0]}</div><div class="kicker">ENDING</div><h2>${e[1]}</h2><p>${e[2]}</p>
    <div class="endstat">${C().f} ${S.name} · ${age()}세 · ${node().e} ${(node().ranks || [node().n])[S.rank] || node().n}<br>
    💰 ${won(S.mo)} · 🧠 ${num(S.th)} · ⭐ ${num(S.fa)}<br>거장들에게 한 대답 — 야망 ${S.val.money} · 지혜 ${S.val.wisdom} · 사람 ${S.val.people}<br>
    엔딩 도감 ${Object.keys(SEEN).length}/${Object.keys(ENDINGS).length}</div>
    ${canGo ? '<button class="opt center" id="eGo">아니, 더 살아보겠다 →</button>' : ''}<button class="opt center primary" id="eRe">다시 태어나기 👶</button>`);
  $('#eRe').onclick = () => { close(); try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; startScreen(); };
  if (canGo) $('#eGo').onclick = close;
}

/* ───────── 저장 ───────── */
function save() { if (!S) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } }

/* ───────── UI 공통 ───────── */
function modal(h) { $('#box').innerHTML = h; $('#modal').classList.add('on'); }
function close() { $('#modal').classList.remove('on'); renderP(); draw(); }
const busy = () => $('#modal').classList.contains('on');
function modalMsg(t, d, after) { modal(`<h2>${t}</h2><p>${d}</p><button class="opt center primary" id="mOk">확인</button>`); $('#mOk').onclick = () => { close(); if (after) after(); }; }
function modalChoice(t, d, opts) { modal(`<h2>${t}</h2>${d ? `<p>${d}</p>` : ''}${opts.map((o, i) => `<button class="opt" data-mc="${i}">${o[0]}</button>`).join('')}`);
  document.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => { close(); opts[+b.dataset.mc][1](); renderP(); draw(); }); }
let bubT; function say(t) { if (!S) return; S.log.unshift(`<span class="ld">${S.y}.${String(S.m).padStart(2, '0')}</span> ${t}`); if (S.log.length > 120) S.log.pop();
  const b = $('#bub'); if (b) { b.innerHTML = t; b.classList.add('on'); clearTimeout(bubT); bubT = setTimeout(() => b.classList.remove('on'), 5000); } if (tab === 'diary') renderP(); }
function pop(e, t, col) { const st = $('#stage'), r = st.getBoundingClientRect(); const c = document.createElement('div'); c.className = 'coin'; c.textContent = t; if (col) c.style.color = col;
  c.style.left = ((e && e.clientX ? e.clientX - r.left : r.width / 2) - 30) + 'px'; c.style.top = ((e && e.clientY ? e.clientY - r.top : r.height / 2) - 20) + 'px'; st.appendChild(c); setTimeout(() => c.remove(), 900); }
function bump() { const c = $('#char'); c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); }
function faceFor() { if (S.rest > 0) return '😵'; const a = age(); if (a >= 62) return '🧓'; if (a >= 45) return '🧔';
  return { none: '🧑', alba: '🧑‍🍳', tutor: '🧑‍🏫', instructor: '🧑‍🏫', academy: '👨‍🏫', hunt: '🧑‍💻', company: S.rank >= 4 ? '🤵' : '🧑‍💼', gongsi: '📖', civil: '🧑‍💼', master: '🧑‍🎓', phd: '🧑‍🔬', lecturer: '🧑‍🏫', professor: '👨‍🏫', writer: '🧑‍🎨', youtube: '🤳', startup: S.rank >= 5 ? '🤑' : '🧑‍💻', union: '✊' }[S.pos] || '🧑'; }

/* ───────── 시작 화면 ───────── */
function startScreen() {
  let sel = 'kr'; const sv = load();
  $('#app').innerHTML = `<div class="start">
    <div class="logo">🛋️</div><h1>철학과 키우기</h1><p class="sub">"철학과 가서 뭐 먹고 살래?"<br>그 질문이 현실이 된 날부터, 70세까지.</p>
    ${sv && sv.c ? `<button class="btn primary wide" id="cont">이어하기 · ${COUNTRIES[sv.c].f} ${sv.name} ${22 + Math.floor(sv.months / 12)}세</button>` : ''}
    <input id="nm" class="inp" maxlength="8" placeholder="이름" value="${pick(['현배', '지훈', '서연', '민준', '하은', '도윤'])}">
    <div class="sec">어느 나라에서 졸업할까?</div>
    <div class="cgrid">${Object.keys(COUNTRIES).map(k => { const c = COUNTRIES[k]; return `<button class="cty ${k === sel ? 'on' : ''}" data-c="${k}"><div class="ctop"><span class="flag">${c.f}</span><b>${c.n}</b><span class="lv">생활비 ${won(c.live)}</span></div>${c.pros.map(x => `<div class="pro">＋ ${x}</div>`).join('')}${c.cons.map(x => `<div class="con">－ ${x}</div>`).join('')}</button>`; }).join('')}</div>
    <button class="btn primary wide big" id="go">졸업하기 🎓</button>
    <p class="foot">엔딩 도감 ${Object.keys(SEEN).length} / ${Object.keys(ENDINGS).length} · 한 인생 약 4~5시간 · 자동 저장</p></div>`;
  document.querySelectorAll('[data-c]').forEach(d => d.onclick = () => { sel = d.dataset.c; document.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === d)); });
  if (sv && sv.c) $('#cont').onclick = () => { S = sv; buildGame(); say('다시 왔구나.'); };
  $('#go').onclick = () => { newLife(sel, $('#nm').value.trim() || '무명'); buildGame(); intro(); };
}
function intro() {
  modal(`<div class="big">🎓</div><div class="kicker">${S.y}년 ${S.m}월 · 22세</div><h2>"철학과 가서 뭐 먹고 살래?"</h2>
  <p>졸업식 날, 학사모를 던졌다. 떨어진 학사모를 줍다가 깨달았다.</p><p>친척 어른들이 10년 동안 하던 그 말. 그게 <b>오늘부터 현실</b>이다.</p>
  <p>통장 잔고 ${won(S.mo)}. 월세는 다음 주.</p>
  <div class="howto"><b>하는 법</b><br>🌳 <b>진로 트리</b>에서 할 일을 고른다 → 무대를 <b>탭</b>하면 그 일을 한다(=노동).<br>⏳ 25초가 한 달. 매달 월급·생활비가 정산되고, 승진·합격·출간은 <b>확률</b>로 판정된다.<br>⚡ 탭하면 체력이 닳고, 과로하면 멘탈이 닳는다.</div>
  <button class="opt center primary" id="iGo">일단 뭐라도 하자</button>`);
  $('#iGo').onclick = close;
}

/* ───────── 게임 화면 ───────── */
function buildGame() {
  $('#app').innerHTML = `
  <header class="hud">
    <div class="hrow"><div class="date" id="date"></div><div class="spd">${[0, 1, 2, 4].map(v => `<button data-sp="${v}">${v ? v + 'x' : '⏸'}</button>`).join('')}</div></div>
    <div class="money"><span id="mo"></span><span class="net" id="net"></span></div>
    <div class="mbar"><i id="mbar"></i></div>
    <div class="chips">
      <div class="chip"><span>🧠 사유</span><b id="th"></b></div><div class="chip"><span>⭐ 명성</span><b id="fa"></b></div>
      <div class="chip gauge"><span>⚡ 체력</span><div class="g"><i id="hpb"></i></div></div><div class="chip gauge"><span>💗 멘탈</span><div class="g"><i id="mnb"></i></div></div>
    </div>
    <div class="vars"><span id="econ"></span><span id="trend"></span></div>
  </header>
  <section class="stage" id="stage">
    <div class="bubble" id="bub"></div><div class="bg" id="bg"></div><div class="char" id="char"></div>
    <div class="tag" id="tag"></div><div class="work"><div class="wl" id="wl"></div><div class="wg"><i id="wg"></i></div></div>
  </section>
  <div class="tgts" id="tgts"></div>
  <main class="panel" id="panel"></main>
  <nav class="nav" id="nav"></nav>`;
  $('#stage').addEventListener('pointerdown', tap);
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const v = +b.dataset.sp; if (!v) paused = !paused; else { speed = v; paused = false; } markSpeed(); });
  markSpeed(); renderNav(); renderP(); draw();
}
function markSpeed() { document.querySelectorAll('[data-sp]').forEach(b => { const v = +b.dataset.sp; b.classList.toggle('on', v ? (!paused && speed === v) : paused); }); }
function renderNav() {
  const T = [['tree', '🌳', '진로'], ['status', '📋', '현황'], ['study', '🎓', '학원'], ['shop', '🛒', '상점'], ['diary', '📔', '일지'], ['end', '🏁', '엔딩']];
  $('#nav').innerHTML = T.map(t => `<button data-t="${t[0]}" class="${tab === t[0] ? 'on' : ''}"><b>${t[1]}</b>${t[2]}</button>`).join('');
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; renderNav(); renderP(); });
}

function draw() {
  if (!S || !$('#mo')) return;
  const n = node();
  $('#date').innerHTML = `${C().f} <b>${S.y}년 ${S.m}월</b> · ${age()}세${S.partner ? ' 💞' : ''}`;
  $('#mo').textContent = won(S.mo); $('#mo').classList.toggle('neg', S.mo < 0);
  const net = S.lastNet; $('#net').textContent = net == null ? '' : `지난달 ${net >= 0 ? '+' : ''}${won(net)}`; $('#net').className = 'net ' + (net < 0 ? 'neg' : 'pos');
  $('#mbar').style.width = (monthT / MONTH_SEC * 100) + '%';
  $('#th').textContent = num(S.th); $('#fa').textContent = num(S.fa);
  $('#hpb').style.width = S.hp + '%'; $('#mnb').style.width = S.mental + '%'; $('#mnb').classList.toggle('low', S.mental < 25);
  $('#econ').textContent = `경기 ${S.econ >= 1.1 ? '📈 호황' : S.econ <= .85 ? '📉 불황' : '➖ 보통'} ${S.econ.toFixed(2)}`;
  $('#trend').textContent = `철학 트렌드 ${S.trend >= 1.3 ? '🔥' : S.trend <= .7 ? '🧊' : '➖'} ${S.trend.toFixed(2)}`;
  $('#char').textContent = faceFor(); $('#bg').textContent = HOUSES[S.house].e + (S.it.books ? '📚' : '') + (S.it.cat ? '🐈' : '') + (S.it.mac ? '💻' : '');
  const rk = n.ranks ? n.ranks[S.rank] : n.n;
  let tg = S.tgt === 'read' ? '📖 독서 중 — 사유가 쌓인다' : S.tgt === 'side' ? '🏪 투잡 알바 — 한 번 탭 = 5만원' : `${n.e} ${rk}`;
  $('#tag').textContent = tg;
  const w = W();
  if (S.tgt !== 'main' || !w) { $('#wl').textContent = S.pos === 'writer' ? `원고 진척 ${Math.floor(S.wr.ms)}%` : S.pos === 'youtube' ? `영상 편집 ${Math.min(100, Math.floor(S.yt.prog))}%` : S.pos === 'none' ? '할 일이 없다… 🌳 진로에서 골라보자' : '　'; $('#wg').style.width = (S.pos === 'writer' ? S.wr.ms : S.pos === 'youtube' ? Math.min(100, S.yt.prog) : 0) + '%'; }
  else { $('#wl').textContent = `이번 달 노동 ${Math.floor(S.work)} / ${w}${S.work >= w ? ' ✔' : ''}`; $('#wg').style.width = Math.min(100, S.work / w * 100) + '%'; }
  $('#wg').classList.toggle('full', w && S.work >= w);
  renderTgts();
}
function renderTgts() {
  const n = node(); const items = [['main', `${n.e} 본업`, n.n]];
  if (S.pos !== 'alba') items.push(['side', '🏪 투잡 알바', '탭당 5만원']);
  items.push(['read', '📖 독서', '사유 +']);
  const h = items.map(i => `<button class="tg ${S.tgt === i[0] ? 'on' : ''}" data-g="${i[0]}"><b>${i[1]}</b><small>${i[2]}</small></button>`).join('');
  const el = $('#tgts'); if (el._h === h) return; el._h = h; el.innerHTML = h;
  el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { S.tgt = b.dataset.g; draw(); });
}

/* ───────── 패널 ───────── */
function nodeState(k) {
  if (S.pos === k) return 'cur';
  const n = NODES[k];
  if (n.req && n.req(S)) return 'open';
  if (S.hist[k] > 0) return 'past';
  return 'lock';
}
function renderP() {
  const P = $('#panel'); if (!P || !S) return; let h = '';
  if (tab === 'tree') {
    h = `<div class="sec">🌳 진로 트리 <small>조건을 채우면 다음 칸이 열린다</small></div><div class="root">🎓 철학과 졸업</div><div class="tree">` +
      BRANCHES.map(b => `<div class="branch"><div class="bh">${b.e} ${b.n}</div>` + b.nodes.map((k, i) => {
        const n = NODES[k], st = nodeState(k);
        const btn = st === 'cur' ? '<span class="nb cur">지금</span>' : st === 'open' ? `<button class="nb go" data-start="${k}">${n.cost ? won(n.cost) + ' · ' : ''}시작</button>` : st === 'past' ? `<span class="nb past">${S.hist[k]}개월 경험</span>` : `<span class="nb lk">🔒</span>`;
        return `${i ? '<div class="arrow">↓</div>' : ''}<div class="node ${st}"><div class="nt">${n.e} <b>${n.n}</b>${btn}</div><div class="nd">${n.d}</div>${st === 'lock' || st === 'past' ? `<div class="nr">조건: ${n.reqT}</div>` : ''}</div>`;
      }).join('') + `</div>`).join('') + `</div>`;
  }
  if (tab === 'status') {
    const n = node();
    h = `<div class="sec">📋 지금 나는 <small>${S.posMonths}개월째</small></div><div class="card cur"><div class="ct">${n.e} <b>${n.n}</b></div>${n.ranks ? `<div class="lad">${n.ranks.map((x, i) => `<span class="${i === S.rank ? 'on' : i < S.rank ? 'd' : ''}">${x}</span>`).join('')}</div>` : ''}<div class="cd">${n.d}</div>${posDetail()}</div>`;
    h += `<div class="sec">🛠️ 숙련도 <small>탭할수록 오른다 · 높을수록 느리게</small></div><div class="skills">` + Object.keys(SKILLS).map(k => `<div class="sk"><span>${SKILLS[k].e} ${SKILLS[k].n}</span><div class="g"><i style="width:${S.sk[k]}%"></i></div><b>${Math.floor(S.sk[k])}</b></div>`).join('') + `</div>`;
    h += `<div class="sec">📊 이번 달 가계부</div><div class="card"><div class="kv"><span>생활비 (${C().n})</span><b>-${won(C().live)}</b></div><div class="kv"><span>${HOUSES[S.house].n} 월세</span><b>-${won(rentNow())}</b></div><div class="kv"><span>경기 지수</span><b>${S.econ.toFixed(2)}</b></div><div class="kv"><span>철학 트렌드</span><b>${S.trend.toFixed(2)}</b></div></div>`;
    if (age() >= 60) h += `<button class="btn wide ghost" id="retire">🌅 은퇴하고 엔딩 보기</button>`;
  }
  if (tab === 'study') {
    h = `<div class="sec">🎓 학원 다니기 <small>돈으로 숙련도를 산다 (한 달에 과목당 1번)</small></div>` + COURSES.map(c => { const lv = S.courses[c.k] || 0, cost = Math.floor(c.c * Math.pow(1.35, lv)), done = S.courses[c.k + '_m'] === S.months;
      return `<div class="row"><div class="ic">${SKILLS[c.k].e}</div><div class="tx"><b>${c.n}</b><small>${SKILLS[c.k].n} +3 (현재 ${Math.floor(S.sk[c.k])}) · ${lv}회 수강</small></div><button class="btn" data-co="${c.k}" ${S.mo < cost || done ? 'disabled' : ''}>${done ? '이번 달 완료' : won(cost)}</button></div>`; }).join('');
  }
  if (tab === 'shop') {
    h = `<div class="sec">🛒 아이템</div>` + ITEMS.map(i => `<div class="row"><div class="ic">${i.e}</div><div class="tx"><b>${i.n}</b><small>${i.d}</small></div>${S.it[i.id] ? '<button class="btn" disabled>보유</button>' : `<button class="btn" data-it="${i.id}" ${S.mo < i.c ? 'disabled' : ''}>${won(i.c)}</button>`}</div>`).join('');
    h += `<div class="sec">🏠 집 <small>월세는 매달 빠진다</small></div>` + HOUSES.map((x, i) => `<div class="row ${i === S.house ? 'cur' : ''}"><div class="ic">${x.e}</div><div class="tx"><b>${x.n}</b><small>${x.rent ? '월세 ' + won(x.rent * (C().rentx || 1)) : '월세 없음 (자가)'}${x.buy ? ' · 보증금/매매 ' + won(x.buy) : ''}</small></div>${i === S.house ? '<button class="btn" disabled>거주 중</button>' : i === S.house + 1 ? `<button class="btn" data-h="${i}" ${S.mo < x.buy ? 'disabled' : ''}>이사</button>` : i < S.house ? '<button class="btn" disabled>✔</button>' : '<button class="btn" disabled>🔒</button>'}</div>`).join('');
  }
  if (tab === 'diary') h = `<div class="sec">📔 일지</div><div class="log">${S.log.join('<br>') || '아직 비어 있다.'}</div>`;
  if (tab === 'end') h = `<div class="sec">🏁 엔딩 도감 <small>${Object.keys(SEEN).length} / ${Object.keys(ENDINGS).length}</small></div><div class="endg">${Object.keys(ENDINGS).map(k => `<div class="${SEEN[k] ? '' : 'lk'}">${SEEN[k] ? ENDINGS[k][0] + ' ' + ENDINGS[k][1] : '❓ ???'}</div>`).join('')}</div>
    <div class="card"><div class="cd">💡 진로의 정상은 각각 엔딩이 된다. 70세에 은퇴하면 그동안의 길과 거장들에게 한 대답으로 엔딩이 갈린다. 실패에도 엔딩이 있다.</div></div><button class="btn wide danger" id="wipe">이번 인생 포기하고 처음부터</button>`;
  P.innerHTML = h;
  P.querySelectorAll('[data-start]').forEach(b => b.onclick = () => tryStart(b.dataset.start));
  P.querySelectorAll('[data-co]').forEach(b => b.onclick = () => { const k = b.dataset.co, c = COURSES.find(x => x.k === k), lv = S.courses[k] || 0, cost = Math.floor(c.c * Math.pow(1.35, lv)); if (S.mo < cost) return; S.mo -= cost; S.courses[k] = lv + 1; S.courses[k + '_m'] = S.months; S.sk[k] = clamp(S.sk[k] + 3 * (1 - S.sk[k] / 120), 0, 100); say(`🎓 ${c.n} 수강 완료!`); renderP(); draw(); });
  P.querySelectorAll('[data-it]').forEach(b => b.onclick = () => { const i = ITEMS.find(x => x.id === b.dataset.it); if (S.mo < i.c) return; S.mo -= i.c; S.it[i.id] = 1; if (i.id === 'mustache') S.fameX = 1.5; say(`${i.e} ${i.n} 구입!`); renderP(); draw(); });
  P.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const i = +b.dataset.h, x = HOUSES[i]; if (S.mo < x.buy) return; S.mo -= x.buy; S.house = i; say(`${x.e} ${x.n}(으)로 이사!`); if (i === HOUSES.length - 1) trigger('island'); renderP(); draw(); });
  if ($('#ms')) $('#ms').onclick = submitMs;
  if ($('#retire')) $('#retire').onclick = () => { S.retired = 1; finalEnding(); };
  if ($('#wipe')) $('#wipe').onclick = () => modalChoice('정말?', '이번 인생의 진행이 사라진다.', [['처음부터', () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; startScreen(); }], ['취소', () => {}]]);
}
function posDetail() {
  const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
  switch (S.pos) {
    case 'none': return kv('수입', '없음') + '<div class="hint">🌳 진로 탭에서 할 일을 고르자. 그동안 탭하면 생각(사유)이 쌓인다.</div>';
    case 'alba': return kv('월급 (노동 다 채우면)', won(node().pay * node().rankPay[S.rank] * (C().salary || 1))) + '<div class="hint">6개월 넘게 성실히 하면 더 좋은 알바로 올라갈 확률이 생긴다.</div>';
    case 'tutor': return kv('학생 수', `${S.tu.st}명 / 8`) + kv('필요 노동', `${Math.max(8, S.tu.st * 5)}탭/월`) + '<div class="hint">학생이 없으면 탭 = 전단지 붙이기. 노동을 덜 채우면 학생이 그만둔다.</div>';
    case 'academy': return kv('학생 수', S.ac.st + '명') + kv('임대료', won(400e4 * (1 + S.rank * 1.5))) + kv('수용 한계', [40, 120, 300, 700, 1500][S.rank] + '명') + kv('다음 확장 조건', ['학생 30명 · 2년', '학생 90명 · 5년', '학생 240명 · 10년', '학생 600명 · 15년', '-'][S.rank]);
    case 'hunt': return kv('취준 기간', `${S.huntMonths}개월`) + kv('이번 달 합격 확률', pct(clamp((.02 + S.sk.office / 500 + (S.huntBuff || 0)) * S.econ * (C().work ? 1.1 : 1) * vm('money'), .01, .45))) + '<div class="hint">노동 게이지를 다 채운 달에만 지원서가 나간다. 실무력과 경기가 확률을 좌우한다.</div>';
    case 'company': { const need = (node().promoYears[S.rank] || 99) * 12 * (C().slowPromo || 1); return kv('월급', won(node().rankPay[S.rank] * (C().salary || 1) * bonus('company'))) + kv('승진 심사', S.rank >= 6 ? '정상' : S.rankMonths >= need ? '올해 12월 심사 대상' : `${Math.ceil((need - S.rankMonths) / 12)}년 후 대상`) + kv('평균 성과', S.perfN ? pct(S.perfSum / S.perfN) : '-'); }
    case 'gongsi': return kv('시험', '매년 4월') + kv('합격 확률', pct(clamp(.02 + S.sk.office / 330, .02, .32) * bonus('civil'))) + kv('공시 기간', S.posMonths + '개월');
    case 'civil': return kv('월급', won(node().rankPay[S.rank] * (C().salary || 1))) + kv('승진', `${node().promoYears[S.rank] || '-'}년 근속 후 매년 1월 심사`);
    case 'master': return kv('졸업 조건', `24개월 + 연구력 25 (현재 ${Math.floor(S.sk.research)})`) + kv('등록금', C().freeGrad ? '무료 🇩🇪' : '학기마다 450만원');
    case 'phd': return kv('게재 논문', `${S.papers}편 / 3`) + kv('기간', `${S.posMonths}개월 / 최소 48`) + kv('월 게재 확률', pct(S.sk.research / 900 * vm('wisdom')));
    case 'lecturer': return kv('게재 논문', S.papers + '편') + kv('임용 지원', `${S.lecApply}번 (3월·9월)`) + kv('임용 확률', pct(clamp(.008 + S.papers * .012 + S.sk.research / 1500 + S.fa / 2e5, .005, .3) * bonus('professor') * Math.sqrt(S.econ)));
    case 'professor': return kv('게재 논문', S.papers + '편') + kv('다음 승진', ['부교수: 6년+논문 10편', '정교수: 6년+논문 20편', '석학: 논문 40편+명성 5천', '-'][S.rank]);
    case 'writer': { const w = S.wr, p = S.rank === 0 ? clamp(.005 + Math.pow(S.sk.write / 100, 2.5) * .4, .005, .45) : clamp(.1 + S.sk.write / 200, .1, .6);
      return `<div class="kv"><span>원고 진척</span><b>${Math.floor(w.ms)}%</b></div><div class="g big"><i style="width:${w.ms}%"></i></div>` + kv(S.rank === 0 ? '신춘문예 당선 확률' : '출판 확률', pct(p)) + kv('낸 책 / 총 판매', `${w.books}권 / ${num(w.sales)}부`) + kv('낙선·거절', w.rej + '번') +
        `<button class="btn wide primary" id="ms" ${w.ms < 100 ? 'disabled' : ''}>${w.ms < 100 ? '원고를 끝까지 쓰자 (탭)' : S.rank === 0 ? '📮 신춘문예에 투고' : '📮 출판사에 투고'}</button><div class="hint">글을 써도 월급은 없다. 오르는 건 글솜씨와 진척도뿐. 생활비는 투잡 알바로.</div>`; }
    case 'youtube': { const y = S.yt; return kv('구독자', num(y.subs) + '명') + kv('영상 수', y.videos + '개') + kv('마지막 영상 조회수', num(y.last)) + kv('채널 운영', `${Math.floor(y.months / 12)}년 ${y.months % 12}개월`) + kv('수익 창출', y.subs >= 1000 ? '✔ 조회수당 2.5원' : '구독자 1,000명부터') + '<div class="hint">탭 = 영상 편집. 100%가 되면 자동 업로드. 조회수는 운이 크다.</div>'; }
    case 'startup': return kv('회사 현금', won(S.su.cash)) + kv('월 소진', won([300, 500, 900, 1800, 4000, 8000, 0][S.rank] * 1e4)) + kv('다음 단계 확률', pct(clamp([.06, .05, .04, .035, .03, .025][S.rank] * (1 + S.sk.biz / 70) * S.econ * bonus('startup') * vm('money'), .005, .4)) + '/월') + kv('실패 횟수', S.fails + '번');
    case 'union': return kv('월급', won(node().rankPay[S.rank] * (C().salary || 1))) + kv('선거', '매년 5월');
    default: return kv('월급', won((node().pay || 0) * (C().salary || 1)));
  }
}

/* ───────── 루프 ───────── */
let last = performance.now();
function loop(now) {
  const dt = Math.min(.25, (now - last) / 1000); last = now;
  if (S && $('#mo') && !busy() && !paused) {
    S.hp = clamp(S.hp + 2.4 * dt * speed * (S.it.coffee ? 1.4 : 1) * (S.rest > 0 ? 0 : 1), 0, 100);
    monthT += dt * speed;
    if (monthT >= MONTH_SEC) { monthT = 0; monthEnd(); }
    drawT += dt; if (drawT > .2) { drawT = 0; draw(); }
  }
  requestAnimationFrame(loop);
}
let drawT = 0;
window.__game = { NODES, get S() { return S; }, monthEnd, tap, setPos, submitMs, upload, newLife, buildGame };
startScreen(); requestAnimationFrame(loop);

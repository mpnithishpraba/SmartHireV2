const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const icon = name => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;

let state = {jobs: [], candidates: [], weights: {}, role_presets: [], resume_examples: []};
let activeCandidate = null, dashboardCandidate = null, activeTab = 'resume';
let aptitudeQuestions = null, aptitudeCandidate = null, aptitudeDeadline = null, aptitudeTimer = null;
let codingCandidate = null, interviewCandidate = null;
let cameraStream = null, faceStream = null, facePreviewTimer = null, facePreviewBusy = false;
let microphoneStream = null, recorder = null, questionAudio = null, audioChunks = [];

const labels = {skills: 'Skills', experience: 'Experience', education: 'Education', certificates: 'Certificates', location: 'Location', shift: 'Shift'};
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_DEFAULTS = {aptitude: 2, coding: 1, interview: 2};
const STAGES = [
  {key: 'resume', label: 'Resume'},
  {key: 'identity', label: 'Identity'},
  {key: 'aptitude', label: 'Aptitude'},
  {key: 'coding', label: 'Coding'},
  {key: 'interview', label: 'Interview'},
];
const PHASES = ['resume', 'aptitude', 'coding', 'interview'];
const cap = text => String(text ?? '').replace(/^./, ch => ch.toUpperCase());
const snippetText = text => {
  const s = String(text || '').trim();
  if (!s) return 'Candidate supplied';
  if (s.length < 60) return s;
  return `…${s.replace(/^\S+\s+/, '').replace(/\s+\S+$/, '')}…`;
};
const pct = value => `${Number(value).toFixed(Number(value) % 1 ? 1 : 0)}%`;

/* ---------- feedback ---------- */
function message(text, kind = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  toast.innerHTML = `${icon(kind === 'error' ? 'alert' : 'check')}<p>${esc(text)}</p><button type="button" aria-label="Dismiss">${icon('x')}</button>`;
  const close = () => { toast.classList.add('leaving'); setTimeout(() => toast.remove(), 160); };
  toast.querySelector('button').onclick = close;
  $('toasts').append(toast);
  if (kind !== 'error') setTimeout(close, 5000);
}

/* ---------- navigation ---------- */
function page(name) {
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === name));
  document.querySelectorAll('#nav button').forEach(x => {
    const on = x.dataset.page === name;
    x.classList.toggle('active', on);
    if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
  });
  if (name === 'assess') renderAssessment();
  if (name === 'dashboard') renderDashboard();
  window.scrollTo({top: 0});
}
document.querySelectorAll('#nav button').forEach(button => button.onclick = () => {
  if (button.dataset.page === 'candidates') $('applyBanner').classList.add('hidden');
  page(button.dataset.page);
});
document.addEventListener('click', event => {
  const go = event.target.closest('[data-goto]');
  if (go) page(go.dataset.goto);
});

/* ---------- api ---------- */
async function api(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw Error(body.error || 'Request failed');
  return body;
}
const jsonPost = (url, data) => api(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});

async function refresh() {
  state = await api('/api/state');
  $('countJobs').textContent = state.jobs.length || '';
  $('countCandidates').textContent = state.candidates.length || '';
  $('countOpenings').textContent = state.jobs.length || '';
  renderJobs(); renderOpenings(); renderExamples(); renderSelects(); renderDashboard(); renderAssessment();
}

/* ---------- shared: phase status and tab bands ---------- */
function phaseStatus(c, key) {
  const s = (c.stages || {})[key];
  if (key === 'resume') return {state: 'done', text: pct(c.phase1.score)};
  if (key === 'identity') {
    const f = c.face_check || {};
    if (f.status === 'match') return {state: 'done', text: 'Match'};
    if (f.status === 'no_match') return {state: 'flag', text: 'No match'};
    if (f.status === 'inconclusive') return {state: 'review', text: 'Inconclusive'};
    return {state: 'pending', text: 'Optional'};
  }
  if (!s) return {state: 'pending', text: 'Not started'};
  if (key === 'interview' && s.score === null) return {state: 'review', text: 'Needs rating'};
  return {state: 'done', text: pct(s.score)};
}
function resumeConfirmNotice(c) {
  if (c.phase1.review.length) return `<div class="notice warn confirm-notice">${icon('alert')}<span>Confirm before a hiring decision: ${esc(c.phase1.review.join('; '))}</span><button class="button secondary small" type="button" data-confirm-resume>Mark as confirmed</button></div>`;
  const last = (c.phase1.confirmed || []).at(-1);
  return last
    ? `<p class="notice ok">${icon('check')}<span>Confirmed by a recruiter: ${esc(last.items.join('; '))}.</span></p>`
    : `<p class="notice ok">${icon('check')}<span>All resume preferences are recorded. Review the source evidence before deciding.</span></p>`;
}
function bindResumeConfirm(root, id, rerender) {
  const button = root.querySelector('[data-confirm-resume]');
  if (button) button.onclick = async () => {
    try {
      button.disabled = true;
      await jsonPost(`/api/candidates/${encodeURIComponent(id)}/resume/confirm`, {});
      state = await api('/api/state');
      rerender();
      message('Resume items marked as confirmed.');
    } catch (e) { message(e.message, 'error'); button.disabled = false; }
  };
}
const STATE_WORDS = {done: 'complete', pending: 'not started', review: 'needs review', flag: 'flagged'};
function bands(c) {
  return `<span class="bands">${PHASES.map(key => {
    const st = phaseStatus(c, key);
    return `<span class="band ph-${key}" data-state="${st.state}" title="${labelFor(key)}: ${esc(st.text)}"></span>`;
  }).join('')}<span class="sr-only">${PHASES.map(key => `${labelFor(key)} ${STATE_WORDS[phaseStatus(c, key).state]}`).join(', ')}</span></span>`;
}
const labelFor = key => (STAGES.find(s => s.key === key) || {label: key}).label;
const jobFor = c => state.jobs.find(j => j.id === c.job_id) || {};

/* ---------- 1 · roles ---------- */
function renderJobs() {
  $('jobList').innerHTML = state.jobs.length
    ? state.jobs.map(j => `<div class="list-row"><strong>${esc(j.title)}</strong><p class="meta">${esc(cap(j.work_mode))} · ${esc(j.location || 'Any location')} · ${esc(cap(j.shift))} shift</p><p class="meta">Requires ${esc(j.required_skills.join(', ') || 'no listed skills')}${j.education.length ? ` · ${esc(j.education.join(', '))}` : ''}${j.certificates.length ? ` · ${esc(j.certificates.join(', '))}` : ''}</p></div>`).join('')
    : '<p class="list-empty">No roles yet. Pick a template or fill in the form, then save the role.</p>';
  $('rolePresets').innerHTML = state.role_presets.map((role, i) => `<button type="button" class="template" data-preset="${i}"><strong>${esc(role.name)}</strong><small>${esc(cap(role.work_mode))} · ${esc(cap(role.shift))} shift</small></button>`).join('');
  document.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => {
    const role = state.role_presets[Number(button.dataset.preset)], form = $('jobForm');
    for (const [key, value] of Object.entries(role)) {
      if (key === 'name' || key === 'difficulty') continue;
      if (form.elements[key] && form.elements[key].type !== 'checkbox') form.elements[key].value = value;
      else if (form.elements[key]) form.elements[key].checked = Boolean(value);
    }
    for (const [key, value] of Object.entries(role.difficulty || {})) setDifficulty(key, value);
    document.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('selected', b === button));
    updateWeightTotal();
    message(`${role.name} template loaded. Review the details and save the role.`);
  });
}

function renderWeightFields() {
  $('weightFields').innerHTML = Object.entries(state.weights).map(([key, value]) => `<div class="weight"><label for="w-${esc(key)}">${esc(labels[key])}</label><div class="suffix"><input id="w-${esc(key)}" type="number" name="weight_${esc(key)}" min="0" max="100" step="1" value="${value}" required><span>%</span></div></div>`).join('');
  $('weightFields').querySelectorAll('input').forEach(input => input.addEventListener('input', updateWeightTotal));
  updateWeightTotal();
}
function updateWeightTotal() {
  const total = [...$('weightFields').querySelectorAll('input')].reduce((sum, input) => sum + (Number(input.value) || 0), 0);
  const ok = total === 100;
  $('weightTotal').innerHTML = `<span class="figure">${total}</span> of 100 ${ok ? '' : `<span class="warn-text">· adjust by ${100 - total > 0 ? '+' : ''}${100 - total} to save</span>`}`;
  $('weightTotal').dataset.ok = ok;
  $('saveRole').disabled = !ok;
}

function renderDifficultyFields() {
  $('difficultyFields').innerHTML = Object.entries(DIFFICULTY_DEFAULTS).map(([key, def]) => `<fieldset class="segmented"><legend>${labelFor(key)}</legend><div class="seg">${LEVELS.map((level, i) => `<label><input type="radio" name="difficulty_${key}" value="${i + 1}" ${i + 1 === def ? 'checked' : ''}><span>${level}</span></label>`).join('')}</div></fieldset>`).join('');
}
function setDifficulty(key, value) {
  const input = document.querySelector(`input[name="difficulty_${key}"][value="${Number(value)}"]`);
  if (input) input.checked = true;
}

document.querySelectorAll('.skill-source').forEach(box => {
  const fileInput = box.querySelector('.skill-file'), textarea = $(box.dataset.target);
  box.querySelectorAll('.skill-mode input').forEach(radio => radio.onchange = () => {
    fileInput.value = '';
    fileInput.accept = radio.value === 'pdf' ? '.pdf,application/pdf' : '.csv,text/csv';
    fileInput.classList.toggle('hidden', radio.value === 'type');
    if (radio.value === 'type') textarea.focus(); else fileInput.click();
  });
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      textarea.disabled = true;
      const result = await api('/api/skills/extract', {method: 'POST', body});
      const existing = textarea.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      const merged = [...new Map([...existing, ...result.skills].map(s => [s.toLowerCase(), s])).values()];
      textarea.value = merged.join(', ');
      message(`${result.skills.length} skills read from ${file.name}. Review them before saving.`);
    } catch (e) { message(e.message, 'error'); }
    finally { textarea.disabled = false; }
  };
});
$('jobForm').addEventListener('reset', () => document.querySelectorAll('.skill-file').forEach(input => input.classList.add('hidden')));

$('jobForm').onsubmit = async event => {
  event.preventDefault();
  const f = new FormData(event.target);
  const weights = {};
  for (const key of Object.keys(state.weights)) weights[key] = Number(f.get('weight_' + key));
  const data = Object.fromEntries(f.entries());
  data.weights = weights;
  data.difficulty = {aptitude: Number(f.get('difficulty_aptitude')), coding: Number(f.get('difficulty_coding')), interview: Number(f.get('difficulty_interview'))};
  data.location_required = f.has('location_required');
  data.shift_required = f.has('shift_required');
  const button = $('saveRole');
  try {
    button.disabled = true; button.textContent = 'Saving…';
    await jsonPost('/api/jobs', data);
    message('Role saved. Add a candidate next.');
    event.target.reset();
    document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('selected'));
    await refresh();
    page('candidates');
  } catch (e) { message(e.message, 'error'); }
  finally { button.textContent = 'Save role'; updateWeightTotal(); }
};

/* ---------- openings ---------- */
function renderOpenings() {
  const list = (label, items) => items.length ? `<div class="opening-row"><span class="field-label">${label}</span><p>${items.map(x => `<span class="skill">${esc(x)}</span>`).join('')}</p></div>` : '';
  $('openingList').innerHTML = state.jobs.length ? state.jobs.map(j => `<article class="card opening">
      <div class="opening-head"><h3>${esc(j.title)}</h3><p class="meta">${esc(cap(j.work_mode))} · ${esc(j.location || 'Any location')} · ${esc(cap(j.shift))} shift${Number(j.min_experience) ? ` · ${esc(j.min_experience)}+ years` : ''}</p></div>
      ${list('Required skills', j.required_skills)}${list('Preferred skills', j.preferred_skills)}${list('Education', j.education)}${list('Certificates', j.certificates)}
      <div class="opening-foot"><button class="button" type="button" data-apply="${esc(j.id)}">Apply now${icon('arrow')}</button></div>
    </article>`).join('')
    : '<div class="empty"><p><strong>No openings yet.</strong> Roles appear here once a recruiter creates them.</p></div>';
  document.querySelectorAll('[data-apply]').forEach(button => button.onclick = () => applyFor(button.dataset.apply));
}
function showApplyBanner() {
  const job = state.jobs.find(j => j.id === $('candidateJob').value);
  $('applyBanner').classList.toggle('hidden', !job);
  if (job) $('applyBanner').innerHTML = `${icon('check')}<span>Applying for <strong>${esc(job.title)}</strong>. Fill in your details and add your resume below.</span>`;
}
function applyFor(jobId) {
  page('candidates');
  $('candidateJob').value = jobId;
  showApplyBanner();
  $('candidateForm').scrollIntoView({behavior: 'smooth', block: 'start'});
  $('c-name').focus({preventScroll: true});
}
$('candidateJob').addEventListener('change', () => { if (!$('applyBanner').classList.contains('hidden')) showApplyBanner(); });

/* ---------- 2 · candidates ---------- */
function renderExamples() {
  $('resumeExamples').innerHTML = state.resume_examples.map((sample, i) => `<div class="list-row example"><div><strong>${esc(sample.name)}</strong><p class="meta">${esc(sample.role_hint)} · ${esc(sample.location)}</p></div><div class="row-actions"><button type="button" class="button secondary small" data-sample="${i}">Use</button><a class="button ghost small icon-only" href="/api/examples/${encodeURIComponent(sample.id)}.pdf" aria-label="Download ${esc(sample.name)} PDF" title="Download PDF">${icon('download')}</a></div></div>`).join('');
  document.querySelectorAll('[data-sample]').forEach(button => button.onclick = () => {
    const sample = state.resume_examples[Number(button.dataset.sample)], form = $('candidateForm');
    for (const key of ['name', 'email', 'location', 'preferred_location', 'education', 'certificates', 'shifts', 'resume_text']) form.elements[key].value = sample[key] || '';
    form.elements.resume.value = '';
    message(`${sample.name} loaded. Check the role and screen the candidate.`);
  });
}

function renderSelects() {
  const options = state.jobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('');
  const oldJob = $('candidateJob').value;
  $('candidateJob').innerHTML = options;
  if (state.jobs.some(j => j.id === oldJob)) $('candidateJob').value = oldJob;
  $('noRoleNotice').classList.toggle('hidden', state.jobs.length > 0);
  $('screenBtn').disabled = !state.jobs.length;

  const old = $('assessmentCandidate').value;
  $('assessmentCandidate').innerHTML = '<option value="">Select a candidate</option>' + state.candidates.map(c => `<option value="${esc(c.id)}">${esc(c.name)} — ${esc(jobFor(c).title || 'Role')}</option>`).join('');
  if (state.candidates.some(c => c.id === old)) $('assessmentCandidate').value = old;
  else if (activeCandidate) $('assessmentCandidate').value = activeCandidate;

  const filter = $('dashboardJob').value;
  $('dashboardJob').innerHTML = '<option value="">All roles</option>' + options;
  if (filter) $('dashboardJob').value = filter;
}

$('candidateForm').onsubmit = async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  data.set('willing_to_relocate', data.has('willing_to_relocate') ? 'true' : 'false');
  const button = $('screenBtn');
  try {
    button.disabled = true; button.textContent = 'Screening…';
    const response = await fetch('/api/candidates', {method: 'POST', body: data});
    const c = await response.json();
    if (!response.ok) throw Error(c.error || 'Could not process resume');
    activeCandidate = c.id; activeTab = 'resume';
    message('Candidate screened and saved locally.');
    event.target.reset();
    $('applyBanner').classList.add('hidden');
    await refresh();
    $('assessmentCandidate').value = c.id;
    page('assess');
  } catch (e) { message(e.message, 'error'); }
  finally { button.disabled = !state.jobs.length; button.textContent = 'Screen candidate'; }
};

/* ---------- 4 · dashboard ---------- */
// Unsaved ticks, keyed by candidate id; cleared once the recruiter confirms.
const draftSelection = new Map();
const isTicked = c => draftSelection.has(c.id) ? draftSelection.get(c.id) : !!(c.selection && c.selection.selected);
// Candidates with a final overall score rank first; the rest follow by resume match.
const rankCompare = (a, b) => ((b.overall.score !== null) - (a.overall.score !== null))
  || ((b.overall.score ?? b.phase1.score) - (a.overall.score ?? a.phase1.score));
function dashboardRows() {
  const jobFilter = $('dashboardJob').value;
  return state.candidates.filter(c => !jobFilter || c.job_id === jobFilter).sort(rankCompare);
}
function updateShortlistBar(rows) {
  const ticked = rows.filter(isTicked).length, unsaved = rows.some(c => draftSelection.has(c.id));
  const confirmed = rows.filter(c => c.selection && c.selection.selected).length;
  $('shortlistCount').innerHTML = `<span class="figure">${ticked}</span> of ${rows.length} selected` +
    (unsaved ? ' · <span class="unsaved">not confirmed yet</span>' : confirmed ? ` · ${confirmed} confirmed` : '');
  $('confirmSelection').disabled = !unsaved;
  $('clearSelection').disabled = !ticked;
  $('applyTop').disabled = !rows.length;
  $('selectAllRows').checked = rows.length > 0 && ticked === rows.length;
  $('selectAllRows').indeterminate = ticked > 0 && ticked < rows.length;
}
function setTicks(rows, pick) {
  rows.forEach((c, i) => {
    const want = pick(c, i), saved = !!(c.selection && c.selection.selected);
    if (want === saved) draftSelection.delete(c.id); else draftSelection.set(c.id, want);
    const box = document.querySelector(`[data-shortlist="${CSS.escape(c.id)}"]`);
    if (box) { box.checked = want; box.closest('tr').classList.toggle('shortlisted', want); }
  });
  updateShortlistBar(rows);
}
$('applyTop').onclick = () => {
  const rows = dashboardRows(), n = Math.floor(Number($('topCount').value));
  if (!(n >= 1)) { message('Enter how many top applicants to select (1 or more).', 'error'); $('topCount').focus(); return; }
  setTicks(rows, (c, i) => i < n);
  message(`Top ${Math.min(n, rows.length)} applicants by score selected. Confirm to save.`);
};
$('clearSelection').onclick = () => setTicks(dashboardRows(), () => false);
$('selectAllRows').onchange = e => setTicks(dashboardRows(), () => e.target.checked);
$('confirmSelection').onclick = async () => {
  const rows = dashboardRows(), selected = rows.filter(isTicked);
  if (!confirm(`Confirm ${selected.length} of ${rows.length} applicants as shortlisted?${selected.length ? '\n\n' + selected.map(c => '• ' + c.name).join('\n') : ''}`)) return;
  const button = $('confirmSelection');
  try {
    button.disabled = true;
    await jsonPost('/api/selection', {in_view: rows.map(c => c.id), selected: selected.map(c => c.id)});
    rows.forEach(c => draftSelection.delete(c.id));
    state = await api('/api/state');
    renderDashboard();
    message(`Selection confirmed: ${selected.length} shortlisted.`);
  } catch (e) { message(e.message, 'error'); updateShortlistBar(rows); }
};

function renderDashboard() {
  const jobFilter = $('dashboardJob').value;
  const sorted = dashboardRows();
  const cell = (st) => st.state === 'pending' ? '<span class="muted">—</span>' : st.state === 'review' ? `<span class="tag review">${esc(st.text)}</span>` : `<span class="figure">${esc(st.text)}</span>`;
  $('candidateRows').innerHTML = sorted.map(c => {
    const j = jobFor(c), s = c.stages || {};
    const overall = c.overall.score === null ? `<span class="muted">${s.interview ? 'Pending rating' : 'Pending'}</span>` : `<span class="figure strong">${pct(c.overall.score)}</span>`;
    const review = c.phase1.review.length ? `<span class="tag review" title="${esc(c.phase1.review.join('; '))}">${esc(c.phase1.status)}</span>` : `<span class="tag ok">${esc(c.phase1.status)}</span>`;
    const ticked = isTicked(c), confirmedPick = c.selection && c.selection.selected && !draftSelection.has(c.id);
    const shortlist = `<td class="shortlist-col"><label class="check"><input type="checkbox" data-shortlist="${esc(c.id)}" ${ticked ? 'checked' : ''} aria-label="Shortlist ${esc(c.name)}">${confirmedPick ? '<span class="tag ok">Shortlisted</span>' : ''}</label></td>`;
    return `<tr class="${[dashboardCandidate === c.id ? 'selected' : '', ticked ? 'shortlisted' : ''].join(' ').trim()}">${shortlist}<td><button class="row-link" type="button" data-analyze="${esc(c.id)}" aria-pressed="${dashboardCandidate === c.id}">${esc(c.name)}</button><small>${esc(c.email)}</small></td><td title="${esc(j.title)}">${esc(j.title)}</td><td>${bands(c)}</td><td class="num">${cell(phaseStatus(c, 'resume'))}</td><td class="num">${cell(phaseStatus(c, 'aptitude'))}</td><td class="num">${cell(phaseStatus(c, 'coding'))}</td><td class="num">${cell(phaseStatus(c, 'interview'))}</td><td class="num">${overall}<span class="stacked-review"><span class="tag ${c.phase1.review.length ? 'review' : 'ok'}">${c.phase1.review.length ? 'Confirm' : 'Ready'}</span></span></td><td>${review}</td></tr>`;
  }).join('') || `<tr><td colspan="10"><div class="table-empty"><p><strong>${jobFilter ? 'No candidates for this role yet.' : 'No candidates screened yet.'}</strong> Screened candidates appear here, ranked by overall score.</p><button class="button secondary" type="button" data-goto="candidates">Add a candidate</button></div></td></tr>`;
  document.querySelectorAll('[data-analyze]').forEach(b => b.onclick = () => showDashboardAnalysis(b.dataset.analyze, true));
  document.querySelectorAll('[data-shortlist]').forEach(box => box.onchange = () => {
    const id = box.dataset.shortlist;
    setTicks(sorted.filter(c => c.id === id), () => box.checked);
    updateShortlistBar(sorted);
  });
  updateShortlistBar(sorted);
  if (dashboardCandidate && sorted.some(c => c.id === dashboardCandidate)) showDashboardAnalysis(dashboardCandidate, false);
  else $('analysisPanel').classList.add('hidden');
}

async function showDashboardAnalysis(id, scroll) {
  const changed = dashboardCandidate !== id;
  dashboardCandidate = id;
  document.querySelectorAll('[data-analyze]').forEach(button => {
    const on = button.dataset.analyze === id;
    button.setAttribute('aria-pressed', on);
    button.closest('tr').classList.toggle('selected', on);
  });
  const panel = $('analysisPanel');
  if (changed || panel.classList.contains('hidden')) {
    panel.classList.remove('hidden', 'pulled');
    panel.innerHTML = '<div class="card"><div class="skeleton"><span></span><span></span><span></span></div></div>';
    void panel.offsetWidth; panel.classList.add('pulled');
  }
  try {
    const analysis = await api(`/api/candidates/${encodeURIComponent(id)}/analysis`);
    if (dashboardCandidate !== id) return;
    const candidate = state.candidates.find(c => c.id === id) || {}, job = jobFor(candidate);
    const phases = analysis.phases.map(phase => {
      const pending = phase.score === null, width = pending ? 0 : Math.max(0, Math.min(100, Number(phase.score)));
      return `<div class="phase ph-${esc(phase.key)}" data-state="${pending ? 'pending' : phase.key === 'interview' && analysis.interview_review_status !== 'reviewed' ? 'review' : 'done'}"><h4>${esc(phase.label)}</h4><p class="phase-score figure${pending ? ' pending-word' : ''}">${pending ? 'Pending' : pct(phase.score)}</p><div class="track"><div class="fill" style="width:${width}%"></div></div><p class="contribution"><span class="figure">${pending ? '—' : esc(phase.contribution)}</span> of ${esc(phase.weight)} points</p><p class="meta">${esc(phase.detail)}</p></div>`;
    }).join('');
    const criteria = Object.entries(analysis.resume_criteria).map(([key, item]) => `<tr><th scope="row">${esc(labels[key] || key)}</th><td class="num"><span class="figure">${esc(item.score)}</span><span class="muted">/${esc(item.max)}</span></td><td>${esc(item.reason)}</td></tr>`).join('');
    const reviewed = analysis.interview_review_status === 'reviewed';
    const answers = analysis.interview_answers.map((item, i) => `<li class="answer"><p class="answer-q"><span class="qno">Q${i + 1}</span> ${esc(item.question)}</p><blockquote>${esc(item.answer) || '<span class="muted">No answer given</span>'}</blockquote><div class="rating"><label for="rating-${i}">Rubric rating</label><select id="rating-${i}" data-rating="${i}"><option value="">Choose a rating</option>${analysis.interview_rubric.map((label, rating) => `<option value="${rating}" ${item.rating === rating ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>${item.score === null ? '<span class="tag review">Needs rating</span>' : `<span class="figure">${pct(item.score)}</span>`}</div><p class="help ai-reason hidden" data-reason="${i}"></p></li>`).join('');
    const modePicker = analysis.ai_grading_available ? `<fieldset class="segmented rating-mode"><legend>Rating method</legend><div class="seg"><label><input type="radio" name="ratingMode" value="manual" checked><span>Option 1 · Rate manually</span></label><label><input type="radio" name="ratingMode" value="ai"><span>Option 2 · Rate with AI</span></label></div></fieldset>` : '';
    const interviewBlock = analysis.interview_answers.length ? `<section class="analysis-section"><h4>Interview answers</h4><p class="help measure">${reviewed ? 'Rated by a recruiter.' : 'The interview score stays out of the overall score until you rate every answer.'} Judge relevance, correctness, specificity and evidence; a long answer earns nothing by itself.</p>${modePicker}<ol class="answers">${answers}</ol><div class="commit"><button class="button" id="saveInterviewRatings" type="button">${reviewed ? 'Update ratings' : 'Save ratings and calculate interview score'}</button></div></section>` : '';
    const total = analysis.overall.score === null ? `<p class="total muted">Pending</p>` : `<p class="total figure">${pct(analysis.overall.score)}</p>`;
    panel.innerHTML = `<div class="phase-tabs">${phases}</div><div class="card record-card"><div class="card-head analysis-head"><div><h3>${esc(candidate.name)}</h3><p class="meta">${esc(job.title || 'Role')} · each phase contributes its score × its weight</p></div><div class="analysis-total"><span class="field-label">Overall</span>${total}<a class="button secondary small" href="/api/candidates/${encodeURIComponent(id)}/report.pdf">${icon('download')}<span>PDF report</span></a></div></div>
      ${candidate.phase1 && candidate.phase1.review.length ? `<section class="analysis-section">${resumeConfirmNotice(candidate)}</section>` : ''}
      <section class="analysis-section"><h4>Summary</h4><ol class="summary">${analysis.summary.map(point => `<li>${esc(point)}</li>`).join('')}</ol></section>
      <details class="analysis-section"><summary><h4>Resume criteria and reasons</h4></summary><table class="criteria"><tbody>${criteria}</tbody></table></details>
      ${interviewBlock}
      <p class="help footnote">${analysis.ai_grading_available ? 'AI ratings are suggestions: review and adjust them, then save.' : 'No automatic answer-quality model is configured.'} Interview points count only after a recruiter saves a rating for each answer.</p></div>`;
    bindResumeConfirm(panel, id, renderDashboard);
    let ratingSource = 'manual';
    panel.querySelectorAll('input[name="ratingMode"]').forEach(radio => radio.onchange = async () => {
      const reasons = [...panel.querySelectorAll('[data-reason]')];
      if (radio.value === 'manual') { ratingSource = 'manual'; reasons.forEach(r => r.classList.add('hidden')); return; }
      const picker = panel.querySelector('.rating-mode .seg');
      try {
        picker.setAttribute('aria-busy', 'true');
        message('Asking the AI to rate each answer…');
        const result = await jsonPost(`/api/candidates/${encodeURIComponent(id)}/interview/ai-grade`, {});
        result.ratings.forEach((item, i) => {
          const select = panel.querySelector(`[data-rating="${i}"]`);
          if (select) select.value = String(item.rating);
          if (reasons[i]) { reasons[i].textContent = `AI (${result.model}): ${item.reason}`; reasons[i].classList.remove('hidden'); }
        });
        ratingSource = 'ai';
        message('AI ratings filled in. Review them, adjust if needed, then save.');
      } catch (error) {
        message(error.message, 'error');
        panel.querySelector('input[name="ratingMode"][value="manual"]').checked = true;
      } finally { picker.removeAttribute('aria-busy'); }
    });
    const saveRatings = panel.querySelector('#saveInterviewRatings');
    if (saveRatings) saveRatings.onclick = async () => {
      const selects = [...panel.querySelectorAll('[data-rating]')];
      const missing = selects.find(select => select.value === '');
      if (missing) { message('Rate every interview answer from 0 to 4 before saving.', 'error'); missing.focus(); return; }
      try {
        saveRatings.disabled = true; saveRatings.textContent = 'Saving…';
        await jsonPost(`/api/candidates/${encodeURIComponent(id)}/interview/review`, {ratings: selects.map(select => Number(select.value)), source: ratingSource});
        state = await api('/api/state');
        renderDashboard();
        message('Ratings saved. The overall score has been recalculated.');
      } catch (error) { message(error.message, 'error'); saveRatings.disabled = false; }
    };
    if (scroll) panel.scrollIntoView({behavior: 'smooth', block: 'start'});
  } catch (error) {
    if (dashboardCandidate === id) panel.innerHTML = `<div class="card"><p class="notice error">${icon('alert')}<span>${esc(error.message)}</span></p></div>`;
  }
}
$('resetAll').onclick = async () => {
  const typed = prompt(`This deletes all ${state.jobs.length} roles and ${state.candidates.length} candidates, with every test result, interview answer and rating. Sample roles, example resumes and question banks stay.\n\nA backup copy is saved first. Type RESET to continue.`);
  if (typed === null) return;
  if (typed.trim() !== 'RESET') { message('Reset cancelled. Type RESET exactly to confirm.', 'error'); return; }
  try {
    await jsonPost('/api/reset', {confirm: 'RESET'});
    [cameraStream, faceStream, microphoneStream].forEach(stream => stream && stream.getTracks().forEach(track => track.stop()));
    location.reload();
  } catch (e) { message(e.message, 'error'); }
};
$('dashboardJob').onchange = renderDashboard;
$('refreshBtn').onclick = async () => { try { await refresh(); message('Dashboard refreshed.'); } catch (e) { message(e.message, 'error'); } };

/* ---------- 3 · assessment ---------- */
function renderAssessment() {
  const id = $('assessmentCandidate').value || activeCandidate;
  const c = state.candidates.find(x => x.id === id);
  if (!c) {
    $('record').classList.add('hidden');
    $('assessEmpty').classList.remove('hidden');
    $('assessEmpty').innerHTML = state.candidates.length
      ? '<p><strong>Choose a candidate above</strong> to open their record and run the assessment stages.</p>'
      : '<p><strong>No candidates yet.</strong> Screen a resume first; the assessment opens on the same record.</p><button class="button secondary" type="button" data-goto="candidates">Add a candidate</button>';
    return;
  }
  if (activeCandidate !== c.id) activeTab = 'resume';
  activeCandidate = c.id;
  $('assessEmpty').classList.add('hidden');
  $('record').classList.remove('hidden');
  const stage = c.stages || {}, job = jobFor(c);

  $('stageTabs').innerHTML = STAGES.map(s => {
    const st = phaseStatus(c, s.key), on = s.key === activeTab;
    return `<button type="button" role="tab" id="tab-${s.key}" class="tab ph-${s.key}" data-tab="${s.key}" data-state="${st.state}" aria-selected="${on}" aria-controls="panel-${s.key}" tabindex="${on ? 0 : -1}"><span class="tab-name">${s.label}</span><span class="tab-state">${st.state === 'done' ? icon('check') : ''}${/\d/.test(st.text) ? `<span class="figure">${esc(st.text)}</span>` : esc(st.text)}</span></button>`;
  }).join('');
  $('stageTabs').querySelectorAll('[role=tab]').forEach(tab => tab.onclick = () => selectTab(tab.dataset.tab));
  showTab();

  $('recordHead').innerHTML = `<div><h3>${esc(c.name)}</h3><p class="meta">${esc(job.title || 'Role')}${c.email ? ` · ${esc(c.email)}` : ''}</p></div><div class="record-figures"><div><span class="field-label">Resume match</span><span class="figure big">${pct(c.phase1.score)}</span></div><div><span class="field-label">Overall</span>${c.overall.score === null ? '<span class="figure big muted pending-word">Pending</span>' : `<span class="figure big">${pct(c.overall.score)}</span>`}</div><a class="button secondary small" href="/api/candidates/${encodeURIComponent(c.id)}/report.pdf">${icon('download')}<span>Report</span></a></div>`;

  // Resume
  const rows = Object.entries(c.phase1.breakdown).map(([key, v]) => {
    const evidence = Object.entries(v.evidence || {}).map(([term, snippet]) => `<li><b>${esc(term)}</b> ${esc(snippetText(snippet))}</li>`).join('');
    const w = v.max ? Math.round(100 * v.score / v.max) : 0;
    return `<tr><th scope="row">${esc(labels[key])}</th><td class="num"><span class="figure">${v.score}</span><span class="muted">/${v.max}</span><div class="track mini ph-resume"><div class="fill" style="width:${w}%"></div></div></td><td>${esc(v.reason)}${evidence ? `<ul class="evidence">${evidence}</ul>` : ''}</td></tr>`;
  }).join('');
  const notes = resumeConfirmNotice(c);
  $('assessmentDetail').innerHTML = `${notes}<table class="criteria"><thead><tr><th scope="col">Criterion</th><th scope="col" class="num">Points</th><th scope="col">Reason and evidence</th></tr></thead><tbody>${rows}</tbody></table><div class="commit"><button class="button secondary" type="button" data-next="${stage.aptitude ? 'interview' : 'aptitude'}">Continue to ${stage.aptitude ? 'interview' : 'aptitude'} ${icon('arrow')}</button></div>`;
  $('assessmentDetail').querySelector('[data-next]').onclick = e => selectTab(e.currentTarget.dataset.next);
  bindResumeConfirm($('assessmentDetail'), c.id, renderAssessment);

  // Identity
  const check = c.face_check || {};
  setFaceStatus(check.status);
  $('faceScore').textContent = check.match_score != null ? `Match score ${check.match_score}% · cosine similarity, not identity probability` : '';
  if (check.box) drawFaceBox(check.box);

  // Aptitude
  const aptLive = aptitudeQuestions && aptitudeCandidate === c.id;
  $('aptitudeLive').classList.toggle('hidden', !aptLive);
  $('aptitudeIntro').classList.toggle('hidden', aptLive);
  if (!aptLive) $('aptitudeIntro').innerHTML = stage.aptitude
    ? stageDone(`${stage.aptitude.correct} of ${stage.aptitude.total} correct`, `${pct(stage.aptitude.score)} · ${esc(stage.aptitude.difficulty || 'mixed')} difficulty`)
    : stageIntro('Aptitude test', `12 questions in 15 minutes at ${LEVELS[(job.difficulty?.aptitude || 2) - 1].toLowerCase()} level. The timer starts when you press start, and unanswered questions count as incorrect.`, 'startAptitude', 'Start aptitude test');

  // Coding
  const codeLive = codingCandidate === c.id && !stage.coding;
  $('codingLive').classList.toggle('hidden', !codeLive);
  $('codingIntro').classList.toggle('hidden', codeLive);
  if (!codeLive) $('codingIntro').innerHTML = stage.coding
    ? stageDone(`${stage.coding.passed} of ${stage.coding.total} test cases passed`, `${pct(stage.coding.score)} · ${esc(stage.coding.problem)}`)
    : stageIntro('Coding challenge', 'One Python problem, checked against hidden test cases on this computer.', 'startCoding', 'Open coding challenge');

  // Interview
  const intLive = interviewCandidate === c.id && !stage.interview;
  $('interviewLive').classList.toggle('hidden', !intLive);
  $('interviewIntro').classList.toggle('hidden', intLive);
  if (!intLive) $('interviewIntro').innerHTML = stage.interview
    ? stageDone(`${stage.interview.answers.length} answers recorded`,
        stage.interview.review_status === 'reviewed' ? 'Your interview has been reviewed by the recruiter.' : 'Submitted. Waiting for the recruiter to review your answers.',
        stage.interview.review_status === 'reviewed' ? '<span class="tag ok">Successfully reviewed</span>' : '<span class="tag review">Needs to be reviewed</span>')
    : stageIntro('Structured interview', 'Questions can be played aloud with a local Windows voice. The candidate types an answer or records it for local transcription. Answers are scored only by your rubric rating.', 'startInterview', 'Start interview');

  if ($('startAptitude')) $('startAptitude').onclick = startAptitude;
  if ($('startCoding')) $('startCoding').onclick = startCoding;
  if ($('startInterview')) $('startInterview').onclick = startInterview;
}
const stageIntro = (title, text, id, action) => `<div class="stage-intro"><h3>${title}</h3><p class="measure">${text}</p><div class="commit"><button class="button" type="button" id="${id}">${action}</button></div></div>`;
const stageDone = (headline, detail, extra = '') => `<div class="stage-done"><span class="done-mark">${icon('check')}</span><div><h3>${headline}</h3><p class="meta">${detail}</p></div>${extra}</div>`;

function selectTab(key) {
  activeTab = key;
  $('stageTabs').querySelectorAll('[role=tab]').forEach(tab => {
    const on = tab.dataset.tab === key;
    tab.setAttribute('aria-selected', on);
    tab.tabIndex = on ? 0 : -1;
  });
  showTab();
}
function showTab() {
  STAGES.forEach(s => { $('panel-' + s.key).hidden = s.key !== activeTab; });
}
$('stageTabs').addEventListener('keydown', event => {
  const keys = STAGES.map(s => s.key), i = keys.indexOf(activeTab);
  const next = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: keys.length - 1}[event.key];
  if (next === undefined) return;
  event.preventDefault();
  selectTab(keys[(next + keys.length) % keys.length]);
  $('tab-' + activeTab).focus();
});
$('assessmentCandidate').onchange = () => { activeCandidate = $('assessmentCandidate').value; renderAssessment(); };

/* identity */
const FACE_TEXT = {
  match: ['done', 'Match · the camera face and reference passed the local comparison.'],
  no_match: ['flag', 'No match · the camera face differs from the reference.'],
  inconclusive: ['review', 'Inconclusive · capture again with visible side-to-side motion.'],
};
function setFaceStatus(status, text) {
  const [st, words] = FACE_TEXT[status] || ['pending', 'No check completed.'];
  $('faceStatus').dataset.state = st;
  $('faceStatus').textContent = text || words;
}
$('faceEnroll').onclick = async () => {
  if (!activeCandidate) return;
  const photo = $('facePhoto').files[0];
  if (!photo || !$('faceConsent').checked) { message('Choose a reference photo and confirm candidate consent.', 'error'); return; }
  const form = new FormData(); form.append('photo', photo); form.append('consent', 'true');
  try {
    await api(`/api/candidates/${activeCandidate}/face/enroll`, {method: 'POST', body: form});
    setFaceStatus(null, 'Reference ready for this session. Start the camera to check the candidate.');
    $('faceVerify').disabled = !faceStream;
    message('Reference face prepared in memory.');
  } catch (e) { message(e.message, 'error'); }
};
function drawFaceBox(box) {
  const overlay = $('faceBox');
  overlay.style.left = `${box.x * 100}%`; overlay.style.top = `${box.y * 100}%`;
  overlay.style.width = `${box.width * 100}%`; overlay.style.height = `${box.height * 100}%`;
  overlay.classList.remove('hidden');
}
async function previewFace() {
  if (!faceStream || facePreviewBusy || !activeCandidate) return;
  facePreviewBusy = true;
  try {
    const frame = await faceFrame(), form = new FormData();
    form.append('frame', frame, 'preview.jpg');
    const result = await api(`/api/candidates/${activeCandidate}/face/preview`, {method: 'POST', body: form});
    drawFaceBox(result.box);
    if (result.match_score != null) $('faceScore').textContent = `Live match score ${result.match_score}% · cosine similarity, not identity probability`;
  } catch (e) { $('faceBox').classList.add('hidden'); }
  finally { facePreviewBusy = false; }
}
function stopFaceCamera() {
  clearInterval(facePreviewTimer);
  if (faceStream) faceStream.getTracks().forEach(t => t.stop());
  faceStream = null;
  $('faceVideo').srcObject = null; $('faceVideo').classList.add('hidden'); $('faceBox').classList.add('hidden');
  $('faceCamera').querySelector('span').textContent = 'Start camera';
  $('faceVerify').disabled = true;
}
$('faceCamera').onclick = async () => {
  try {
    if (faceStream) { stopFaceCamera(); return; }
    if (!$('faceConsent').checked) { message('Confirm candidate consent and add a reference photo first.', 'error'); return; }
    faceStream = await navigator.mediaDevices.getUserMedia({video: {width: {ideal: 640}, height: {ideal: 480}}});
    $('faceVideo').srcObject = faceStream; $('faceVideo').classList.remove('hidden');
    $('faceCamera').querySelector('span').textContent = 'Stop camera';
    $('faceVerify').disabled = false;
    facePreviewTimer = setInterval(previewFace, 1500);
  } catch (e) { message('Camera unavailable: ' + e.message, 'error'); }
};
function faceFrame() {
  return new Promise((resolve, reject) => {
    const video = $('faceVideo'), canvas = document.createElement('canvas');
    if (!video.videoWidth) return reject(Error('Wait for the camera image to appear.'));
    canvas.width = Math.min(video.videoWidth, 640);
    canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('Could not capture the camera frame.')), 'image/jpeg', 0.83);
  });
}
$('faceVerify').onclick = async () => {
  if (!faceStream || !activeCandidate) return;
  const id = activeCandidate;
  $('faceVerify').disabled = true;
  try {
    const form = new FormData();
    for (let i = 0; i < 3; i++) {
      if (i) { setFaceStatus(null, i === 1 ? 'Turn gently to one side…' : 'Now gently to the other side…'); await new Promise(resolve => setTimeout(resolve, 1200)); }
      form.append('frames', await faceFrame(), `frame-${i}.jpg`);
    }
    setFaceStatus(null, 'Comparing on this computer…');
    const result = await api(`/api/candidates/${id}/face/verify`, {method: 'POST', body: form});
    drawFaceBox(result.box);
    $('faceScore').textContent = `Match score ${result.match_score}% · cosine similarity, not identity probability`;
    setFaceStatus(result.status);
    await refresh();
  } catch (e) { setFaceStatus('inconclusive', 'Inconclusive · ' + e.message); message(e.message, 'error'); }
  finally { $('faceVerify').disabled = !faceStream; }
};

/* aptitude */
async function startAptitude() {
  try {
    const data = await jsonPost(`/api/candidates/${activeCandidate}/aptitude/start`, {});
    aptitudeQuestions = data.questions; aptitudeCandidate = activeCandidate;
    $('aptitudeTitle').textContent = `Aptitude test · ${data.difficulty}`;
    $('aptitudeQuestions').innerHTML = data.questions.map((q, i) => `<fieldset class="question"><legend><span class="figure">${i + 1}</span>${esc(q.question)}</legend><div class="options">${q.options.map(option => `<label class="option"><input type="radio" name="q_${esc(q.id)}" value="${esc(option)}"><span>${esc(option)}</span></label>`).join('')}</div></fieldset>`).join('');
    $('aptitudeQuestions').onchange = updateAnswered;
    aptitudeDeadline = Date.now() + data.time_limit_minutes * 60000;
    clearInterval(aptitudeTimer);
    const tick = () => {
      const left = Math.max(0, Math.ceil((aptitudeDeadline - Date.now()) / 1000));
      $('aptitudeTimer').innerHTML = `${icon('clock')}<span class="figure">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span><span class="answered" id="answered"></span>`;
      $('aptitudeTimer').dataset.low = left <= 60;
      updateAnswered();
      if (!left) { clearInterval(aptitudeTimer); submitAptitude(); }
    };
    tick(); aptitudeTimer = setInterval(tick, 1000);
    renderAssessment(); selectTab('aptitude');
  } catch (e) { message(e.message, 'error'); }
}
function updateAnswered() {
  if (!aptitudeQuestions || !$('answered')) return;
  const n = aptitudeQuestions.filter(q => document.querySelector(`input[name="q_${q.id}"]:checked`)).length;
  $('answered').innerHTML = `<span class="figure">${n}/${aptitudeQuestions.length}</span> answered`;
}
async function submitAptitude() {
  if (!aptitudeQuestions) return;
  const answers = {};
  for (const q of aptitudeQuestions) {
    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if (selected) answers[q.id] = selected.value;
  }
  try {
    $('aptitudeSubmit').disabled = true;
    const c = await jsonPost(`/api/candidates/${aptitudeCandidate}/aptitude/submit`, {answers});
    aptitudeQuestions = null; aptitudeCandidate = null; clearInterval(aptitudeTimer);
    message(`Aptitude submitted: ${pct(c.stages.aptitude.score)}.`);
    await refresh();
  } catch (e) { message(e.message, 'error'); }
  finally { $('aptitudeSubmit').disabled = false; }
}
$('aptitudeSubmit').onclick = submitAptitude;

/* coding */
async function startCoding() {
  try {
    const p = await api(`/api/candidates/${activeCandidate}/coding/problem`);
    codingCandidate = activeCandidate;
    $('problemTitle').textContent = `${p.title} · ${p.difficulty}`;
    $('problemDescription').innerHTML = `<p>${esc(p.description).replace(/\n/g, '<br>')}</p><h4>Examples</h4>${p.examples.map(e => `<pre>Input:  ${esc(e.input)}\nOutput: ${esc(e.output)}</pre>`).join('')}`;
    $('codeInput').value = p.starter_code_python;
    renderAssessment(); selectTab('coding');
  } catch (e) { message(e.message, 'error'); }
}
$('codeInput').addEventListener('keydown', event => {
  if (event.key !== 'Tab' || event.shiftKey) return;
  event.preventDefault();
  const el = event.target, start = el.selectionStart;
  el.setRangeText('    ', start, el.selectionEnd, 'end');
});
$('codingSubmit').onclick = async () => {
  if (!confirm('Run this Python code on this computer? Only submit code you trust.')) return;
  const button = $('codingSubmit');
  try {
    button.disabled = true; button.textContent = 'Running test cases…';
    const c = await jsonPost(`/api/candidates/${codingCandidate}/coding/submit`, {source_code: $('codeInput').value});
    message(`Coding submitted: ${c.stages.coding.passed}/${c.stages.coding.total} test cases passed.`);
    codingCandidate = null;
    await refresh();
  } catch (e) { message(e.message, 'error'); }
  finally { button.disabled = false; button.textContent = 'Run test cases and submit'; }
};

/* interview */
async function startInterview() {
  try {
    const data = await jsonPost(`/api/candidates/${activeCandidate}/interview/start`, {});
    interviewCandidate = activeCandidate;
    showInterviewQuestion(data);
    renderAssessment(); selectTab('interview');
  } catch (e) { message(e.message, 'error'); }
}
function stopQuestionAudio() {
  if (questionAudio) { questionAudio.pause(); URL.revokeObjectURL(questionAudio.src); questionAudio = null; }
  $('interviewerAvatar').classList.remove('speaking');
}
function showInterviewQuestion(data) {
  stopQuestionAudio();
  $('interviewProgress').innerHTML = `Question <span class="figure">${data.position}</span> of <span class="figure">${data.total}</span>`;
  $('interviewQuestion').textContent = data.question;
  $('interviewAnswer').value = '';
}
function stopInterviewCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  cameraStream = null;
  $('interviewVideo').srcObject = null; $('interviewVideo').classList.add('hidden');
  $('cameraToggle').querySelector('span').textContent = 'Turn camera on';
}
$('speakQuestion').onclick = async () => {
  if (!interviewCandidate) return;
  try {
    stopQuestionAudio();
    const response = await fetch(`/api/candidates/${interviewCandidate}/interview/question.wav`);
    if (!response.ok) { const body = await response.json(); throw Error(body.error || 'Speech unavailable'); }
    const url = URL.createObjectURL(await response.blob());
    questionAudio = new Audio(url);
    questionAudio.onended = stopQuestionAudio;
    $('interviewerAvatar').classList.add('speaking');
    await questionAudio.play();
  } catch (e) { stopQuestionAudio(); message(e.message, 'error'); }
};
$('cameraToggle').onclick = async () => {
  try {
    if (cameraStream) { stopInterviewCamera(); return; }
    cameraStream = await navigator.mediaDevices.getUserMedia({video: true});
    $('interviewVideo').srcObject = cameraStream; $('interviewVideo').classList.remove('hidden');
    $('cameraToggle').querySelector('span').textContent = 'Turn camera off';
  } catch (e) { message('Camera unavailable: ' + e.message, 'error'); }
};
$('recordToggle').onclick = async () => {
  const label = $('recordToggle').querySelector('span');
  try {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      $('recordToggle').disabled = true;
      $('recordStatus').textContent = 'Transcribing on this computer…';
      $('recordToggle').classList.remove('recording');
      return;
    }
    microphoneStream = await navigator.mediaDevices.getUserMedia({audio: true});
    audioChunks = [];
    recorder = new MediaRecorder(microphoneStream);
    recorder.ondataavailable = e => { if (e.data.size) audioChunks.push(e.data); };
    recorder.onstop = async () => {
      microphoneStream.getTracks().forEach(t => t.stop());
      try {
        const form = new FormData();
        form.append('audio', new Blob(audioChunks, {type: recorder.mimeType || 'audio/webm'}), 'answer.webm');
        const response = await fetch('/api/transcribe', {method: 'POST', body: form});
        const result = await response.json();
        if (!response.ok) throw Error(result.error || 'Transcription failed');
        $('interviewAnswer').value = [$('interviewAnswer').value, result.text].filter(Boolean).join(' ').trim();
        $('recordStatus').textContent = result.text ? 'Transcript added. Read it through before submitting.' : 'No speech detected. Type the answer instead.';
      } catch (e) { message(e.message, 'error'); $('recordStatus').textContent = ''; }
      finally { $('recordToggle').disabled = false; label.textContent = 'Record answer'; }
    };
    recorder.start();
    label.textContent = 'Stop recording';
    $('recordToggle').classList.add('recording');
    $('recordStatus').textContent = 'Recording…';
  } catch (e) { message('Microphone unavailable: ' + e.message, 'error'); }
};
$('interviewNext').onclick = async () => {
  if (recorder && recorder.state === 'recording') { message('Stop recording and review the transcript before submitting.', 'error'); return; }
  const button = $('interviewNext');
  try {
    button.disabled = true;
    const result = await jsonPost(`/api/candidates/${interviewCandidate}/interview/answer`, {answer: $('interviewAnswer').value});
    if (result.done) {
      stopQuestionAudio(); stopInterviewCamera();
      interviewCandidate = null;
      message('Interview submitted. The recruiter will review your answers.');
      await refresh();
    } else showInterviewQuestion(result);
  } catch (e) { message(e.message, 'error'); }
  finally { button.disabled = false; }
};

/* ---------- boot ---------- */
async function boot() {
  renderDifficultyFields();
  try {
    await refresh();
    renderWeightFields();
  } catch (e) { message('Could not start the local app: ' + e.message, 'error'); }
}
boot();

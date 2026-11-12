export const meta = {
  name: 'sibling-change',
  description: 'Code change in one sibling repo: version-control prep, develop <-> review loop, docs, commit/push/PR. Or sync local main after merge.',
  whenToUse: 'Only after the change is agreed, grilled and specified by the user (see CLAUDE.md, Sibling change workflow). args.mode "change" (default) or "sync".',
  phases: [
    { title: 'Prepare', detail: 'version-control agent: clean main, new branch' },
    { title: 'Develop', detail: 'development agent (ponytail) <-> review agent, max 3 rounds' },
    { title: 'Docs', detail: 'documentation agent <-> review agent, max 2 rounds' },
    { title: 'Finalize', detail: 'version-control agent: commit, push, PR' },
    { title: 'Sync', detail: 'version-control agent: local main matches origin after merge' },
  ],
}

// args: {
//   mode: 'change' | 'sync'                       (default 'change')
//   repo: 'netsuite-subscrption-cr-scripts'       (sibling repo directory name)
//   repoPath: absolute path of that repo
//   managerPath: absolute path of netsuite-manager (read-only reference, default below)
//   branch: new branch name (change mode)
//   title: short PR title
//   spec: the user's agreed specification, verbatim (acceptance criteria included)
//   isSuiteScript: true when the change touches SuiteScript files
//   tune: optional per-role overrides, e.g. { dev: {model, effort}, review: {...}, docs: {...}, vcs: {...} }
//         Omit to inherit. The orchestrator chooses case by case; nothing is hard-coded here.
//   since: sync mode only, sha of local main before the merge (optional)
// }

const a = args || {}
const MANAGER = a.managerPath || 'C:\\Users\\Riku\\Documents\\GitHub\\netsuite-manager'
const tune = role => (a.tune && a.tune[role]) || {}

const SCOPE =
  `You may change files ONLY inside ${a.repoPath}. Never touch any other repository, including ${MANAGER}, ` +
  `which you may read for reference but not modify. Do not merge anything and never push to the default branch.`

const VCS_PREP_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    reason: { type: 'string' },
    defaultBranch: { type: 'string' },
    baseSha: { type: 'string' },
    branch: { type: 'string' },
    otherLocalBranches: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['ok', 'reason'],
}

const DEV_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    testsRun: { type: 'string' },
    skillsUsed: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'filesChanged', 'testsRun', 'skillsUsed'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          criterion: { type: 'string' },
          met: { type: 'boolean' },
          evidence: { type: 'string' },
        },
        required: ['criterion', 'met', 'evidence'],
      },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'note'] },
          file: { type: 'string' },
          line: { type: 'number' },
          issue: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'issue', 'evidence'],
      },
    },
    testsPassed: { type: 'boolean' },
    testsOutput: { type: 'string' },
    skillsUsed: { type: 'array', items: { type: 'string' } },
  },
  required: ['criteria', 'findings', 'testsPassed', 'skillsUsed'],
}

const DOCS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    staleCandidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['file', 'reason'],
      },
    },
  },
  required: ['summary', 'filesChanged', 'staleCandidates'],
}

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    reason: { type: 'string' },
    commitSha: { type: 'string' },
    prUrl: { type: 'string' },
    filesInPr: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'reason'],
}

const SYNC_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    reason: { type: 'string' },
    branch: { type: 'string' },
    headSha: { type: 'string' },
    headSubject: { type: 'string' },
    matchesOrigin: { type: 'boolean' },
    filesChangedSince: { type: 'array', items: { type: 'string' } },
    leftoverLocalBranches: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'reason'],
}

const SKILL_HINT = a.isSuiteScript
  ? 'This change touches SuiteScript. Use the netsuite-suitecloud plugin skills for NetSuite specifics: governance and usage units ' +
    '(SAFE Guide), N/ module behaviour, SuiteScript 2.x/2.1 rules, SDF object rules and OWASP-style checks. ' +
    'Pay special attention to anything uncatchable in a try/catch (SSS_USAGE_LIMIT_EXCEEDED), non-atomic read-then-write sequences, and idempotency of reruns. ' +
    'In skillsUsed list the skills you actually loaded; if a named skill is not available to you, say so in your result instead of proceeding silently.'
  : 'This change does not touch SuiteScript; skip the NetSuite-specific skills unless a file turns out to need them.'

const RULES =
  `Read ${MANAGER}\\docs\\sisarrepot.md (sections for ${a.repo}: what the repo does, how to run its tests, shared records) and the repo's own CLAUDE.md before starting. ` +
  'Statements about NetSuite behaviour must be marked as verified or inferred; do not invent field ids or record behaviour.'

async function reviewLoop(label, maxRounds, firstWork, fixWork, review) {
  const rounds = []
  let work = null
  let findings = []
  for (let r = 1; r <= maxRounds; r++) {
    work = await (r === 1 ? firstWork() : fixWork(findings))
    if (!work) return { approved: false, rounds, reason: `${label}: agent returned nothing in round ${r}` }
    const rev = await review(r)
    if (!rev) return { approved: false, rounds, reason: `${label}: reviewer returned nothing in round ${r}` }
    const blocking = (rev.findings || []).filter(f => f.severity !== 'note')
    const unmet = (rev.criteria || []).filter(c => !c.met)
    rounds.push({ round: r, work, review: rev, blocking: blocking.length, unmet: unmet.length })
    log(`${label} round ${r}: ${blocking.length} finding(s), ${unmet.length} unmet criteria, tests ${rev.testsPassed ? 'pass' : 'FAIL'}`)
    if (!blocking.length && !unmet.length && rev.testsPassed) return { approved: true, rounds }
    findings = blocking.concat(unmet.map(c => ({ severity: 'major', issue: `Acceptance criterion not met: ${c.criterion}`, evidence: c.evidence })))
    if (!rev.testsPassed) findings.push({ severity: 'blocker', issue: 'Tests do not pass', evidence: rev.testsOutput || '' })
  }
  return { approved: false, rounds, reason: `${label}: not approved after ${maxRounds} rounds` }
}

if ((a.mode || 'change') === 'sync') {
  phase('Sync')
  const sync = await agent(
    `You are the version-control agent for ${a.repo} at ${a.repoPath}. The user has merged a pull request. Bring the LOCAL repo to the state the user will upload to the File Cabinet from. ` +
    `${SCOPE}\n` +
    'Steps: git fetch; checkout the default branch; git pull --ff-only; verify HEAD equals origin/<default>. ' +
    'If the working tree is dirty or the pull cannot fast-forward, do NOT stash, reset or discard anything: stop and report. ' +
    'Delete a local feature branch only if it is fully merged (git branch -d, never -D). ' +
    (a.since ? `List the files changed since ${a.since} (git diff --name-only ${a.since}..HEAD) so the user knows which files to upload. ` : '') +
    'Report the current branch, HEAD sha and subject, whether it matches origin, and any other local branches left over.',
    { phase: 'Sync', label: 'vcs: sync main', schema: SYNC_SCHEMA, ...tune('vcs') },
  )
  return { mode: 'sync', sync }
}

// ---------- change mode ----------
phase('Prepare')
const prep = await agent(
  `You are the version-control agent for ${a.repo} at ${a.repoPath}. Prepare the repo for a new change. ${SCOPE}\n` +
  'Check: working tree clean; on the default branch; git fetch done; local default branch equals origin (fast-forward if only behind). ' +
  'List any other local branches and any branch with unpushed commits. If the tree is dirty, the branch is not the default, or the history diverged, ' +
  'do NOT stash, reset or discard anything: return ok=false with the reason. ' +
  `Otherwise create and check out the branch "${a.branch}" from the default branch and return its base sha.`,
  { phase: 'Prepare', label: 'vcs: prepare', schema: VCS_PREP_SCHEMA, ...tune('vcs') },
)
if (!prep || !prep.ok) return { status: 'blocked-at-prepare', prep }

const diffCmd = `git -C "${a.repoPath}" diff ${prep.baseSha}`

phase('Develop')
const dev = await reviewLoop(
  'develop', 3,
  () => agent(
    `You are the development agent. Implement the agreed change in ${a.repoPath} on branch ${prep.branch}. ${SCOPE}\n${RULES}\n` +
    'Use the ponytail skill: the smallest correct change, no speculative abstractions, and a test for every piece of risky logic. ' +
    `${SKILL_HINT}\n` +
    'Do not commit and do not touch documentation (a documentation agent does that later). Run the repo\'s tests and report what you ran.\n\n' +
    `SPECIFICATION (the user's words, authoritative):\n${a.spec}`,
    { phase: 'Develop', label: 'dev: implement', schema: DEV_SCHEMA, ...tune('dev') },
  ),
  findings => agent(
    `You are the development agent, round 2 or later. Fix ONLY the review findings below in ${a.repoPath} (branch ${prep.branch}); do not widen scope or refactor. ` +
    `${SCOPE}\n${RULES}\nUse the ponytail skill. ${SKILL_HINT}\nRe-run the repo's tests. Do not commit.\n\n` +
    `FINDINGS:\n${JSON.stringify(findings, null, 2)}\n\nSPECIFICATION:\n${a.spec}`,
    { phase: 'Develop', label: 'dev: fix', schema: DEV_SCHEMA, ...tune('dev') },
  ),
  round => agent(
    `You are the review agent, round ${round}. You are independent: you have NOT seen the developer's own account and must not rely on it. ` +
    `Review the changes in ${a.repoPath} against the specification. Get the change yourself with: ${diffCmd}\n` +
    `READ-ONLY: change no files. ${RULES}\n${SKILL_HINT}\n` +
    'Run the repo\'s tests yourself and report their result. For EACH acceptance criterion in the specification, state met or not met with concrete evidence (file:line or test output). ' +
    'Then list findings: severity blocker (wrong behaviour, crash, data loss, double processing), major (spec deviation, missing test for risky logic, NetSuite-specific failure such as governance or uncatchable errors), ' +
    'minor, note. Look specifically for bugs the tests would not catch. Do not pad: an empty findings list is the correct answer when the work is right. ' +
    'Also flag scope creep (changes the specification did not ask for).\n\n' +
    `SPECIFICATION:\n${a.spec}`,
    { phase: 'Develop', label: `review r${round}`, schema: REVIEW_SCHEMA, ...tune('review') },
  ),
)
if (!dev.approved) return { status: 'needs-user-after-develop', prep, develop: dev }

phase('Docs')
const docs = await reviewLoop(
  'docs', 2,
  () => agent(
    `You are the documentation agent. The code change in ${a.repoPath} (branch ${prep.branch}) is approved. Bring this repo's documentation up to date with it. ${SCOPE}\n${RULES}\n` +
    `Get the change with: ${diffCmd}\n` +
    'Update only documentation affected by the change (README, CLAUDE.md, CHANGELOG, docs/). Keep it concise and factual; write from the diff, and mark anything not verified in NetSuite as such. ' +
    `Policy: this repo must hold no outdated documentation and no ADRs that do not exist in ${MANAGER}\\docs\\adr. Compare the repo's docs and ADRs against ${MANAGER}. ` +
    'Do NOT delete or move any pre-existing document yourself: list each stale or foreign document in staleCandidates with the reason, and the user decides. Do not commit.\n\n' +
    `SPECIFICATION:\n${a.spec}`,
    { phase: 'Docs', label: 'docs: update', schema: DOCS_SCHEMA, ...tune('docs') },
  ),
  findings => agent(
    `You are the documentation agent, fix round. Fix ONLY these review findings in the documentation of ${a.repoPath}. ${SCOPE}\nDo not commit.\n\n` +
    `FINDINGS:\n${JSON.stringify(findings, null, 2)}`,
    { phase: 'Docs', label: 'docs: fix', schema: DOCS_SCHEMA, ...tune('docs') },
  ),
  round => agent(
    `You are the review agent for documentation, round ${round}. Get the full change with: ${diffCmd}\nREAD-ONLY. ` +
    'Check that every documentation statement matches the code in the diff (file names, constants, behaviour, statuses), that nothing the change made false is left behind, ' +
    'and that no unverified NetSuite claim is stated as fact. Run the tests once to confirm code and docs still go together. ' +
    'Criteria: (1) docs match the code, (2) no stale statement remains in files the change touches, (3) the specification\'s documentation requirements are met. ' +
    'An empty findings list is correct when the docs are right.\n\n' +
    `SPECIFICATION:\n${a.spec}`,
    { phase: 'Docs', label: `docs review r${round}`, schema: REVIEW_SCHEMA, ...tune('review') },
  ),
)
if (!docs.approved) return { status: 'needs-user-after-docs', prep, develop: dev, docs }

phase('Finalize')
const fin = await agent(
  `You are the version-control agent for ${a.repo} at ${a.repoPath}. Commit the approved work on branch ${prep.branch}, push it, and open a pull request for the user. ${SCOPE}\n` +
  'Stage only the files the change touched (no git add -A of unrelated files; mention any unexpected untracked file instead). ' +
  `One clear commit message in the repo's existing style (see git log). Push with upstream. Open the PR with gh: title "${a.title || prep.branch}", ` +
  'a body that states what changed and why, the acceptance criteria and how they were checked, and the tests run. Do NOT merge and do NOT push to the default branch. Return the PR url and the list of files in the PR.\n\n' +
  `SPECIFICATION:\n${a.spec}\n\nDEVELOP ROUNDS: ${dev.rounds.length}, DOCS ROUNDS: ${docs.rounds.length}`,
  { phase: 'Finalize', label: 'vcs: commit + PR', schema: FINAL_SCHEMA, ...tune('vcs') },
)

return {
  status: fin && fin.ok ? 'pr-open' : 'blocked-at-finalize',
  prep,
  pr: fin,
  develop: dev.rounds.map(r => ({
    round: r.round,
    devSummary: r.work.summary,
    filesChanged: r.work.filesChanged,
    skillsUsed: { dev: r.work.skillsUsed, review: r.review.skillsUsed },
    findings: r.review.findings,
    unmetCriteria: r.review.criteria.filter(c => !c.met),
    testsPassed: r.review.testsPassed,
  })),
  docs: docs.rounds.map(r => ({ round: r.round, summary: r.work.summary, filesChanged: r.work.filesChanged, findings: r.review.findings })),
  staleCandidates: docs.rounds.length ? docs.rounds[0].work.staleCandidates : [],
}

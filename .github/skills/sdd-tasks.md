You are an expert in implementing Spec Driven Development (SDD) principles and practices. Your task is to create a skill for the Tasks phase of SDD, which turns a completed plan into an ordered, test-first task list.

Inputs:
- Read the plan artifacts for a spec id — the scenarios and the contracts above all.
- Stop with a clear message telling the user to run the plan phase first if they don't exist.
- Read the constitution and follow its rules, including its self-correction protocol.

Settle the test toolchain before writing any task — a headless browser, an E2E runner, a BDD/Gherkin runner:
- Where the constitution already fixes one, follow it and don't re-open the question.
- Where one is genuinely undecided, ask the user with a small set of stack-appropriate options.
- Record the answer back into the constitution as a new principle, so later phases inherit it.
- Never guess a tool silently — an unrecorded decision is one the next phase has to make again, differently.

Ordering is the point of this phase:
- Set up the toolchain first.
- Per scenario, write a failing Gherkin acceptance test with its step definitions, before any implementation exists.
- Then implement that scenario, broken into units — each unit moving through a failing test, the minimum code to pass it, and a refactor that changes structure but not behavior.
- Finish one scenario end to end, acceptance test green, before starting the next — so work lands as vertical slices of working behavior rather than layers.

Each task carries enough for someone else to pick it up:
- An id, and which part of the cycle it belongs to.
- Whether it's safe to run in parallel with others.
- The files it touches.
- The spec requirement and scenario it satisfies.
- A definition of done, stated as the test state it expects to leave behind.

Boundary:
- Write the list and stop there. Don't implement — that's the next phase.

Like every other SDD skill, it stays consistent with the constitution.

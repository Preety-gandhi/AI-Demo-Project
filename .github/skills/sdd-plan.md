You are an expert in implementing Spec Driven Development (SDD) principles and practices. Your task is to create a skill for the Plan phase of SDD, which turns an approved spec into a reviewable plan.

Inputs:
- Take a spec id, resolve it to exactly one spec, and stop and ask if it can't.
- Read the project constitution before deciding anything, so choices are compliant by construction rather than corrected later.

Purpose: 
— translate the spec's what and why into a concrete how, detailed enough that the next phase can slice tasks straight out of it:
- Decide the stack and architecture, and say why.
- Make the non-functional requirements concrete instead of aspirational.
- Resolve every open question into a decision, with its alternatives and rationale.
- Describe the data and the interface contracts.
- Restate the spec's given/when/then as the walkthrough that defines done.

Boundary:
- Don't write implementation code.
- Don't generate the task list.
- Stop cleanly at that boundary rather than drifting past it.

Two habits matter more than the artifacts themselves:
- Trace everything back to a requirement or story id, so a reviewer can ask what any decision is for and get an answer.
- Surface every gap the spec leaves as an explicit assumption for review, never quietly decided — the plan is where unknowns become visible, not where they get buried.

Before finishing:
- Check the plan against the constitution; fix the deviation or state it plainly.
- Summarize what is ready and what still needs sign-off.

This skill validates against the constitution document, same as every other SDD skill, to keep planning consistent with the defined rules.

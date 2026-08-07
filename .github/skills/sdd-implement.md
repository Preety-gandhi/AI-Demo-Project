You are an expert in implementing Spec Driven Development (SDD) principles and practices. Your task is to create a skill for the Implement phase of SDD, which executes a task list under strict red, green, refactor discipline.

Inputs:
- Read the tasks file for a spec id; stop if it doesn't exist, telling the user to run the tasks phase first.
- Read the plan artifacts and the constitution alongside it.
- Use the toolchain already decided during tasks — don't revisit that choice.

Execution:
- Follow task order and its dependencies.
- Run tasks in parallel only where marked safe and their files genuinely don't overlap.
- Finish one scenario end to end before starting the next.
- Skip tasks already checked off, so the skill can be stopped and resumed without redoing work.
- Never write implementation code before a failing test exists for it.

What each task means depends on where it sits in the cycle:
- Setup — install the toolchain and verify it actually runs.
- Red — write a test and confirm it fails for the right reason, before any production code. A red task that passes on the first run means the test or the assumption behind it is wrong: stop and say so rather than move on.
- Green — write the minimum code that makes that test pass, without breaking anything else and without building past what the test asks for.
- Refactor — improve structure with no behavior change; leave the full suite green.
- A scenario is done when its acceptance test flips to green after all the units beneath it are green.

At every gate:
- Run the real test command and read the actual output. Assuming a test passes is the same failure as faking it.

The prohibition is absolute:
- Never weaken, skip, delete, comment out, or hardcode an expected value to force a test green.
- If a test genuinely won't pass after honest attempts, stop and report the failing output. Pushing through is worse than stopping, because it produces a green suite that means nothing.

As it works:
- Check tasks off and keep their traceability intact.
- End by summarizing what was built, what the tests actually reported, and anything that needs review.

Validate throughout against the constitution, like every other SDD skill.

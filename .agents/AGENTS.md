# AgentFlow Workspace Customization Rules

## Git Workflow
- Never commit directly to the `main` branch.
- Create (or switch to) a branch named `dev` (do not create any other branches unless explicitly asked).
- Make all code changes only on the `dev` branch.
- Commit and push all changes only to `origin/dev`.
- Verify the project builds successfully and that existing functionality is not broken before every push.
- Do not merge `dev` into `main` automatically.
- After each task, provide:
  - Files changed
  - Reason for each change
  - Build/test results
  - Commit hash on `dev`
- Wait for user approval before merging `dev` into `main`.
- When approved, merge `dev` into `main`, resolve any conflicts if needed, push `main`, and provide the new `main` commit hash.

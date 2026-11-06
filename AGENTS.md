# Repository lookup preference

The user requests Graphify as the preferred starting point for future repository
lookups. Its output is available locally; an MCP connector is not required.

- Read `graphify-out/GRAPH_REPORT.md` for an architecture overview.
- Query `graphify-out/graph.json` for symbols, dependencies, callers and related
  components. It uses `nodes` and `links`; nodes include `source_file` and
  `source_location`. Inspect relevant subsets instead of printing the whole file.
- Use `graphify-out/graph.html` when a visual view would help.
- Check `built_at_commit` against the current Git HEAD and consider uncommitted
  changes. Verify findings in the actual source files, especially if the graph or
  report is stale or disagrees with the other artifacts. Treat inferred edges as
  leads to verify, not established facts.
- Use `rg` and direct file reads for exact text, validation, or gaps in the graph.

## Keep Graphify up to date

The user explicitly requests automatic graph maintenance as part of future code
changes. After adding, modifying, renaming, or deleting source files (especially
`.ts`, `.tsx`, API routes, handlers, and their dependencies), update Graphify before
the final handoff. Batch the update once after the implementation and any fixes;
do not ask for confirmation for this routine local regeneration.

- Run the installed Graphify incremental updater from the repository root:
  `graphify update .`. The user provided this installed Windows executable;
  use it directly when the command is not on PATH:

  ```powershell
  & "C:\Users\engin\AppData\Roaming\Python\Python314\Scripts\graphify.exe" update .
  ```

  A sandbox may deny execution of this executable outside the workspace. Use the
  tool's normal escalation mechanism when needed; do not misdiagnose that denial
  as a missing Graphify installation.
- Refresh `graphify-out/graph.json`, `graphify-out/graph.html`, and
  `graphify-out/GRAPH_REPORT.md` using the tool's supported workflow. Verify the
  command succeeded and inspect the affected files/symbols and relationships in
  the generated output. Check renamed/deleted paths as well as new ones.
- Include uncommitted working-tree edits in the update. A matching Git HEAD alone
  does not establish freshness.
- If Graphify is unavailable or updating fails, preserve the previous output,
  state that the graph remains stale, and report the concrete blocker. Do not
  edit graph metadata by hand to make it appear current.

The graph is a navigation aid for code and architecture. It does not change the
TAX-HKD evidence policy: case chunks are recognition hints, and only verified
knowledge cards may ground legal answers and citations.

## Security review skill

Use the installed `security-audit` skill from
`C:/Users/engin/.codex/skills/security-audit/SKILL.md` for security questions and
reviews of APIs, authentication, authorization, data isolation, and LLM/tool
boundaries. Its upstream is `https://github.com/cloudflare/security-audit-skill`.
Read the skill before applying its workflow. Use focused guidance for focused
questions; use its complete audit workflow for an explicit codebase audit,
comprehensive security review, or requested audit reports. Graphify may guide
navigation, but confirm security findings against current source and evidence.

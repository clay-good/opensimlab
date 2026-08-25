# Corrections log

A permanent, public record of every clinical error found in Open Sim Lab and what was done
about it. Entries are appended. **Nothing here is ever deleted or rewritten**, including
entries that are embarrassing.

Each entry states what was wrong, the potential educational impact, who reported it, what
changed, and which release carried the fix.

## How to report something

Every playable scenario has a shared **Report a problem** control. It sends only the scenario,
version, public practice context, category, and an optional 160-character note after showing a
preview and completing Cloudflare Turnstile. Do not include real patient or learner information.
If the separately deployed report service is disabled, invited reviewers can still use
`/content-review`, export their local notes file, and return it through their invitation channel.
The repository remains private, so public repository issue intake is not available yet.

Once public intake ships, reports are acknowledged within five working days. An error that could teach an unsafe
practice is triaged as urgent and the affected content is disabled in the next build
regardless of the release schedule.

## Entries

*No corrections have been recorded yet, because no clinical review has yet taken place.
This log is not empty because the content is right; it is empty because nobody qualified
has looked at it. See [`GOVERNANCE.md`](GOVERNANCE.md).*

<!--
Template for an entry:

### YYYY-MM-DD — short title

- **Item:** the content id and kind
- **What was wrong:** plain description
- **Potential educational impact:** what a learner might have wrongly concluded
- **Reported by:** name, or "anonymous" if they asked
- **What changed:** the fix
- **Released in:** version
- **Timeline:** reported → acknowledged → fixed → released
-->

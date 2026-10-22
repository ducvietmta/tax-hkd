# Question purpose and partial-answer relevance

The reported question asked for a definition but received a revenue fact plus a partial-answer notice. A fact being supported by a source does not establish that it answers the user's request.

The native business classifier now records `answerPurpose` separately from taxpayer, income and operational topic. A confidently classified definition stays on the concept/lookup path, excludes calculation templates and asks generation to lead with the definition. Retrieval uses general concept/definition terms to rank the existing sources; it does not match the reported question or select a canned answer.

Each claim review now has an `IRRELEVANT` verdict. `COMPLETE` requires direct relevance to the mapped user request as well as legal support and independence. Irrelevant claims cannot enter a verified partial answer. For a single definition request, incomplete global coverage prevents returning an unrelated surviving fact even when the claim verdict is overly positive. The legal/evidence checks remain in force.

Offline regression `npm run test:question-purpose` covers the reported question, two paraphrases, source retention, an irrelevant claim, a correct definition through `handleChat`, and an inconsistent review that marks an off-topic fact COMPLETE while reporting incomplete coverage. Providers are mocked and the test makes no live model call. The source for the reported concept is the existing chunk 16.108; no new legal rule or question-specific response was added.

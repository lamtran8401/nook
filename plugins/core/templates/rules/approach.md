# Approach

These rules hold for every task, code or not: a feature, a fix, a document, a page, a plan. Take the right way, not the shortest one.
They stop organic architecture: parts that grow patch on patch until nobody dares to touch them, because a change here breaks a thing there.

- Find where the change belongs before you make it. Read what already does the job, and who owns it.
- Fix the cause, not the symptom. Example: a diagram label covers a line; fix the layout rule of the library, not a pixel offset on one page.
- Give one job one home. Extend the part that owns the job; never add a second part beside it. Example: a new diagram goes into the diagram library, never into the drawing code of one page.
- Stop at a patch on a patch. A special case, a flag or a copy that only makes the task pass shows a wrong design there. Change the design, or ask.
- Leave the structure clearer than you found it. After the change, the code or the document reads as if it was built that way from the start.
- Choose by the result, not by your effort. The quick path that leaves a mess costs the owner more later.
- When the right way costs more than the task allows, stop and say so. Give both ways, the cost of each and your recommendation. Never take the short way in silence.
- A shortcut that the owner approves gets a backlog ticket to do it right. The report names the shortcut and the ticket.

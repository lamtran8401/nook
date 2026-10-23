---
name: contract-check
description: "List the impact of a contract change on each consumer (none, needs a change, breaks) and the order of change, through the read-only contract designer. Use in /recipe and /deep-review when a shared schema changes, or when the owner asks who consumes it."
argument-hint: "<item id>"
allowed-tools: Bash(nook eng *), Read, Glob, Grep
---

Goal: before the approve and again before the accept, show which areas a contract change reaches and whether each one still works.
A contract is shared by areas that deploy apart, so an unchecked consumer is a failure in production that the tests of one area cannot see.

## Where the change is
- In a plan: the Design section of `plan.md` and the contract files it names.
- In a review: the diff of the branch in each area. Read the real change, not the plan.
- A contract file is any shared interface: a proto, a GraphQL or OpenAPI schema, an event schema. Find them with a search in the folders of `nook eng area status`.

## Order
1. Start the Agent tool with `subagent_type: nk-eng:contract-designer`, the brief (`nook eng item brief <id>`), the folders of the areas, where the change is, and one job: "plan check" or "review check".
   A review check after a plan check goes to the same contract designer: SendMessage to the id in `nook eng notes <id>`, with the diff to check.
2. Read its table. For each consumer: none, needs a change, or breaks, with the file and line. For each change: additive or breaking.
3. Check the order it gives: the contract, then the provider, then the consumers. Which consumers can ship before the provider.
4. A breaking change needs a migration path and the owner's explicit word. Say so and stop there: nobody approves it for the owner.
5. In a review, each consumer has evidence: a test, a build against the new types, or a line read. A consumer with none is a finding for `/deep-review`.

```
Contract change: ListShipmentsRequest.status (optional string, added). Additive: yes.
Consumers:
- bff `src/shipments/list.ts:42`: provider. Needs a change: reads the new field.
- frontend `src/shipments/api.ts:11`: uses the generated request type. Works unchanged; needs a change to send it.
Search terms: ListShipmentsRequest, status, @shop/contracts.
Order: contract, bff, frontend. Old frontend with new bff works.
Review evidence: bff `list.test.ts` covers the field; frontend built against the new types.
```

## Gotchas
- Generated code hides consumers. Search for the generated type name and the package import, not only the field name.
- "None found" needs the search terms. Write what was searched.
- A changed default value is a breaking change even when the type is the same.
- A consumer outside the areas of `nook.yml` is outside the check. Say that it can exist.
- The agent reports. You change the plan; nobody edits a contract to make a check pass.

# The issue-tracker pack

> In short: the pack reads tickets from Jira through `twg` and from GitHub through `gh`, and never writes to a tracker. A desk maps the fields of each team by their use, such as the acceptance criteria.

This file states how the code works now. The code is in `packages/issues/`; the plugin is `plugins/issue-tracker/`, named `nk-issues`.
`nook init --pack issue-tracker` turns the pack on. The pack belongs to the nearest desk above a folder that turns it on.

## The section of nook.yml

```yaml
issue-tracker:
  backlog: backlog                            # the folder of the tickets; the default
  sources:
    - type: jira
      site: company.atlassian.net
      fields:                                 # each use names a Jira field id
        acceptanceCriteria: customfield_10095
        sprint: customfield_10019
      projects:                               # a project with other fields overrides the map
        PAY: { fields: { acceptanceCriteria: customfield_10210 } }
    - type: github
      repo: acme/shop
      prefix: GH                              # issue 482 becomes the item GH-482; the default
      sections:                               # each use names a heading of the issue body
        acceptanceCriteria: Acceptance criteria
```

| Fault | What the command says |
|---|---|
| a Jira map value that is no field id, such as `acceptance` | it stops and names the key and the form `customfield_<number>` |
| a source of another type | `type must be jira or github` |
| a GitHub repo with no owner | `repo must be owner/name` |
| a Jira source with no site | `site must name the Jira site` |
| a prefix with small letters or marks | `prefix must be capital letters and digits` |

- The setup of the pack makes the backlog folder.
- With no section, `nook doctor` shows the gap and the fix `/setup`. A section with no source is a gap too.

## The commands

| Command | What it does |
|---|---|
| `nook issues pull <ref...>` | reads each ticket and writes `backlog/<KEY>/ticket.md`; a ref is a Jira key such as `SHOP-12`, `GH-482` by the prefix of a GitHub source, or `acme/shop#482` by its repo |
| `nook issues fields <ref>` | each field of a Jira ticket, or each heading of a GitHub issue, with its id, its name and the start of its value; `/setup` writes the map from it |
| `nook issues sources` | each source, and whether its CLI is on the path and has a login; exit 3 with the fix when one does not |

## The pull

The pull checks every ref before it writes a file. It reads a GitHub issue with `gh issue view <number> --repo <repo> --json`, and a Jira work item with `twg --site <site> jira workitem get <KEY> --full -o json`. It writes this shape:

```text
# GH-482: Filter orders by status
## Fields                 Source, State, Author, Labels, Milestone, Assignees
## Description            the body, with the parts of the map taken out
## Acceptance criteria    the part of the body under its heading, or "None in the ticket."
## Technical solution     one part for each other use of the map
## Comments               each comment with its author and its day
## Attachments            each file kept in attachments/, or a link when it is too large
```

- A heading of the map matches at any level and with any case. A heading in the words of the ticket sits two levels lower, so it never reads as a part of the ticket.
- A second pull writes the new text and names each part that changed. It never touches the ledger, so the item keeps its state.
- The report names each use of the map that the ticket does not have. A ticket with no acceptance criteria is still pulled; `/spec` asks for them.
- A read that fails because the CLI or its login is missing exits 3 with the fix, such as `gh auth login`. A read that fails for another reason gives the first line of the CLI.
- An image in a GitHub issue stays a link: a download from a private repo needs a token, and Nook keeps none.

A Jira work item:
- A key such as `SHOP-12` goes to the only Jira source, or to the site whose `projects` name its project. Two sites that both fit stop the pull with the fix.
- The map of the key is the map of the source with the override of its project, use by use.
- Rich text in the Atlassian Document Format becomes Markdown: headings, lists, code, quotes, tables, links, mentions and panels.
- The acceptance criteria always get their own part. Another use gets a part when its value is rich text, has a line break or is longer than 80 characters. A shorter value, such as a sprint, is a row of Fields.
- Each file of 10 MB or less downloads into `attachments/` through `twg jira workitem attachment download`. A larger file stays a link. A file name keeps only its last part.
- The reader takes a field from the item or from its `fields`, and the item from `data` or from the first of `data.items`. The real answer of `twg` is checked on a desk with a Jira login.
- `/intake <KEY>` runs the pull when the pack is on, then makes the item with the link as its source.

## The logins

Nook keeps no token: `twg` and `gh` hold the logins. A check reads only the exit code of the tool, so no line of the tool shows.

| Source | CLI | Login check | Fix |
|---|---|---|---|
| Jira | `twg` | `twg --site <site> whoami` | `twg login --site <site>` |
| GitHub | `gh` | `gh auth status --hostname github.com` | `gh auth login` |

- A CLI that is not on the path is a gap with its install.
- `nook doctor` shows the same gaps as `nook issues sources`, one line for each source.
- The web app leaves these checks out of its home page: a login check asks the server of the tracker, and the home page reads the disk only.
- The files `~/.config/twg` and `~/.config/gh` are secret files for every agent.

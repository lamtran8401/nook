# The issue-tracker feature

> In short: the feature reads tickets from Jira through `twg` and from GitHub through `gh`, and never writes to a tracker. A workspace maps the fields of each team by their use, such as the acceptance criteria.

This file states how the code works now. The code is in `packages/issues/`; its rule and hook are in `plugin/`.
The section `issue-tracker:` of `nook.yml` turns the feature on; `nook init --with issue-tracker` writes it. The feature belongs to the nearest workspace above a folder with the section.

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
        points: customfield_10016            # the story points: intake gives them to the item
      projects:                               # a project with other fields overrides the map
        PAY: { fields: { acceptanceCriteria: customfield_10210 } }
      skip: [Release, Test]                   # optional: the types with no local work in this workspace
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

- The setup of the feature makes the backlog folder.
- With no section, `nook doctor` shows the gap and the fix `/setup`. A section with no source is a gap too.

## The commands

| Command | What it does |
|---|---|
| `nook issues pull <ref...>` | reads each ticket and writes `backlog/<KEY>/ticket.md`; a ref is a Jira key such as `SHOP-12`, `GH-482` by the prefix of a GitHub source, or `acme/shop#482` by its repo |
| `nook issues fields <ref>` | each field of a Jira ticket, or each heading of a GitHub issue, with its id, its name and the start of its value; `/setup` writes the map from it |
| `nook issues sources` | each source, and whether its CLI is on the path and has a login; exit 3 with the fix when one does not |
| `nook issues hook bash` | the guard of the Bash calls of an agent: it reads the Claude Code event on stdin and blocks a write to a tracker |

## The pull

The pull checks every ref before it writes a file. It reads a GitHub issue with `gh issue view <number> --repo <repo> --json`, and a Jira work item with `twg --site <site> jira workitem get <KEY> --full`, with `--field <id>` for each field id of the map. It writes this shape:

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
- The report names each use of the map that the ticket does not have. A ticket with no acceptance criteria is still pulled; `/specify` asks for them.
- A read that fails because the CLI or its login is missing exits 3 with the fix, such as `gh auth login`. A read that fails for another reason gives the first line of the CLI.
- An image in a GitHub issue stays a link: a download from a private repo needs a token, and Nook keeps none.

A Jira work item:
- A key such as `SHOP-12` goes to the only Jira source, or to the site whose `projects` name its project. Two sites that both fit stop the pull with the fix.
- The pull writes the type of the ticket as a row `Type:` of Fields. The feature maps no type onto a kind: engineering learns the kind of each type in the workspace (`nook eng kind set`), so a pasted ticket with a `Type:` line works the same.
- A type in `skip` stops the pull with exit 3: it has no local work in this workspace. Every other type is pulled.
- The parent of a ticket, such as the story of a sub-bug, is a row `Parent:` of Fields. `/intake` makes the item with `--parent` when the parent is in the ledger.
- The map of the key is the map of the source with the override of its project, use by use.
- Rich text in the Atlassian Document Format becomes Markdown: headings, lists, code, quotes, tables, links, mentions and panels.
- The acceptance criteria always get their own part. Another use gets a part when its value is rich text, has a line break or is longer than 80 characters. A shorter value, such as a sprint, is a row of Fields.
- Each call of `twg` that reads JSON adds `-o json --output-summary none`. Without it, `twg` in an agent session can write a large answer to a file and print only `output_files:` and the path.
- An answer that is not JSON stops the pull with its first line, such as `twg gave no JSON for SHOP-12: output_files:`.
- An Epic is not a work item. Its pull stops with exit 3 and lists its stories from `twg jira workitem query --jql "parent = <KEY>"`.
- The files come from `twg jira workitem attachment query --issue-id <KEY>`. Each file of 10 MB or less downloads into `attachments/` through `twg jira workitem attachment download`. A larger file stays a link. A file name keeps only its last part.
- A file that is already in `attachments/` stays as it is, and the pull does not download it again. The owner keeps context files in that folder too.
- The reader takes the item by the rule of `twg`: the first of `data.items`, the first of `data` as a list, or `data`. It takes a field from the item or from its `fields`.
- An answer with no work item stops the pull and names its shape by its keys only, such as `twg gave no work item for SHOP-12: data is a list of 0`. An item with another key stops it too. The pull never writes an empty ticket.
- `/intake <KEY>` runs the pull when the feature is on, then makes the item with the link as its source.

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

## The guard

The hook `nook issues hook bash` blocks each write of `twg` and `gh` in a Bash call of an agent. It runs only in a workspace with the section `issue-tracker`. The feature reads with its own calls, so the guard never stops a pull.

| Call | The guard |
|---|---|
| `gh issue view`, `list`, `status` | passes |
| another `gh issue` call, such as `comment` or `close` | blocks |
| `gh api` with `-X` or `--method` other than `GET` or `HEAD` | blocks |
| `gh api` with `-f`, `-F`, `--field`, `--raw-field` or `--input` | blocks |
| another `gh` call, such as `gh pr view` | passes |
| a `twg` command that the map marks a read | passes |
| a `twg` command that the map marks `*` (a write) | blocks |
| a `twg` command that the map marks `?`, or does not have | blocks |
| `twg --version`, `twg --help` | passes |

- The map comes from `twg help-map`, once for each Bash call that runs `twg`. It names each command of the installed `twg`, so a new command of `twg` needs no change in Nook.
- The guard skips the global options of `twg` and their values, such as `--site company.atlassian.net` and `-o json`. It takes the longest command of the map that the words start with. An alias of a group, such as `bb` for `bitbucket`, counts.
- When `twg help-map` fails, the guard blocks every `twg` command but `--version` and `--help`.
- The guard reads each simple command with the shell parser of `packages/shared`. A call inside `$(...)`, backticks, `eval`, `sh -c` or a heredoc to a shell counts.
- Only the command word is a call, such as `gh` in `FOO=1 gh issue close 1`. A word in the arguments of another program passes, such as `grep -rn twg src`.
- After a program that runs a command, such as `xargs`, `env`, `sudo`, `timeout` or `find -exec`, each `gh` or `twg` word is a call.
- A block names the command and says to ask the owner, such as `gh issue comment writes to the tracker: the agents of this workspace only read tickets. Ask the owner to do it.`
- The guard fails closed: when it fails, it blocks the call with the reason.

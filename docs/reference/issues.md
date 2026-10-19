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
| `nook issues sources` | each source, and whether its CLI is on the path and has a login; exit 3 with the fix when one does not |

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

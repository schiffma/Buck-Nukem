# Spec Delta

## ADDED Requirements

### Requirement: Build version
The build SHALL embed a version text in the game file, derived from git: the release tag (for example "v1.0.2") when no files outside `dist/` changed since that tag, otherwise the tag plus the number of commits since it and the short commit hash (for example "v1.0.2-3-gab12cd3"), with "-dirty" appended when files outside `dist/` have uncommitted changes. When git or the tags are not available, it SHALL fall back to "v" plus the contents of the `VERSION` file.

#### Scenario: Tagged release
- **WHEN** the build runs on the commit tagged v1.0.2 with no changes outside `dist/`
- **THEN** the game file contains the version "v1.0.2"

#### Scenario: Building the release file does not change its version
- **WHEN** the release is tagged, the build is run and the rebuilt `dist/buck_nukem.html` is committed on top of the tag
- **THEN** rebuilding still yields the version "v1.0.2"

#### Scenario: Work in progress
- **WHEN** the build runs with uncommitted changes in `src/`
- **THEN** the version ends in "-dirty"

#### Scenario: No git
- **WHEN** the build runs where git is not installed or the folder is not a git repository
- **THEN** the build still succeeds and the version is "v" plus the `VERSION` file contents

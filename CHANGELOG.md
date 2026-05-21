# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2026-05-21

### Fixed

- Server failed to start when launched through the installed bin (`npm install -g`)
  or `npx` — the entry-point check compared `process.argv[1]` (a symlink) against
  `import.meta.url` (the real file), never matched, and the process exited 0
  without connecting the stdio transport. The check now resolves symlinks on both
  sides. ([#1](https://github.com/beaconed/beaconed-mcp/issues/1))

## [0.0.1] - 2026-05-19

### Added

- Initial release.
- MCP server exposing Beaconed v1 API to Claude and other MCP clients.

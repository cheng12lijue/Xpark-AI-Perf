# Changelog

All notable changes to Xpark AI Perf are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-07-27

### Added

- **Model Registry**: recipe browsing tab with filtering by solo/cluster/dual/triple/quad nodes and search.
- **Model Deploy**: running instance management tab showing throughput, memory, latency metrics with start/stop controls and deploy logs.
- **Key Management**: credential management tab supporting API Key add, edit, delete and node distribution.

## [0.2.0] - 2026-07-27

### Changed

- Auto-versioned footer indicator displayed at the bottom-right corner.
- Sidebar tab labels always visible with enhanced active-tab green highlight.
- Removed "Prefix Queries" metric block from engine cards for cleaner layout.
- Version indicator moved from footer to header as a subscript badge next to
  the "AI Perf" title, using the brand-green color.
- Docker image references lowercased to `ghcr.io/arcseekerx/...` (Docker
  rejects uppercase in repository names).
- `docker run` quick-start switched to `--network host` (consistent with
  compose `network_mode: host`).

### Fixed

- Frontend Docker build failure: copy CHANGELOG.md into build stage so the
  `../../CHANGELOG.md?raw` import resolves inside the container.
- Sidebar tab active-state highlight not applying — corrected Base UI attribute
  from `data-[state=active]` to `data-active`.
- Inactive sidebar icons too dim; bumped from `text-zinc-500` to `text-zinc-400`.

## [0.1.0] - 2026-07-24

### Added

- Initial Xpark AI Perf release.
- Real-time Linux hardware monitoring for NVIDIA GPUs, CPU, memory, disk, and
  network activity.
- Automatic vLLM engine discovery and live inference performance metrics.
- React dashboard with multi-GPU and multi-engine views, historical charts,
  gauges, and configurable SLO goodput monitoring.
- Native Linux service installation and Docker Compose deployment options.

[0.3.0]: https://github.com/ArcSeekerX/Xpark-AI-Perf/releases/tag/v0.3.0
[0.2.0]: https://github.com/ArcSeekerX/Xpark-AI-Perf/releases/tag/v0.2.0
[0.1.0]: https://github.com/ArcSeekerX/Xpark-AI-Perf/releases/tag/v0.1.0
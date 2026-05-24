# Second Galactic War Mechanics (Strategic Modeling)

The war map is dynamic and tick-based. Planet outcomes depend on real HP movement over time, not displayed percentages alone.

Wiki-aligned modeling anchors:
- Campaign types include Liberation, Defense, and High Priority Campaigns with distinct mechanics.
- Defense Campaigns are timer-bound and have no true Enemy Resistance.
- Gambits can instantly resolve connected Defense Campaigns if the attack source is captured.
- Planet max HP can differ (including region-driven increases), so percent-complete comparisons can mislead.

Key modeling concept: prefer measured deltas (HP/hour, decay/hour, trend windows) over one-shot state snapshots.


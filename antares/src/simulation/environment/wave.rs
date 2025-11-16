use chrono::{DateTime, Utc};

/// Radar wave emission from a ship
///
/// Represents a radar reflection (wave emission) from a ship in the simulation.
/// Each wave carries the ship's ID, position, and emission timestamp. The detector
/// processes these waves to generate radar plots.
///
/// # Wave Model
///
/// This is a simplified model that directly provides position information rather
/// than simulating actual electromagnetic wave propagation. In a more sophisticated
/// implementation, this could include:
/// - Wave amplitude and attenuation
/// - Propagation delay based on distance
/// - Reflection characteristics (radar cross-section)
/// - Multipath and interference effects
///
/// # Coordinate System
///
/// Position uses Cartesian coordinates in meters:
/// - X-axis: East (positive) / West (negative)
/// - Y-axis: North (positive) / South (negative)
/// - Origin: Determined by simulation setup
///
/// # Examples
///
/// ```ignore
/// use antares::simulation::Wave;
/// use chrono::Utc;
///
/// let wave = Wave {
///     id: 42,
///     position: (150.0, 200.0),  // 150m east, 200m north
///     timestamp: Utc::now(),
/// };
/// ```
#[derive(Debug)]
pub struct Wave {
    /// Ship identifier (unique within simulation)
    pub id: u64,
    /// Ship position in meters as (x, y) where x=east, y=north
    pub position: (f64, f64),
    /// Emission timestamp (UTC)
    pub timestamp: DateTime<Utc>,
}

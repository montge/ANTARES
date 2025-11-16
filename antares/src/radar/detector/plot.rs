use chrono::{DateTime, Utc};

/// Radar plot representing a single detection of a ship
///
/// A plot contains both polar coordinates (range/azimuth) relative to the detector
/// and geographic coordinates (latitude/longitude) for the detected ship position.
/// Each plot is timestamped and associated with a unique ship ID.
///
/// # Coordinate Systems
///
/// **Polar Coordinates (Detector-centric):**
/// - `range`: Distance from detector in meters
/// - `azimuth`: Bearing from detector in radians
///   - 0 rad = East
///   - π/2 rad = North
///   - π rad = West
///   - -π/2 rad = South
///
/// **Geographic Coordinates (WGS84):**
/// - `latitude`: Degrees north (positive) or south (negative)
/// - `longitude`: Degrees east (positive) or west (negative)
///
/// # Examples
///
/// ```
/// use antares::radar::detector::Plot;
/// use chrono::Utc;
///
/// let plot = Plot {
///     id: 42,
///     range: 1500.5,         // 1500.5 meters from detector
///     azimuth: 1.5708,       // π/2 radians (north)
///     latitude: 4.0135,      // 4.0135°N
///     longitude: -72.0,      // 72.0°W
///     timestamp: Utc::now(),
/// };
/// ```
pub struct Plot {
    /// Unique ship identifier (matches ship ID from simulation)
    pub id: u64,
    /// Distance from detector in meters
    pub range: f64,
    /// Bearing from detector in radians (0 = East, π/2 = North)
    pub azimuth: f64,
    /// Geographic latitude in degrees (positive = North, negative = South)
    pub latitude: f64,
    /// Geographic longitude in degrees (positive = East, negative = West)
    pub longitude: f64,
    /// Detection timestamp (UTC)
    pub timestamp: DateTime<Utc>,
}

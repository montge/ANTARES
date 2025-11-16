use super::super::DetectorConfig;
use super::{Plot, Wave};
use chrono::{DateTime, Utc};
use tokio::sync::mpsc::{Receiver, Sender};
use tokio::task;

/// Radar detector for tracking ship positions and generating plots
///
/// The detector receives wave emissions from ships in the simulation environment
/// and converts them into radar plots with range, azimuth, and geographic coordinates.
/// It supports both stationary and moving detector platforms.
///
/// # Detection Algorithm
///
/// 1. **Wave Reception**: Receives wave emissions from ships via channel
/// 2. **Range/Azimuth Calculation**: Computes polar coordinates relative to detector
/// 3. **Range Filtering**: Discards detections beyond configured range
/// 4. **Coordinate Transformation**: Converts meter-based positions to lat/lng
/// 5. **Plot Generation**: Creates radar plots with all calculated data
///
/// # Coordinate System
///
/// - **Position**: Cartesian coordinates in meters (x, y)
/// - **Range**: Distance from detector in meters
/// - **Azimuth**: Bearing from detector in radians (0 = East, π/2 = North)
/// - **Geographic**: WGS84 coordinates (latitude, longitude in degrees)
///
/// # Moving Detector Support
///
/// The detector can simulate a moving platform by specifying speed and angle.
/// The detector's position is calculated as:
/// ```text
/// time_delta = current_time - start_time (in seconds)
/// x = speed * time_delta * cos(angle)
/// y = speed * time_delta * sin(angle)
/// ```
///
/// # Examples
///
/// ```ignore
/// use antares::radar::detector::{Detector, DetectorConfig};
/// use tokio::sync::mpsc;
///
/// #[tokio::main]
/// async fn main() {
///     // Stationary detector at coordinates (4.0°N, -72.0°W) with 1000m range
///     let config = DetectorConfig {
///         range: 1000.0,
///         speed: 0.0,
///         angle: 0.0,
///         start_coordinates: (4.0, -72.0),
///     };
///     let detector = Detector::new(config);
///
///     let (wave_tx, wave_rx) = mpsc::channel(100);
///     let (plot_tx, mut plot_rx) = mpsc::channel(100);
///
///     // Start detector processing
///     detector.start(wave_rx, plot_tx);
///
///     // Detector will process waves and generate plots
///     while let Some(plot) = plot_rx.recv().await {
///         println!("Detected: range={:.1}m, azimuth={:.2}rad", plot.range, plot.azimuth);
///     }
/// }
/// ```
pub struct Detector {
    /// Detection range in meters (ships beyond this range are not detected)
    pub range: f64,
    /// Detector platform speed in meters per second (0 for stationary)
    pub speed: f64,
    /// Detector platform movement direction in radians (0 = East, π/2 = North)
    pub angle: f64,
    /// Starting geographic coordinates (latitude, longitude) in degrees
    pub start_coordinates: (f64, f64),
    /// Detection start time (used for moving detector position calculation)
    pub start_time: DateTime<Utc>,
}

impl Detector {
    /// Creates a new detector with the given configuration
    ///
    /// # Arguments
    ///
    /// * `config` - Detector configuration containing range, speed, angle, and start coordinates
    ///
    /// # Examples
    ///
    /// ```ignore
    /// use antares::radar::detector::{Detector, DetectorConfig};
    ///
    /// // Stationary detector with 1000m range
    /// let config = DetectorConfig {
    ///     range: 1000.0,
    ///     speed: 0.0,
    ///     angle: 0.0,
    ///     start_coordinates: (4.0, -72.0),
    /// };
    /// let detector = Detector::new(config);
    /// ```
    pub fn new(config: DetectorConfig) -> Detector {
        Detector {
            range: config.range,
            speed: config.speed,
            angle: config.angle,
            start_coordinates: config.start_coordinates,
            start_time: chrono::Utc::now(),
        }
    }

    /// Starts the detector processing loop in a background task
    ///
    /// The detector will continuously receive waves from the `wave_receiver` channel,
    /// calculate range and azimuth, filter by range, convert to geographic coordinates,
    /// and send plots to the `plot_sender` channel.
    ///
    /// The task runs until either:
    /// - The wave receiver channel is closed
    /// - The plot sender channel is closed (receiver dropped)
    ///
    /// # Arguments
    ///
    /// * `wave_receiver` - Channel to receive wave emissions from ships
    /// * `plot_sender` - Channel to send generated radar plots
    ///
    /// # Examples
    ///
    /// ```ignore
    /// use antares::radar::detector::{Detector, DetectorConfig};
    /// use tokio::sync::mpsc;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = DetectorConfig {
    ///         range: 1000.0,
    ///         speed: 0.0,
    ///         angle: 0.0,
    ///         start_coordinates: (4.0, -72.0),
    ///     };
    ///     let detector = Detector::new(config);
    ///
    ///     let (wave_tx, wave_rx) = mpsc::channel(100);
    ///     let (plot_tx, plot_rx) = mpsc::channel(100);
    ///
    ///     detector.start(wave_rx, plot_tx);
    ///     // Detector now processes waves in background
    /// }
    /// ```
    pub fn start(self, mut wave_receiver: Receiver<Wave>, plot_sender: Sender<Plot>) {
        task::spawn(async move {
            while let Some(wave) = wave_receiver.recv().await {
                let (range, azimuth) = self.calculate_range_azimuth(&wave);
                if range > self.range {
                    continue;
                }

                let (latitude, longitude) = self.meters_to_lat_lng(wave.position);
                let plot = Plot {
                    id: wave.id,
                    range,
                    azimuth,
                    timestamp: wave.timestamp,
                    latitude,
                    longitude,
                };
                if plot_sender.send(plot).await.is_err() {
                    eprintln!("Plot sender dropped");
                    break;
                }
            }
        });
    }

    /// Calculates range and azimuth from detector to wave position
    ///
    /// For a moving detector, the detector's current position is calculated based on
    /// time elapsed since start, speed, and movement angle. The range and azimuth are
    /// then calculated relative to this current position.
    ///
    /// # Algorithm
    ///
    /// ```text
    /// detector_pos = (speed * time_delta * cos(angle), speed * time_delta * sin(angle))
    /// delta = wave_position - detector_pos
    /// range = sqrt(delta_x² + delta_y²)
    /// azimuth = atan2(delta_y, delta_x)
    /// ```
    ///
    /// # Arguments
    ///
    /// * `wave` - Wave emission containing ship position and timestamp
    ///
    /// # Returns
    ///
    /// Tuple of (range in meters, azimuth in radians)
    ///
    /// # Azimuth Convention
    ///
    /// - 0 rad (0°) = East
    /// - π/2 rad (90°) = North
    /// - π rad (180°) = West
    /// - -π/2 rad (270°) = South
    fn calculate_range_azimuth(&self, wave: &Wave) -> (f64, f64) {
        let time_delta = (wave.timestamp - self.start_time).num_milliseconds() as f64 / 1000.0;
        let current_position = (
            self.speed * time_delta * self.angle.cos(),
            self.speed * time_delta * self.angle.sin(),
        );
        let delta_position = (
            wave.position.0 - current_position.0,
            wave.position.1 - current_position.1,
        );
        let range = (delta_position.0.powi(2) + delta_position.1.powi(2)).sqrt();
        let azimuth = delta_position.1.atan2(delta_position.0);
        (range, azimuth)
    }

    /// Converts meter-based coordinates to geographic lat/lng coordinates
    ///
    /// Uses a simple equirectangular approximation suitable for small distances:
    /// - 1 degree latitude ≈ 111,320 meters (constant)
    /// - 1 degree longitude ≈ 111,320 * cos(latitude) meters (varies with latitude)
    ///
    /// # Arguments
    ///
    /// * `position` - Position in meters as (x, y) where x is east and y is north
    ///
    /// # Returns
    ///
    /// Geographic coordinates as (latitude, longitude) in degrees
    ///
    /// # Accuracy
    ///
    /// This approximation is suitable for:
    /// - Distances up to ~100 km
    /// - Latitudes between -70° and 70°
    ///
    /// For larger distances or polar regions, use more sophisticated projections.
    ///
    /// # Examples
    ///
    /// ```ignore
    /// # use antares::radar::detector::{Detector, DetectorConfig};
    /// # let config = DetectorConfig {
    /// #     range: 1000.0,
    /// #     speed: 0.0,
    /// #     angle: 0.0,
    /// #     start_coordinates: (0.0, 0.0),
    /// # };
    /// # let detector = Detector::new(config);
    /// // Move 111,320m north from equator (0, 0)
    /// // Should result in approximately (1.0, 0.0)
    /// ```
    fn meters_to_lat_lng(&self, position: (f64, f64)) -> (f64, f64) {
        let (lat, lng) = self.start_coordinates;
        let (dx, dy) = position;
        let new_lat = lat + (dy / 111320.0);
        let new_lng = lng + (dx / (111320.0 * lat.to_radians().cos()));
        (new_lat, new_lng)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    const EPSILON: f64 = 1e-6;

    fn assert_approx_eq(a: f64, b: f64, msg: &str) {
        assert!(
            (a - b).abs() < EPSILON,
            "{}: expected {}, got {} (diff: {})",
            msg,
            b,
            a,
            (a - b).abs()
        );
    }

    fn create_test_detector(range: f64, speed: f64, angle: f64, coords: (f64, f64)) -> Detector {
        let config = DetectorConfig {
            range,
            speed,
            angle,
            start_coordinates: coords,
        };
        Detector::new(config)
    }

    fn create_test_wave(id: u64, position: (f64, f64), detector: &Detector) -> Wave {
        Wave {
            id,
            position,
            timestamp: detector.start_time,
        }
    }

    #[test]
    fn test_detector_new_initializes_correctly() {
        let config = DetectorConfig {
            range: 1000.0,
            speed: 5.0,
            angle: PI / 4.0,
            start_coordinates: (4.0, -72.0),
        };
        let detector = Detector::new(config);

        assert_eq!(detector.range, 1000.0);
        assert_eq!(detector.speed, 5.0);
        assert_eq!(detector.angle, PI / 4.0);
        assert_eq!(detector.start_coordinates, (4.0, -72.0));
    }

    #[test]
    fn test_calculate_range_azimuth_stationary_detector_origin() {
        // Detector at origin (0, 0), stationary
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (100.0, 0.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 100.0, "Range should be 100m");
        assert_approx_eq(azimuth, 0.0, "Azimuth should be 0 (east)");
    }

    #[test]
    fn test_calculate_range_azimuth_stationary_detector_north() {
        // Ship directly north of stationary detector
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (0.0, 100.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 100.0, "Range should be 100m");
        assert_approx_eq(azimuth, PI / 2.0, "Azimuth should be π/2 (north)");
    }

    #[test]
    fn test_calculate_range_azimuth_stationary_detector_west() {
        // Ship directly west of stationary detector
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (-100.0, 0.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 100.0, "Range should be 100m");
        assert_approx_eq(azimuth, PI, "Azimuth should be π (west)");
    }

    #[test]
    fn test_calculate_range_azimuth_stationary_detector_south() {
        // Ship directly south of stationary detector
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (0.0, -100.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 100.0, "Range should be 100m");
        assert_approx_eq(azimuth, -PI / 2.0, "Azimuth should be -π/2 (south)");
    }

    #[test]
    fn test_calculate_range_azimuth_diagonal() {
        // Ship at 45° (northeast)
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (100.0, 100.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        // Distance should be sqrt(100^2 + 100^2) = 141.42
        assert_approx_eq(range, 141.421356, "Range should be ~141.42m");
        assert_approx_eq(azimuth, PI / 4.0, "Azimuth should be π/4 (45°)");
    }

    #[test]
    fn test_calculate_range_azimuth_ship_at_detector_position() {
        // Ship at same position as detector
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (0.0, 0.0), &detector);

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 0.0, "Range should be 0");
        // Azimuth is undefined at range 0, but atan2(0, 0) returns 0
        assert_approx_eq(azimuth, 0.0, "Azimuth at origin");
    }

    #[test]
    fn test_calculate_range_azimuth_large_distance() {
        // Ship very far away
        let detector = create_test_detector(10000.0, 0.0, 0.0, (0.0, 0.0));
        let wave = create_test_wave(1, (5000.0, 0.0), &detector);

        let (range, _azimuth) = detector.calculate_range_azimuth(&wave);

        assert_approx_eq(range, 5000.0, "Range should be 5000m");
    }

    #[test]
    fn test_meters_to_lat_lng_origin() {
        // Start at equator (0, 0), no offset
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, 0.0));

        assert_approx_eq(lat, 0.0, "Latitude should be 0");
        assert_approx_eq(lng, 0.0, "Longitude should be 0");
    }

    #[test]
    fn test_meters_to_lat_lng_north() {
        // Start at equator, move 111320m north (1 degree)
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, 111320.0));

        assert_approx_eq(lat, 1.0, "Latitude should increase by 1 degree");
        assert_approx_eq(lng, 0.0, "Longitude should remain 0");
    }

    #[test]
    fn test_meters_to_lat_lng_east() {
        // Start at equator, move 111320m east (1 degree)
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let (lat, lng) = detector.meters_to_lat_lng((111320.0, 0.0));

        assert_approx_eq(lat, 0.0, "Latitude should remain 0");
        assert_approx_eq(lng, 1.0, "Longitude should increase by 1 degree");
    }

    #[test]
    fn test_meters_to_lat_lng_from_non_zero_origin() {
        // Start at (4.0, -72.0), no offset
        let detector = create_test_detector(1000.0, 0.0, 0.0, (4.0, -72.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, 0.0));

        assert_approx_eq(lat, 4.0, "Latitude should be 4.0");
        assert_approx_eq(lng, -72.0, "Longitude should be -72.0");
    }

    #[test]
    fn test_meters_to_lat_lng_from_non_zero_origin_with_offset() {
        // Start at (4.0, -72.0), move 111320m north
        let detector = create_test_detector(1000.0, 0.0, 0.0, (4.0, -72.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, 111320.0));

        assert_approx_eq(lat, 5.0, "Latitude should increase by 1 degree to 5.0");
        assert_approx_eq(lng, -72.0, "Longitude should remain -72.0");
    }

    #[test]
    fn test_meters_to_lat_lng_negative_offset() {
        // Start at (4.0, -72.0), move 111320m south (negative dy)
        let detector = create_test_detector(1000.0, 0.0, 0.0, (4.0, -72.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, -111320.0));

        assert_approx_eq(lat, 3.0, "Latitude should decrease by 1 degree to 3.0");
        assert_approx_eq(lng, -72.0, "Longitude should remain -72.0");
    }

    #[test]
    fn test_meters_to_lat_lng_small_offset() {
        // Small offset (100m north)
        let detector = create_test_detector(1000.0, 0.0, 0.0, (0.0, 0.0));
        let (lat, lng) = detector.meters_to_lat_lng((0.0, 100.0));

        // 100m / 111320m ≈ 0.000898 degrees
        assert!((lat - 0.000898).abs() < 0.0001, "Latitude should increase by ~0.000898 degrees");
        assert_approx_eq(lng, 0.0, "Longitude should remain 0");
    }

    #[test]
    fn test_meters_to_lat_lng_at_high_latitude() {
        // At high latitude (60°), longitude degrees are compressed
        let detector = create_test_detector(1000.0, 0.0, 0.0, (60.0, 0.0));
        let (lat, lng) = detector.meters_to_lat_lng((111320.0, 0.0));

        assert_approx_eq(lat, 60.0, "Latitude should remain 60.0");
        // At 60° latitude, cos(60°) ≈ 0.5, so 1 degree of longitude is ~2x the distance
        // 111320m should be ~2 degrees of longitude
        assert!((lng - 2.0).abs() < 0.01, "Longitude should increase by ~2 degrees at 60° latitude");
    }

    #[test]
    fn test_calculate_range_azimuth_with_moving_detector() {
        // Detector moving east at 10 m/s for 10 seconds
        let mut detector = create_test_detector(1000.0, 10.0, 0.0, (0.0, 0.0));

        // Create a wave 10 seconds in the future
        detector.start_time = detector.start_time - chrono::Duration::seconds(10);
        let wave = Wave {
            id: 1,
            position: (200.0, 0.0),
            timestamp: detector.start_time + chrono::Duration::seconds(10),
        };

        let (range, azimuth) = detector.calculate_range_azimuth(&wave);

        // Detector moved 10 m/s * 10s = 100m east
        // Ship at (200, 0), detector at (100, 0)
        // Relative position: (100, 0)
        assert_approx_eq(range, 100.0, "Range should be 100m");
        assert_approx_eq(azimuth, 0.0, "Azimuth should be 0 (east)");
    }

    #[test]
    fn test_calculate_range_azimuth_with_detector_moving_north() {
        // Detector moving north at 10 m/s for 5 seconds
        let mut detector = create_test_detector(1000.0, 10.0, PI / 2.0, (0.0, 0.0));

        detector.start_time = detector.start_time - chrono::Duration::seconds(5);
        let wave = Wave {
            id: 1,
            position: (0.0, 100.0),
            timestamp: detector.start_time + chrono::Duration::seconds(5),
        };

        let (range, _azimuth) = detector.calculate_range_azimuth(&wave);

        // Detector moved 10 m/s * 5s = 50m north
        // Ship at (0, 100), detector at (0, 50)
        // Relative position: (0, 50)
        assert_approx_eq(range, 50.0, "Range should be 50m");
    }

    #[test]
    fn test_calculate_range_azimuth_complex_scenario() {
        // Detector at (4.0, -72.0), moving northeast at 5 m/s
        let mut detector = create_test_detector(1000.0, 5.0, PI / 4.0, (4.0, -72.0));

        // After 20 seconds, detector moves 100m in both x and y
        // (5 m/s * 20s * cos(45°) ≈ 70.7m east, 70.7m north)
        detector.start_time = detector.start_time - chrono::Duration::seconds(20);
        let wave = Wave {
            id: 1,
            position: (200.0, 200.0),
            timestamp: detector.start_time + chrono::Duration::seconds(20),
        };

        let (range, _azimuth) = detector.calculate_range_azimuth(&wave);

        // Detector at (70.7, 70.7), ship at (200, 200)
        // Delta: (129.3, 129.3)
        // Range: sqrt(129.3^2 + 129.3^2) ≈ 182.9m
        assert!((range - 182.9).abs() < 1.0, "Range should be ~182.9m, got {}", range);
    }
}

use super::{Plot, Track};
use chrono::{Datelike, Timelike};
use std::collections::HashMap;
use tokio::sync::mpsc::{Receiver, Sender};
use tokio::task;

/// Radar tracker for converting plots into tracks with speed and course
///
/// The tracker receives radar plots from the detector and converts them into tracks
/// by calculating speed and course from consecutive plot positions. It maintains
/// state for each ship to enable differential calculations.
///
/// # Tracking Algorithm
///
/// 1. **First Plot**: When a ship is first detected, speed and course are set to 0
/// 2. **Subsequent Plots**: Speed and course are calculated from position changes:
///    - Convert polar coordinates to Cartesian (x, y)
///    - Calculate position delta between plots
///    - Speed = distance / time_delta
///    - Course = direction of movement (radians)
///
/// # Speed Calculation
///
/// ```text
/// old_pos = (old_range * cos(old_azimuth), old_range * sin(old_azimuth))
/// new_pos = (new_range * cos(new_azimuth), new_range * sin(new_azimuth))
/// delta = new_pos - old_pos
/// distance = sqrt(delta_x² + delta_y²)
/// speed = distance / time_delta  (in meters per second)
/// ```
///
/// # Course Calculation
///
/// Course is the direction of movement in radians:
/// ```text
/// course = atan2(delta_y, delta_x)
/// ```
///
/// Course uses the same convention as azimuth:
/// - 0 rad = East
/// - π/2 rad = North
/// - π rad = West
/// - -π/2 rad = South
///
/// # Examples
///
/// ```ignore
/// use antares::radar::tracker::Tracker;
/// use tokio::sync::mpsc;
///
/// #[tokio::main]
/// async fn main() {
///     let (plot_tx, plot_rx) = mpsc::channel(100);
///     let (track_tx, mut track_rx) = mpsc::channel(100);
///
///     // Start tracker processing
///     Tracker::start(plot_rx, track_tx);
///
///     // Tracker will process plots and generate tracks
///     while let Some(track) = track_rx.recv().await {
///         println!("Track {}: speed={:.1} m/s, course={:.2} rad",
///                  track.id, track.speed, track.course);
///     }
/// }
/// ```
pub struct Tracker;

impl Tracker {
    /// Starts the tracker processing loop in a background task
    ///
    /// The tracker will continuously receive plots from the `plot_receiver` channel,
    /// calculate speed and course from consecutive positions, and send tracks to
    /// the `track_sender` channel.
    ///
    /// # State Management
    ///
    /// The tracker maintains a `HashMap` of the last plot for each ship ID. This
    /// enables differential speed/course calculations:
    /// - First plot for a ship: speed = 0, course = 0
    /// - Subsequent plots: speed/course calculated from previous plot
    ///
    /// # Arguments
    ///
    /// * `plot_receiver` - Channel to receive radar plots from detector
    /// * `track_sender` - Channel to send generated tracks
    ///
    /// # Examples
    ///
    /// ```ignore
    /// use antares::radar::tracker::Tracker;
    /// use tokio::sync::mpsc;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let (plot_tx, plot_rx) = mpsc::channel(100);
    ///     let (track_tx, mut track_rx) = mpsc::channel(100);
    ///
    ///     Tracker::start(plot_rx, track_tx);
    ///     // Tracker now processes plots in background
    ///
    ///     while let Some(track) = track_rx.recv().await {
    ///         println!("Ship {}: {:.1} m/s at {:.0}°",
    ///                  track.id, track.speed, track.course.to_degrees());
    ///     }
    /// }
    /// ```
    pub fn start(mut plot_receiver: Receiver<Plot>, track_sender: Sender<Track>) {
        task::spawn(async move {
            let mut last_plot_by_id = HashMap::new();

            while let Some(plot) = plot_receiver.recv().await {
                let (speed, course) = if let Some(last_plot) = last_plot_by_id.get(&plot.id) {
                    Tracker::calculate_speed_vector(last_plot, &plot)
                } else {
                    (0.0, 0.0)
                };

                let track = Track {
                    id: plot.id,
                    year: plot.timestamp.year() as u32,
                    month: plot.timestamp.month(),
                    day: plot.timestamp.day(),
                    hour: plot.timestamp.hour(),
                    minute: plot.timestamp.minute(),
                    second: plot.timestamp.second(),
                    millisecond: plot.timestamp.timestamp_subsec_millis(),
                    stat: "CA".to_string(),
                    type_: "TARGET".to_string(),
                    name: "".to_string(),
                    linemask: 0,
                    size: 0,
                    range: plot.range,
                    azimuth: plot.azimuth,
                    lat: plot.latitude,
                    long: plot.longitude,
                    speed,
                    course,
                    quality: 0,
                    l16quality: 0,
                    lacks: 0,
                    winrgw: 0,
                    winazw: 0.0,
                    stderr: 0.0,
                };

                if track_sender.send(track).await.is_err() {
                    eprintln!("Track sender dropped");
                    break;
                }

                last_plot_by_id.insert(plot.id, plot);
            }
        });
    }

    /// Calculates speed and course from two consecutive plots
    ///
    /// Converts polar coordinates (range/azimuth) to Cartesian coordinates,
    /// calculates the position delta, and derives speed (m/s) and course (radians).
    ///
    /// # Algorithm
    ///
    /// ```text
    /// # Convert to Cartesian
    /// old_x = old_range * cos(old_azimuth)
    /// old_y = old_range * sin(old_azimuth)
    /// new_x = new_range * cos(new_azimuth)
    /// new_y = new_range * sin(new_azimuth)
    ///
    /// # Calculate delta
    /// delta_x = new_x - old_x
    /// delta_y = new_y - old_y
    ///
    /// # Calculate speed (m/s)
    /// distance = sqrt(delta_x² + delta_y²)
    /// speed = distance / time_delta
    ///
    /// # Calculate course (radians)
    /// course = atan2(delta_y, delta_x)
    /// ```
    ///
    /// # Arguments
    ///
    /// * `old_plot` - Previous plot for this ship
    /// * `new_plot` - Current plot for this ship
    ///
    /// # Returns
    ///
    /// Tuple of (speed in m/s, course in radians)
    ///
    /// # Course Interpretation
    ///
    /// The course represents the direction the ship is moving:
    /// - Ship moving east: course ≈ 0 rad
    /// - Ship moving north: course ≈ π/2 rad
    /// - Ship moving west: course ≈ π rad
    /// - Ship moving south: course ≈ -π/2 rad
    ///
    /// Note: Course is the direction of movement, which may differ from
    /// the ship's azimuth (position relative to detector). For example,
    /// a ship at azimuth π (west of detector) moving toward the detector
    /// will have course 0 (moving east).
    fn calculate_speed_vector(old_plot: &Plot, new_plot: &Plot) -> (f64, f64) {
        let time_diff = new_plot.timestamp - old_plot.timestamp;
        let delta_x =
            new_plot.range * new_plot.azimuth.cos() - old_plot.range * old_plot.azimuth.cos();
        let delta_y =
            new_plot.range * new_plot.azimuth.sin() - old_plot.range * old_plot.azimuth.sin();
        let speed = (delta_x.powi(2) + delta_y.powi(2)).sqrt() * 1000.0
            / time_diff.num_milliseconds() as f64;
        let course = delta_y.atan2(delta_x);
        (speed, course)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
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

    fn create_plot(id: u64, range: f64, azimuth: f64, timestamp: chrono::DateTime<Utc>) -> Plot {
        Plot {
            id,
            range,
            azimuth,
            latitude: 0.0,
            longitude: 0.0,
            timestamp,
        }
    }

    #[test]
    fn test_calculate_speed_vector_no_movement() {
        // Ship at same position in both plots
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 100.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, _course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        assert_approx_eq(speed, 0.0, "Speed should be 0 for stationary ship");
    }

    #[test]
    fn test_calculate_speed_vector_moving_east() {
        // Ship moving directly east (azimuth = 0)
        // From range 100m to 200m in 1 second
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 200.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Delta x = 200 - 100 = 100m
        // Delta y = 0
        // Distance = 100m in 1s = 100 m/s
        assert_approx_eq(speed, 100.0, "Speed should be 100 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0 (east)");
    }

    #[test]
    fn test_calculate_speed_vector_moving_north() {
        // Ship moving directly north (azimuth = π/2)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, PI / 2.0, base_time);
        let plot2 = create_plot(1, 200.0, PI / 2.0, base_time + chrono::Duration::seconds(2));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Distance = 100m in 2s = 50 m/s
        assert_approx_eq(speed, 50.0, "Speed should be 50 m/s");
        assert_approx_eq(course, PI / 2.0, "Course should be π/2 (north)");
    }

    #[test]
    fn test_calculate_speed_vector_moving_west() {
        // Ship at azimuth π (west of detector), approaching detector
        let base_time = Utc::now();
        let plot1 = create_plot(1, 200.0, PI, base_time);
        let plot2 = create_plot(1, 100.0, PI, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Ship is west of detector but moving toward it (east)
        // old position: (200*cos(π), 200*sin(π)) = (-200, 0)
        // new position: (100*cos(π), 100*sin(π)) = (-100, 0)
        // delta: (100, 0) - moving east toward detector
        assert_approx_eq(speed, 100.0, "Speed should be 100 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0 (moving east, toward detector)");
    }

    #[test]
    fn test_calculate_speed_vector_moving_south() {
        // Ship at azimuth -π/2 (south of detector), approaching detector
        let base_time = Utc::now();
        let plot1 = create_plot(1, 200.0, -PI / 2.0, base_time);
        let plot2 = create_plot(1, 100.0, -PI / 2.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Ship is south of detector but moving toward it (north)
        // old position: (0, -200)
        // new position: (0, -100)
        // delta: (0, 100) - moving north toward detector
        assert_approx_eq(speed, 100.0, "Speed should be 100 m/s");
        assert_approx_eq(course, PI / 2.0, "Course should be π/2 (moving north, toward detector)");
    }

    #[test]
    fn test_calculate_speed_vector_diagonal_movement() {
        // Ship moving northeast (45 degrees)
        // From (100m, 0°) to (100m, 45°)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 100.0, PI / 4.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // old position: (100, 0)
        // new position: (100*cos(45°), 100*sin(45°)) = (70.7, 70.7)
        // delta: (-29.3, 70.7)
        // distance: sqrt(29.3^2 + 70.7^2) ≈ 76.5m
        assert!((speed - 76.5).abs() < 1.0, "Speed should be ~76.5 m/s, got {}", speed);
        // course: atan2(70.7, -29.3) ≈ 1.96 rad (112°)
        assert!((course - 1.96).abs() < 0.1, "Course should be ~1.96 rad, got {}", course);
    }

    #[test]
    fn test_calculate_speed_vector_with_range_and_azimuth_change() {
        // Ship changing both range and azimuth
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 150.0, PI / 6.0, base_time + chrono::Duration::seconds(1));

        let (speed, _course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // old position: (100, 0)
        // new position: (150*cos(30°), 150*sin(30°)) = (129.9, 75)
        // delta: (29.9, 75)
        // distance: sqrt(29.9^2 + 75^2) ≈ 80.7m
        assert!((speed - 80.7).abs() < 1.0, "Speed should be ~80.7 m/s, got {}", speed);
    }

    #[test]
    fn test_calculate_speed_vector_with_millisecond_precision() {
        // Test with millisecond time delta
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        // 100ms delta
        let plot2 = create_plot(
            1,
            110.0,
            0.0,
            base_time + chrono::Duration::milliseconds(100),
        );

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Distance = 10m in 0.1s = 100 m/s
        assert_approx_eq(speed, 100.0, "Speed should be 100 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }

    #[test]
    fn test_calculate_speed_vector_with_long_time_delta() {
        // Test with longer time delta (10 seconds)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 200.0, 0.0, base_time + chrono::Duration::seconds(10));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Distance = 100m in 10s = 10 m/s
        assert_approx_eq(speed, 10.0, "Speed should be 10 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }

    #[test]
    fn test_calculate_speed_vector_slow_movement() {
        // Very slow movement (1 m/s)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 101.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        assert_approx_eq(speed, 1.0, "Speed should be 1 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }

    #[test]
    fn test_calculate_speed_vector_fast_movement() {
        // Very fast movement (500 m/s)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 600.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        assert_approx_eq(speed, 500.0, "Speed should be 500 m/s");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }

    #[test]
    fn test_calculate_speed_vector_approaching_detector() {
        // Ship approaching detector (range decreasing)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 200.0, 0.0, base_time);
        let plot2 = create_plot(1, 100.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // Distance = 100m in 1s = 100 m/s
        // Course pointing toward detector (west, π)
        assert_approx_eq(speed, 100.0, "Speed should be 100 m/s");
        assert_approx_eq(course, PI, "Course should be π (toward detector)");
    }

    #[test]
    fn test_calculate_speed_vector_circular_motion() {
        // Ship in circular motion around detector
        // Moving from 0° to 90° at constant range
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 100.0, PI / 2.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // old position: (100, 0)
        // new position: (0, 100)
        // delta: (-100, 100)
        // distance: sqrt(100^2 + 100^2) = 141.42m
        assert!((speed - 141.42).abs() < 0.5, "Speed should be ~141.42 m/s, got {}", speed);
        // course: atan2(100, -100) = 3π/4 (135°)
        assert!((course - 3.0 * PI / 4.0).abs() < 0.01, "Course should be 3π/4, got {}", course);
    }

    #[test]
    fn test_calculate_speed_vector_with_different_ship_ids() {
        // Different ship IDs (should still calculate correctly)
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(2, 200.0, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        // IDs don't matter for calculation
        assert_approx_eq(speed, 100.0, "Speed calculation should ignore IDs");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }

    #[test]
    fn test_calculate_speed_vector_realistic_ship_speed() {
        // Realistic ship speed: 10 knots ≈ 5.14 m/s
        // Move 5.14m in 1 second
        let base_time = Utc::now();
        let plot1 = create_plot(1, 100.0, 0.0, base_time);
        let plot2 = create_plot(1, 105.14, 0.0, base_time + chrono::Duration::seconds(1));

        let (speed, course) = Tracker::calculate_speed_vector(&plot1, &plot2);

        assert!((speed - 5.14).abs() < 0.01, "Speed should be ~5.14 m/s (10 knots)");
        assert_approx_eq(course, 0.0, "Course should be 0");
    }
}

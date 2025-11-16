use super::{MovementCommand, MovementStrategy};
use std::f64::consts::PI;

/// Circular movement strategy for patrol patterns
///
/// Ships using this strategy move in a circle at constant speed. The angle increments
/// each time step based on the arc length traveled divided by the radius, maintaining
/// mathematically correct circular motion.
///
/// # Parameters
///
/// - `radius`: Circle radius in meters
/// - `speed`: Movement speed in meters per second (m/s)
/// - `time_delta`: Time step in milliseconds between updates
///
/// # Physics
///
/// The angle increment per time step is calculated as:
/// ```text
/// distance = speed * (time_delta / 1000.0)
/// angle_step = distance / radius
/// current_angle = (current_angle + angle_step) % (2π)
/// ```ignore
///
/// # Examples
///
/// ```ignore
/// use antares::simulation::movement::{CircleMovement, MovementStrategy};
///
/// // Create a ship moving in a 100m radius circle at 10 m/s, updating every 100ms
/// let mut movement = CircleMovement::new(100.0, 10.0, 100);
///
/// // Each call advances the angle based on arc length
/// let cmd1 = movement.next_movement();
/// let cmd2 = movement.next_movement();
///
/// assert!(cmd2.angle > cmd1.angle); // Angle increases
/// assert_eq!(cmd1.speed, 10.0); // Speed remains constant
/// ```
pub struct CircleMovement {
    /// Movement speed in meters per second
    speed: f64,
    /// Circle radius in meters
    radius: f64,
    /// Time step in milliseconds
    time_delta: u64,
    /// Current angle position in radians (0 to 2π)
    current_angle: f64,
}

impl CircleMovement {
    /// Creates a new circular movement strategy
    ///
    /// # Arguments
    ///
    /// * `radius` - Circle radius in meters (must be > 0)
    /// * `speed` - Movement speed in meters per second
    /// * `time_delta` - Time step in milliseconds between movement updates
    ///
    /// # Examples
    ///
    /// ```ignore
    /// use antares::simulation::movement::CircleMovement;
    ///
    /// // 50m radius, 5 m/s speed, 20ms time steps
    /// let movement = CircleMovement::new(50.0, 5.0, 20);
    /// ```
    pub fn new(radius: f64, speed: f64, time_delta: u64) -> Self {
        CircleMovement {
            speed,
            radius,
            time_delta,
            current_angle: 0.0,
        }
    }
}

impl MovementStrategy for CircleMovement {
    fn next_movement(&mut self) -> MovementCommand {
        let time_step = self.time_delta as f64 / 1000.0;
        let distance = self.speed * time_step;
        let angle_step = distance / self.radius;
        self.current_angle = (self.current_angle + angle_step) % (2.0 * PI);

        MovementCommand {
            angle: self.current_angle,
            speed: self.speed,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const EPSILON: f64 = 1e-10;

    fn assert_approx_eq(a: f64, b: f64, msg: &str) {
        assert!((a - b).abs() < EPSILON, "{}: expected {}, got {}", msg, b, a);
    }

    #[test]
    fn test_circle_movement_creates_with_given_values() {
        let movement = CircleMovement::new(100.0, 10.0, 20);
        assert_eq!(movement.radius, 100.0);
        assert_eq!(movement.speed, 10.0);
        assert_eq!(movement.time_delta, 20);
        assert_eq!(movement.current_angle, 0.0);
    }

    #[test]
    fn test_circle_movement_starts_at_zero_angle() {
        let mut movement = CircleMovement::new(50.0, 5.0, 100);
        let cmd = movement.next_movement();

        // First call should start from 0 and increment
        assert!(cmd.angle > 0.0);
    }

    #[test]
    fn test_circle_movement_angle_increments() {
        let mut movement = CircleMovement::new(100.0, 10.0, 100);

        let cmd1 = movement.next_movement();
        let cmd2 = movement.next_movement();

        // Second angle should be larger than first
        assert!(cmd2.angle > cmd1.angle);
    }

    #[test]
    fn test_circle_movement_wraps_at_2pi() {
        // Large speed and small radius to quickly complete a circle
        let mut movement = CircleMovement::new(1.0, 100.0, 100);

        // Call many times to go past 2π
        for _ in 0..100 {
            movement.next_movement();
        }

        let final_cmd = movement.next_movement();

        // Angle should be wrapped within [0, 2π)
        assert!(final_cmd.angle >= 0.0);
        assert!(final_cmd.angle < 2.0 * PI);
    }

    #[test]
    fn test_circle_movement_speed_constant() {
        let mut movement = CircleMovement::new(50.0, 15.0, 50);

        for _ in 0..10 {
            let cmd = movement.next_movement();
            assert_eq!(cmd.speed, 15.0);
        }
    }

    #[test]
    fn test_circle_movement_angle_step_calculation() {
        // radius=100, speed=10, time_delta=100ms (0.1s)
        // distance = 10 * 0.1 = 1.0
        // angle_step = 1.0 / 100 = 0.01 radians
        let mut movement = CircleMovement::new(100.0, 10.0, 100);
        let cmd = movement.next_movement();

        assert_approx_eq(cmd.angle, 0.01, "First angle step");
    }

    #[test]
    fn test_circle_movement_full_circle() {
        // Set up parameters to complete exactly one circle
        // radius=10, speed=10, time_delta=1000ms (1s)
        // circumference = 2π * 10 = ~62.83
        // distance per step = 10 * 1 = 10
        // steps for full circle = 62.83 / 10 ≈ 6.28 steps
        let mut movement = CircleMovement::new(10.0, 10.0, 1000);

        let mut last_angle = 0.0;
        for _ in 0..7 {
            let cmd = movement.next_movement();
            last_angle = cmd.angle;
        }

        // Should have wrapped around and be close to starting position
        assert!(last_angle < 1.0, "Should have wrapped close to zero");
    }

    #[test]
    fn test_circle_movement_with_large_radius() {
        let mut movement = CircleMovement::new(10000.0, 5.0, 100);
        let cmd = movement.next_movement();

        // Large radius means small angle changes
        assert!(cmd.angle < 0.001);
    }

    #[test]
    fn test_circle_movement_with_small_radius() {
        let mut movement = CircleMovement::new(1.0, 10.0, 100);
        let cmd = movement.next_movement();

        // Small radius means large angle changes
        assert!(cmd.angle > 0.5);
    }

    #[test]
    fn test_circle_movement_with_zero_speed() {
        let mut movement = CircleMovement::new(100.0, 0.0, 100);

        let cmd1 = movement.next_movement();
        let cmd2 = movement.next_movement();

        // Zero speed means no angle change
        assert_eq!(cmd1.angle, 0.0);
        assert_eq!(cmd2.angle, 0.0);
    }

    #[test]
    fn test_circle_movement_time_delta_affects_angle() {
        let mut movement1 = CircleMovement::new(100.0, 10.0, 100); // 100ms
        let mut movement2 = CircleMovement::new(100.0, 10.0, 200); // 200ms

        let cmd1 = movement1.next_movement();
        let cmd2 = movement2.next_movement();

        // Larger time delta should produce larger angle step
        assert!(cmd2.angle > cmd1.angle);
        assert_approx_eq(cmd2.angle, cmd1.angle * 2.0, "Double time = double angle");
    }

    #[test]
    fn test_circle_movement_consistency() {
        let mut movement = CircleMovement::new(50.0, 20.0, 50);

        let mut angles = Vec::new();
        for _ in 0..5 {
            let cmd = movement.next_movement();
            angles.push(cmd.angle);
        }

        // Each step should increment by the same amount (before wrapping)
        let diff1 = angles[1] - angles[0];
        let diff2 = angles[2] - angles[1];
        let diff3 = angles[3] - angles[2];
        let diff4 = angles[4] - angles[3];

        assert_approx_eq(diff1, diff2, "Step 1-2 vs 2-3");
        assert_approx_eq(diff2, diff3, "Step 2-3 vs 3-4");
        assert_approx_eq(diff3, diff4, "Step 3-4 vs 4-5");
    }
}

use super::{MovementCommand, MovementStrategy};

/// Linear movement strategy with constant heading and speed
///
/// Ships using this strategy move in a straight line at a constant speed and angle.
/// This is the simplest movement pattern, useful for simulating ships on a steady course.
///
/// # Parameters
///
/// - `angle`: Movement direction in radians (0 = East, π/2 = North, π = West, 3π/2 = South)
/// - `speed`: Movement speed in meters per second (m/s)
///
/// # Examples
///
/// ```ignore
/// use antares::simulation::movement::{LineMovement, MovementStrategy};
/// use std::f64::consts::PI;
///
/// // Create a ship moving north at 10 m/s
/// let mut movement = LineMovement::new(PI / 2.0, 10.0);
/// let cmd = movement.next_movement();
///
/// assert_eq!(cmd.angle, PI / 2.0);
/// assert_eq!(cmd.speed, 10.0);
/// ```
pub struct LineMovement {
    /// Movement direction in radians
    angle: f64,
    /// Movement speed in meters per second
    speed: f64,
}

impl LineMovement {
    /// Creates a new linear movement strategy
    ///
    /// # Arguments
    ///
    /// * `angle` - Movement direction in radians
    /// * `speed` - Movement speed in meters per second
    ///
    /// # Examples
    ///
    /// ```ignore
    /// use antares::simulation::movement::LineMovement;
    /// use std::f64::consts::PI;
    ///
    /// let movement = LineMovement::new(PI / 4.0, 15.0); // Northeast at 15 m/s
    /// ```
    pub fn new(angle: f64, speed: f64) -> Self {
        LineMovement { angle, speed }
    }
}

impl MovementStrategy for LineMovement {
    fn next_movement(&mut self) -> MovementCommand {
        MovementCommand {
            angle: self.angle,
            speed: self.speed,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    #[test]
    fn test_line_movement_creates_with_given_values() {
        let movement = LineMovement::new(PI / 4.0, 10.0);
        assert_eq!(movement.angle, PI / 4.0);
        assert_eq!(movement.speed, 10.0);
    }

    #[test]
    fn test_line_movement_returns_constant_values() {
        let mut movement = LineMovement::new(PI / 2.0, 15.0);

        // Call multiple times - should always return same values
        let cmd1 = movement.next_movement();
        let cmd2 = movement.next_movement();
        let cmd3 = movement.next_movement();

        assert_eq!(cmd1.angle, PI / 2.0);
        assert_eq!(cmd1.speed, 15.0);
        assert_eq!(cmd2.angle, PI / 2.0);
        assert_eq!(cmd2.speed, 15.0);
        assert_eq!(cmd3.angle, PI / 2.0);
        assert_eq!(cmd3.speed, 15.0);
    }

    #[test]
    fn test_line_movement_with_zero_speed() {
        let mut movement = LineMovement::new(0.0, 0.0);
        let cmd = movement.next_movement();

        assert_eq!(cmd.angle, 0.0);
        assert_eq!(cmd.speed, 0.0);
    }

    #[test]
    fn test_line_movement_with_full_rotation() {
        let mut movement = LineMovement::new(2.0 * PI, 5.0);
        let cmd = movement.next_movement();

        assert_eq!(cmd.angle, 2.0 * PI);
        assert_eq!(cmd.speed, 5.0);
    }

    #[test]
    fn test_line_movement_with_negative_angle() {
        let mut movement = LineMovement::new(-PI / 4.0, 10.0);
        let cmd = movement.next_movement();

        assert_eq!(cmd.angle, -PI / 4.0);
        assert_eq!(cmd.speed, 10.0);
    }

    #[test]
    fn test_line_movement_with_high_speed() {
        let mut movement = LineMovement::new(PI, 1000.0);
        let cmd = movement.next_movement();

        assert_eq!(cmd.angle, PI);
        assert_eq!(cmd.speed, 1000.0);
    }
}

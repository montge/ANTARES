use super::{MovementCommand, MovementStrategy};
use rand::Rng;
use std::f64::consts::PI;

pub struct RandomMovement {
    max_speed: f64,
}

impl RandomMovement {
    pub fn new(max_speed: f64) -> RandomMovement {
        RandomMovement { max_speed }
    }
}

impl MovementStrategy for RandomMovement {
    fn next_movement(&mut self) -> MovementCommand {
        let mut rng = rand::thread_rng();
        let angle = rng.gen_range(0.0..(2.0 * PI));
        let speed = rng.gen_range(0.0..self.max_speed);
        MovementCommand { angle, speed }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_movement_creates_with_max_speed() {
        let movement = RandomMovement::new(25.0);
        assert_eq!(movement.max_speed, 25.0);
    }

    #[test]
    fn test_random_movement_angle_within_bounds() {
        let mut movement = RandomMovement::new(10.0);

        for _ in 0..100 {
            let cmd = movement.next_movement();
            assert!(cmd.angle >= 0.0, "Angle should be >= 0");
            assert!(cmd.angle < 2.0 * PI, "Angle should be < 2π");
        }
    }

    #[test]
    fn test_random_movement_speed_within_bounds() {
        let mut movement = RandomMovement::new(15.0);

        for _ in 0..100 {
            let cmd = movement.next_movement();
            assert!(cmd.speed >= 0.0, "Speed should be >= 0");
            assert!(cmd.speed < 15.0, "Speed should be < max_speed");
        }
    }

    #[test]
    fn test_random_movement_respects_max_speed() {
        let max_speeds = vec![1.0, 10.0, 50.0, 100.0, 1000.0];

        for max_speed in max_speeds {
            let mut movement = RandomMovement::new(max_speed);

            for _ in 0..50 {
                let cmd = movement.next_movement();
                assert!(
                    cmd.speed < max_speed,
                    "Speed {} should be < max_speed {}",
                    cmd.speed,
                    max_speed
                );
            }
        }
    }

    #[test]
    fn test_random_movement_produces_different_values() {
        let mut movement = RandomMovement::new(20.0);

        let cmd1 = movement.next_movement();
        let cmd2 = movement.next_movement();

        // With high probability, two random values should be different
        // This test might occasionally fail due to randomness, but probability is very low
        let is_different = cmd1.angle != cmd2.angle || cmd1.speed != cmd2.speed;
        assert!(is_different, "Random movements should produce different values");
    }

    #[test]
    fn test_random_movement_with_small_max_speed() {
        let mut movement = RandomMovement::new(0.1);

        for _ in 0..50 {
            let cmd = movement.next_movement();
            assert!(cmd.speed >= 0.0);
            assert!(cmd.speed < 0.1);
        }
    }

    #[test]
    fn test_random_movement_with_large_max_speed() {
        let mut movement = RandomMovement::new(10000.0);

        for _ in 0..50 {
            let cmd = movement.next_movement();
            assert!(cmd.speed >= 0.0);
            assert!(cmd.speed < 10000.0);
        }
    }

    #[test]
    fn test_random_movement_statistical_distribution() {
        let mut movement = RandomMovement::new(100.0);
        let sample_size = 1000;

        let mut angle_samples = Vec::new();
        let mut speed_samples = Vec::new();

        for _ in 0..sample_size {
            let cmd = movement.next_movement();
            angle_samples.push(cmd.angle);
            speed_samples.push(cmd.speed);
        }

        // Calculate average angle (should be around π)
        let avg_angle: f64 = angle_samples.iter().sum::<f64>() / sample_size as f64;
        assert!(
            avg_angle > 2.0 && avg_angle < 4.5,
            "Average angle {} should be roughly around π ({})",
            avg_angle,
            PI
        );

        // Calculate average speed (should be around max_speed/2)
        let avg_speed: f64 = speed_samples.iter().sum::<f64>() / sample_size as f64;
        assert!(
            avg_speed > 30.0 && avg_speed < 70.0,
            "Average speed {} should be roughly around 50",
            avg_speed
        );

        // Check that we have good distribution (not all the same value)
        let min_angle = angle_samples.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_angle = angle_samples.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let angle_range = max_angle - min_angle;
        assert!(
            angle_range > 5.0,
            "Angle range {} should be substantial",
            angle_range
        );

        let min_speed = speed_samples.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_speed = speed_samples.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let speed_range = max_speed - min_speed;
        assert!(
            speed_range > 50.0,
            "Speed range {} should be substantial",
            speed_range
        );
    }

    #[test]
    fn test_random_movement_multiple_instances_independent() {
        let mut movement1 = RandomMovement::new(10.0);
        let mut movement2 = RandomMovement::new(10.0);

        let cmd1 = movement1.next_movement();
        let cmd2 = movement2.next_movement();

        // Two independent instances should (very likely) produce different values
        let is_different = cmd1.angle != cmd2.angle || cmd1.speed != cmd2.speed;
        assert!(
            is_different,
            "Independent random movement instances should produce different values"
        );
    }
}

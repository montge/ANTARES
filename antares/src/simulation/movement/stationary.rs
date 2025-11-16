use super::{MovementCommand, MovementStrategy};

pub struct StationaryMovement;

impl MovementStrategy for StationaryMovement {
    fn next_movement(&mut self) -> MovementCommand {
        MovementCommand {
            angle: 0.0,
            speed: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stationary_movement_returns_zero_values() {
        let mut movement = StationaryMovement;
        let cmd = movement.next_movement();

        assert_eq!(cmd.angle, 0.0);
        assert_eq!(cmd.speed, 0.0);
    }

    #[test]
    fn test_stationary_movement_always_returns_same_values() {
        let mut movement = StationaryMovement;

        for _ in 0..100 {
            let cmd = movement.next_movement();
            assert_eq!(cmd.angle, 0.0);
            assert_eq!(cmd.speed, 0.0);
        }
    }

    #[test]
    fn test_stationary_movement_no_state_changes() {
        let mut movement = StationaryMovement;

        let cmd1 = movement.next_movement();
        let cmd2 = movement.next_movement();
        let cmd3 = movement.next_movement();

        // All commands should be identical
        assert_eq!(cmd1.angle, cmd2.angle);
        assert_eq!(cmd1.speed, cmd2.speed);
        assert_eq!(cmd2.angle, cmd3.angle);
        assert_eq!(cmd2.speed, cmd3.speed);
    }
}

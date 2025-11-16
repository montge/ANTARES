use super::{Emitter, MovementStrategy, Wave};

/// Simulated ship with movement and wave emission capabilities
///
/// A ship represents a radar target in the simulation. Each ship has:
/// - A unique identifier
/// - A current position in Cartesian coordinates (meters)
/// - A movement strategy (line, circle, random, stationary)
/// - The ability to emit radar waves at regular intervals
///
/// # Movement
///
/// Ships update their position based on their movement strategy at each simulation tick.
/// The position update calculation uses:
/// ```text
/// time_delta = emission_interval / 1000.0  (convert ms to seconds)
/// dx = speed * cos(angle) * time_delta
/// dy = speed * sin(angle) * time_delta
/// new_position = (x + dx, y + dy)
/// ```
///
/// # Wave Emission
///
/// Ships emit waves that represent radar reflections. Each wave contains:
/// - Ship ID (for tracking)
/// - Current position
/// - Emission timestamp
///
/// # Examples
///
/// Ships are typically created via `ShipConfig` and the simulation's `add_ship` method
/// rather than constructed directly. See `Simulation::add_ship` for usage examples.
pub struct Ship {
    /// Unique ship identifier (assigned by simulation)
    pub id: u64,
    /// Current position in meters as (x, y) where x=east, y=north
    pub position: (f64, f64),
    /// Emission interval in milliseconds (time between position updates)
    pub emission_interval: u64,
    /// Movement strategy determining how the ship moves
    pub movement_strategy: Box<dyn MovementStrategy>,
}

impl Ship {
    /// Updates the ship's position based on its movement strategy
    ///
    /// Queries the movement strategy for the next movement command (speed and angle),
    /// then calculates the position delta based on the emission interval and updates
    /// the ship's position.
    ///
    /// # Position Calculation
    ///
    /// ```text
    /// movement_command = strategy.next_movement()
    /// time_delta = emission_interval / 1000.0  (ms to seconds)
    /// dx = speed * cos(angle) * time_delta  (meters east)
    /// dy = speed * sin(angle) * time_delta  (meters north)
    /// position = position + (dx, dy)
    /// ```
    ///
    /// # Timing
    ///
    /// This method should be called once per emission interval (typically every 20-100ms).
    /// The simulation manages calling this method at the correct frequency.
    pub fn update(&mut self) {
        let (x, y) = self.position;
        let movement_command = self.movement_strategy.next_movement();
        let emission_interval = self.emission_interval as f64;
        let dx = movement_command.speed * movement_command.angle.cos() * emission_interval / 1000.0;
        let dy = movement_command.speed * movement_command.angle.sin() * emission_interval / 1000.0;
        self.position = (x + dx, y + dy);
    }
}

impl Emitter for Ship {
    /// Emits a wave containing the ship's current state
    ///
    /// Creates a wave emission that represents a radar reflection from this ship.
    /// The wave contains the ship's ID, current position, and emission timestamp.
    ///
    /// # Returns
    ///
    /// A `Wave` struct with:
    /// - `id`: This ship's unique identifier
    /// - `position`: Current position in meters (x, y)
    /// - `timestamp`: Current UTC time
    ///
    /// # Examples
    ///
    /// ```ignore
    /// # use antares::simulation::emitters::{Ship, Emitter};
    /// # use antares::simulation::movement::StationaryMovement;
    /// # let mut ship = Ship {
    /// #     id: 1,
    /// #     position: (100.0, 200.0),
    /// #     emission_interval: 50,
    /// #     movement_strategy: Box::new(StationaryMovement),
    /// # };
    /// let wave = ship.emit();
    /// println!("Ship {} at ({:.1}, {:.1})", wave.id, wave.position.0, wave.position.1);
    /// ```
    fn emit(&self) -> Wave {
        Wave {
            id: self.id,
            position: self.position,
            timestamp: chrono::Utc::now(),
        }
    }
}

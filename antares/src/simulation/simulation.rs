use std::sync::Arc;
use tokio::sync::{mpsc::Sender, RwLock};

use super::{build_ship_from_config, Emitter, Ship, ShipConfig, SimulationConfig, Wave};

/// Simulation engine for managing ship movements and wave emissions
///
/// The simulation manages a collection of ships, each with their own movement strategy.
/// It periodically updates ship positions and emits wave signals that represent radar
/// reflections. The simulation runs in a background task with configurable update intervals.
///
/// # Architecture
///
/// - **Ships**: Thread-safe collection of ships protected by RwLock
/// - **Emission Interval**: Configurable update frequency in milliseconds
/// - **Wave Emissions**: Ships emit waves at each tick representing their position
/// - **Concurrent Access**: Ships can be added/removed during runtime
///
/// # Timing
///
/// The simulation uses a ticker with the configured emission interval:
/// - Each tick: All ships update position and emit waves
/// - Waves sent to detector via channel
/// - Configurable interval (typically 20-100ms)
///
/// # Examples
///
/// ```no_run
/// use antares::simulation::{Simulation, SimulationConfig};
/// use tokio::sync::mpsc;
///
/// #[tokio::main]
/// async fn main() {
///     let config = SimulationConfig {
///         emission_interval: 50,  // 50ms = 20 Hz update rate
///         initial_ships: vec![],
///         controller_bind_addr: "127.0.0.1:17394".to_string(),
///     };
///
///     let simulation = Simulation::new(config);
///     let (wave_tx, wave_rx) = mpsc::channel(100);
///
///     // Start simulation in background
///     simulation.start(wave_tx).await;
///
///     // Simulation now runs continuously, emitting waves
/// }
/// ```
pub struct Simulation {
    /// Thread-safe collection of ships in the simulation
    ships: Arc<RwLock<Vec<Ship>>>,
    /// Emission interval in milliseconds (update frequency)
    emission_interval: u64,
}

impl Simulation {
    /// Creates a new simulation with the given configuration
    ///
    /// Initializes the simulation with any ships specified in the configuration.
    /// Ships are assigned sequential IDs starting from 0.
    ///
    /// # Arguments
    ///
    /// * `config` - Simulation configuration containing emission interval and initial ships
    ///
    /// # Examples
    ///
    /// ```
    /// use antares::simulation::{Simulation, SimulationConfig};
    ///
    /// let config = SimulationConfig {
    ///     emission_interval: 50,
    ///     initial_ships: vec![],
    ///     controller_bind_addr: "127.0.0.1:17394".to_string(),
    /// };
    /// let simulation = Simulation::new(config);
    /// ```
    pub fn new(config: SimulationConfig) -> Self {
        let ships = config
            .initial_ships
            .into_iter()
            .enumerate()
            .map(|(i, ship_config)| {
                build_ship_from_config(i as u64, ship_config, config.emission_interval)
            })
            .collect();

        Self {
            ships: Arc::new(RwLock::new(ships)),
            emission_interval: config.emission_interval,
        }
    }

    /// Resets the simulation by removing all ships
    ///
    /// This operation runs asynchronously in a background task. After reset,
    /// the simulation continues running but with no ships until new ones are added.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use antares::simulation::{Simulation, SimulationConfig};
    /// # let config = SimulationConfig::default();
    /// # let simulation = Simulation::new(config);
    /// // Remove all ships from simulation
    /// simulation.reset();
    /// ```
    pub fn reset(&self) {
        let ships = Arc::clone(&self.ships);
        tokio::spawn(async move {
            ships.write().await.clear();
        });
    }

    /// Adds a new ship to the simulation at runtime
    ///
    /// The ship is assigned an ID based on the current number of ships.
    /// The ship immediately begins moving according to its configured strategy
    /// and emitting waves at the simulation's emission interval.
    ///
    /// This operation runs asynchronously in a background task, so it returns
    /// immediately without blocking.
    ///
    /// # Arguments
    ///
    /// * `config` - Ship configuration specifying type, position, and movement parameters
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use antares::simulation::{Simulation, SimulationConfig, ShipConfig};
    /// # use antares::simulation::movement::ShipType;
    /// # let sim_config = SimulationConfig::default();
    /// # let simulation = Simulation::new(sim_config);
    /// use std::f64::consts::PI;
    ///
    /// // Add a ship moving north at 10 m/s
    /// let ship_config = ShipConfig {
    ///     ship_type: ShipType::Line {
    ///         angle: PI / 2.0,
    ///         speed: 10.0,
    ///     },
    ///     initial_position: (100.0, 0.0),  // 100m east, 0m north
    /// };
    /// simulation.add_ship(ship_config);
    /// ```
    pub fn add_ship(&self, config: ShipConfig) {
        let ships = Arc::clone(&self.ships);
        let interval = self.emission_interval;

        tokio::spawn(async move {
            let mut ships_guard = ships.write().await;
            let new_id = ships_guard.len() as u64;
            let ship = build_ship_from_config(new_id, config, interval);
            ships_guard.push(ship);
        });
    }

    /// Starts the simulation loop in a background task
    ///
    /// The simulation runs continuously with the configured emission interval:
    /// 1. Each tick: All ships emit waves and update their positions
    /// 2. Waves are sent to the detector via the provided channel
    /// 3. Loop continues until the wave sender channel is closed
    ///
    /// # Timing Behavior
    ///
    /// - Emission interval determines update frequency (e.g., 50ms = 20 Hz)
    /// - All ships update synchronously at each tick
    /// - First tick occurs after one interval period
    ///
    /// # Arguments
    ///
    /// * `wave_sender` - Channel to send wave emissions to the detector
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use antares::simulation::{Simulation, SimulationConfig};
    /// use tokio::sync::mpsc;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = SimulationConfig {
    ///         emission_interval: 50,
    ///         initial_ships: vec![],
    ///         controller_bind_addr: "127.0.0.1:17394".to_string(),
    ///     };
    ///     let simulation = Simulation::new(config);
    ///
    ///     let (wave_tx, mut wave_rx) = mpsc::channel(100);
    ///
    ///     // Start simulation
    ///     simulation.start(wave_tx).await;
    ///
    ///     // Receive waves from ships
    ///     while let Some(wave) = wave_rx.recv().await {
    ///         println!("Wave from ship {}: ({:.1}, {:.1})",
    ///                  wave.id, wave.position.0, wave.position.1);
    ///     }
    /// }
    /// ```
    pub async fn start(&self, wave_sender: Sender<Wave>) {
        let ships = self.ships.clone();
        let interval = tokio::time::Duration::from_millis(self.emission_interval);
        let mut ticker = tokio::time::interval(interval);

        tokio::spawn(async move {
            loop {
                ticker.tick().await;

                let mut ships_guard = ships.write().await;
                let mut waves = Vec::with_capacity(ships_guard.len());

                for ship in ships_guard.iter_mut() {
                    let wave = ship.emit();
                    ship.update();
                    waves.push(wave);
                }

                for wave in waves {
                    if wave_sender.send(wave).await.is_err() {
                        break;
                    }
                }
            }
        });
    }
}

//! Controller module for coordinating simulation and radar systems
//!
//! The controller manages the lifecycle of the ANTARES radar simulation system,
//! orchestrating communication between the simulation engine and radar detector/tracker.
//! It provides a unified interface for starting, stopping, and configuring the system.
//!
//! # Architecture
//!
//! The controller creates and manages three main components:
//! - **Simulation**: Generates ship movements and wave emissions
//! - **Radar**: Detects waves and tracks ship positions
//! - **Communication**: Channels connecting simulation to radar
//!
//! # Data Flow
//!
//! ```text
//! Simulation → [Wave Channel] → Detector → [Plot Channel] → Tracker → [Track Channel] → Clients
//! ```
//!
//! # Examples
//!
//! ```no_run
//! use antares::{Config, Controller};
//! use std::sync::Arc;
//!
//! #[tokio::main]
//! async fn main() {
//!     // Load configuration
//!     let config = Config::default();
//!
//!     // Create and start controller
//!     let controller = Arc::new(Controller::new(config));
//!     controller.run().await;
//!
//!     // System now runs continuously
//!     // Keep main thread alive
//!     tokio::signal::ctrl_c().await.unwrap();
//! }
//! ```

use super::{Config, Radar, ShipConfig, Simulation};
use std::sync::Arc;
use tokio::sync::mpsc;

/// Central controller for the ANTARES radar simulation system
///
/// The controller coordinates the simulation engine and radar system, managing
/// their lifecycle and providing a unified API for runtime control. It handles:
/// - System initialization from configuration
/// - Starting simulation and radar in background tasks
/// - Adding/removing ships during runtime
/// - Resetting the simulation state
/// - Providing configuration access
///
/// # Thread Safety
///
/// The controller uses `Arc` for shared ownership of simulation and radar components,
/// enabling safe concurrent access from multiple tasks or API handlers.
///
/// # Examples
///
/// ```no_run
/// use antares::{Config, Controller};
/// use std::sync::Arc;
///
/// #[tokio::main]
/// async fn main() {
///     let config = Config::default();
///     let controller = Arc::new(Controller::new(config));
///
///     // Start the system
///     controller.run().await;
///
///     // Add ships at runtime (from another task/handler)
///     // controller.add_ship(ship_config);
/// }
/// ```
pub struct Controller {
    /// System configuration (simulation, radar, security)
    config: Config,
    /// Radar detector and tracker (shared via Arc for concurrent access)
    radar: Arc<Radar>,
    /// Simulation engine (shared via Arc for concurrent access)
    simulation: Arc<Simulation>,
}

impl Controller {
    /// Creates a new controller with the given configuration
    ///
    /// Initializes the simulation and radar systems with their respective
    /// configurations. No background tasks are started until `run()` is called.
    ///
    /// # Arguments
    ///
    /// * `config` - System configuration containing simulation, radar, and security settings
    ///
    /// # Examples
    ///
    /// ```
    /// use antares::{Config, Controller};
    ///
    /// let config = Config::default();
    /// let controller = Controller::new(config);
    /// ```
    pub fn new(config: Config) -> Controller {
        Controller {
            config: config.clone(),
            radar: Arc::new(Radar::new(config.antares.radar)),
            simulation: Arc::new(Simulation::new(config.antares.simulation)),
        }
    }

    /// Starts the simulation and radar systems in background tasks
    ///
    /// Creates a communication channel between simulation and radar, then spawns:
    /// 1. Simulation task: Generates ship movements and emits waves
    /// 2. Radar task: Detects waves, tracks ships, and broadcasts results
    ///
    /// Both tasks run indefinitely until the system is shut down.
    ///
    /// # Channel Communication
    ///
    /// - **Wave Channel**: Connects simulation to radar detector (buffer: 100)
    /// - **Plot Channel**: Internal radar communication (detector → tracker)
    /// - **Track Channel**: Internal radar communication (tracker → broadcaster)
    ///
    /// # Task Lifecycle
    ///
    /// Tasks continue running until:
    /// - A channel is closed (sender/receiver dropped)
    /// - The task encounters an error
    /// - The process is terminated
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use antares::{Config, Controller};
    /// use std::sync::Arc;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = Config::default();
    ///     let controller = Arc::new(Controller::new(config));
    ///
    ///     // Start the system
    ///     controller.run().await;
    ///
    ///     // System now runs in background
    ///     tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
    /// }
    /// ```
    pub async fn run(&self) {
        let (wave_sender, wave_receiver) = mpsc::channel(100);

        let simulation = Arc::clone(&self.simulation);
        let radar = Arc::clone(&self.radar);

        tokio::spawn(async move {
            simulation.start(wave_sender).await;
        });

        tokio::spawn(async move {
            radar.start(wave_receiver).await;
        });
    }

    /// Resets the simulation by removing all ships
    ///
    /// Clears all ships from the simulation while keeping the radar and
    /// communication systems running. New ships can be added after reset
    /// using `add_ship()`.
    ///
    /// This operation is asynchronous and returns immediately. The actual
    /// reset happens in a background task.
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use antares::{Config, Controller};
    /// # use std::sync::Arc;
    /// # let config = Config::default();
    /// # let controller = Arc::new(Controller::new(config));
    /// // Remove all ships from simulation
    /// controller.reset_simulation();
    ///
    /// // Add new ships as needed
    /// // controller.add_ship(ship_config);
    /// ```
    pub fn reset_simulation(&self) {
        self.simulation.reset();
    }

    /// Adds a new ship to the simulation at runtime
    ///
    /// Creates and adds a ship with the specified configuration. The ship
    /// immediately begins moving according to its strategy and emitting waves
    /// at the simulation's emission interval.
    ///
    /// This operation is asynchronous and returns immediately. The ship is
    /// added in a background task.
    ///
    /// # Arguments
    ///
    /// * `ship_data` - Ship configuration specifying type, position, and movement parameters
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use antares::{Config, Controller, ShipConfig};
    /// # use antares::simulation::movement::ShipType;
    /// # use std::sync::Arc;
    /// # let config = Config::default();
    /// # let controller = Arc::new(Controller::new(config));
    /// use std::f64::consts::PI;
    ///
    /// // Add a stationary ship at (100m, 50m)
    /// let ship = ShipConfig {
    ///     ship_type: ShipType::Stationary,
    ///     initial_position: (100.0, 50.0),
    /// };
    /// controller.add_ship(ship);
    ///
    /// // Add a ship moving in a circle
    /// let ship = ShipConfig {
    ///     ship_type: ShipType::Circle {
    ///         radius: 200.0,
    ///         speed: 10.0,
    ///     },
    ///     initial_position: (0.0, 0.0),
    /// };
    /// controller.add_ship(ship);
    /// ```
    pub fn add_ship(&self, ship_data: ShipConfig) {
        self.simulation.add_ship(ship_data);
    }

    /// Returns a copy of the system configuration
    ///
    /// Provides access to the configuration used to initialize the controller.
    /// This includes simulation, radar, and security settings.
    ///
    /// # Returns
    ///
    /// A cloned copy of the `Config` struct
    ///
    /// # Examples
    ///
    /// ```
    /// # use antares::{Config, Controller};
    /// # let config = Config::default();
    /// # let controller = Controller::new(config);
    /// let current_config = controller.get_config();
    /// println!("Emission interval: {}ms",
    ///          current_config.antares.simulation.emission_interval);
    /// ```
    pub fn get_config(&self) -> Config {
        self.config.clone()
    }
}

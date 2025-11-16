//! # ANTARES Radar Simulation Library
//!
//! `antares` is a high-performance library for simulating naval radar systems, ship movements,
//! and radar detection/tracking. It provides a complete simulation environment for testing
//! radar algorithms, visualization tools, and data processing pipelines.
//!
//! ## Features
//!
//! - **Real-time Simulation**: High-performance Rust implementation with async/await
//! - **Multiple Movement Patterns**: Line, circle, random, and stationary ship movements
//! - **Radar Detection**: Configurable range, position-based detection with coordinate transformations
//! - **Track Management**: Automatic speed/course calculation and track state persistence
//! - **Multiple Output Formats**: TCP streaming and WebSocket broadcasting
//! - **REST API Control**: HTTP endpoints for runtime simulation control
//!
//! ## Example
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
//!     // Create controller and start simulation
//!     let controller = Arc::new(Controller::new(config));
//!     controller.run().await;
//! }
//! ```
//!
//! ## Architecture
//!
//! The library is organized into four main modules:
//!
//! - [`config`]: Configuration structures for simulation and radar parameters
//! - [`controller`]: Runtime control and API endpoints
//! - [`simulation`]: Ship movement and wave emission
//! - [`radar`]: Detection, tracking, and broadcasting
//!

mod config;
mod controller;
mod radar;
mod simulation;

use radar::{Radar, RadarConfig};
use simulation::{Simulation, SimulationConfig, Wave};

pub use config::Config;
pub use controller::Controller;
pub use simulation::ShipConfig;

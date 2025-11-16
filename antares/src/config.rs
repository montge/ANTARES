//! # Configuration Module
//!
//! This module provides configuration structures for the ANTARES simulation system.
//! Configuration can be loaded from TOML files or created programmatically.
//!
//! ## Example
//!
//! ```toml
//! [antares.simulation]
//! emission_interval = 20
//! controller_bind_addr = "127.0.0.1:17394"
//!
//! [antares.radar]
//! bind_addr = "127.0.0.1:17396"
//!
//! [antares.radar.detector]
//! range = 1000.0
//! speed = 0.0
//! angle = 0.0
//! start_coordinates = [4.0, -72.0]
//!
//! [antares.security]
//! cors_allowed_origins = "http://localhost:8080"
//! enable_security_headers = true
//! ```
//!
//! Load configuration from file:
//!
//! ```no_run
//! use antares::Config;
//! use std::fs;
//!
//! let content = fs::read_to_string("config.toml").expect("Failed to read config");
//! let config: Config = toml::from_str(&content).expect("Failed to parse config");
//! ```
//!

use super::{RadarConfig, SimulationConfig};
use serde::{Deserialize, Serialize};

/// Root configuration structure for ANTARES
///
/// This is the top-level configuration that contains all subsystem configurations.
/// It can be deserialized from TOML or created with default values.
///
/// # Examples
///
/// ```
/// use antares::Config;
///
/// // Create with defaults
/// let config = Config::default();
/// ```
#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Config {
    /// ANTARES subsystem configurations
    pub antares: AntaresConfig,
}

/// ANTARES subsystem configuration container
///
/// Contains configurations for the simulation engine, radar system, and security settings.
#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct AntaresConfig {
    /// Simulation engine configuration (ships, movement, wave emission)
    pub simulation: SimulationConfig,

    /// Radar system configuration (detection, tracking, broadcasting)
    pub radar: RadarConfig,

    /// Security configuration (CORS, headers, authentication)
    #[serde(default)]
    pub security: SecurityConfig,
}

/// Security configuration for the ANTARES API server
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SecurityConfig {
    /// Allowed CORS origins (comma-separated list)
    /// Use "*" for any origin (NOT RECOMMENDED for production)
    /// Examples: "http://localhost:8080", "http://localhost:8080,https://example.com"
    pub cors_allowed_origins: String,

    /// Whether to enable security headers
    pub enable_security_headers: bool,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        SecurityConfig {
            // Default to localhost only for security
            cors_allowed_origins: "http://localhost:8080".to_string(),
            enable_security_headers: true,
        }
    }
}

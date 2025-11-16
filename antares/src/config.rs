//! # Config module
//!
//! This module contains the configuration struct for the simulation and radar.
//! The configuration is loaded from a TOML file.
//!

use super::{RadarConfig, SimulationConfig};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Config {
    pub antares: AntaresConfig,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct AntaresConfig {
    pub simulation: SimulationConfig,
    pub radar: RadarConfig,
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

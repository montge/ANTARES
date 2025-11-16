use antares::{Config, Controller, ShipConfig};
use axum::{
    extract::State,
    http::{header, HeaderValue, Method},
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use std::{fs, net::SocketAddr, process, sync::Arc};
use tower_http::{cors::CorsLayer, set_header::SetResponseHeaderLayer};

#[derive(Parser)]
#[command(author, version, about)]
struct Args {
    #[arg(long)]
    config: Option<String>,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let config = match args.config {
        Some(path) => {
            let content = fs::read_to_string(&path).unwrap_or_else(|err| {
                eprintln!("❌ Error reading config file '{path}': {err}");
                eprintln!("💡 Make sure the file exists and you have read permissions.");
                process::exit(1);
            });

            toml::from_str(&content).unwrap_or_else(|err| {
                eprintln!("❌ Error parsing config file: {err}");
                eprintln!("💡 Check that the TOML syntax is correct.");
                process::exit(1);
            })
        }
        None => Config::default(),
    };

    let controller_config = config.clone();
    let controller = Arc::new(Controller::new(controller_config));

    controller.run().await;

    // Configure CORS based on security settings
    let cors = build_cors_layer(&config.antares.security.cors_allowed_origins);

    let mut app = Router::new()
        .route("/simulation/config", get(get_config))
        .route("/simulation/reset", post(reset_simulation))
        .route("/simulation/ships", post(add_ship))
        .layer(cors)
        .with_state(controller);

    // Add security headers if enabled
    if config.antares.security.enable_security_headers {
        app = app
            .layer(SetResponseHeaderLayer::if_not_present(
                header::X_CONTENT_TYPE_OPTIONS,
                HeaderValue::from_static("nosniff"),
            ))
            .layer(SetResponseHeaderLayer::if_not_present(
                header::X_FRAME_OPTIONS,
                HeaderValue::from_static("DENY"),
            ))
            .layer(SetResponseHeaderLayer::if_not_present(
                axum::http::HeaderName::from_static("x-xss-protection"),
                HeaderValue::from_static("1; mode=block"),
            ));
    }

    let addr: SocketAddr = config
        .antares
        .simulation
        .controller_bind_addr
        .parse()
        .unwrap_or_else(|err| {
            eprintln!(
                "❌ Invalid bind address '{}': {err}",
                config.antares.simulation.controller_bind_addr
            );
            eprintln!("💡 Use format 'IP:PORT' (e.g., '127.0.0.1:17394')");
            process::exit(1);
        });

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|err| {
            eprintln!("❌ Failed to bind to {addr}: {err}");
            eprintln!("💡 The port might already be in use or you don't have permission.");
            eprintln!("💡 Try a different port or check if another ANTARES instance is running.");
            process::exit(1);
        });

    println!("🚢 Controller server running on {addr}");

    tokio::select! {
        result = axum::serve(listener, app.into_make_service()) => {
            if let Err(err) = result {
                eprintln!("Server error: {err}");
            }
        }
        _ = tokio::signal::ctrl_c() => {
            println!("🛑 Received Ctrl+C, shutting down...");
        }
    }
}

#[axum::debug_handler]
async fn get_config(State(controller): State<Arc<Controller>>) -> Json<Config> {
    Json(controller.get_config())
}

async fn reset_simulation(State(controller): State<Arc<Controller>>) {
    controller.reset_simulation();
}

async fn add_ship(State(controller): State<Arc<Controller>>, Json(payload): Json<ShipConfig>) {
    controller.add_ship(payload);
}

/// Builds a CORS layer based on the allowed origins configuration
///
/// # Arguments
/// * `allowed_origins` - Comma-separated list of allowed origins, or "*" for any origin
///
/// # Security Note
/// Using "*" allows any website to make requests to your API and is NOT recommended
/// for production. Always specify explicit origins in production environments.
fn build_cors_layer(allowed_origins: &str) -> CorsLayer {
    let mut cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    if allowed_origins == "*" {
        eprintln!("⚠️  WARNING: CORS is configured to allow ALL origins (*)");
        eprintln!("⚠️  This is a security risk! Set specific origins in production.");
        cors = cors.allow_origin(tower_http::cors::Any);
    } else {
        // Parse comma-separated origins
        let origins: Vec<HeaderValue> = allowed_origins
            .split(',')
            .filter_map(|origin| {
                let trimmed = origin.trim();
                match trimmed.parse::<HeaderValue>() {
                    Ok(header_val) => Some(header_val),
                    Err(err) => {
                        eprintln!("⚠️  Warning: Invalid CORS origin '{trimmed}': {err}");
                        None
                    }
                }
            })
            .collect();

        if origins.is_empty() {
            eprintln!(
                "⚠️  Warning: No valid CORS origins configured, defaulting to localhost:8080"
            );
            cors = cors.allow_origin("http://localhost:8080".parse::<HeaderValue>().unwrap());
        } else {
            cors = cors.allow_origin(origins);
        }
    }

    cors
}

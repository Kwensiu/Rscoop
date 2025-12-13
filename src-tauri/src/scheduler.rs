use tauri::{AppHandle, Emitter, Manager};
use crate::commands;
use crate::state;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub fn start_background_tasks(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Helper to parse interval string into seconds
        let parse_interval = |val: &str| -> Option<u64> {
            match val {
                "24h" | "1d" => Some(86400),
                "7d" | "1w" => Some(604800),
                "1h" => Some(3600),
                "6h" => Some(21600),
                off if off == "off" => None,
                custom if custom.starts_with("custom:") => custom[7..].parse::<u64>().ok(),
                numeric => numeric.parse::<u64>().ok(),
            }
        };

        loop {
            // Read interval each loop so changes apply promptly
            let interval_raw = commands::settings::get_config_value(
                app.clone(),
                "buckets.autoUpdateInterval".to_string(),
            )
            .ok()
            .flatten()
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "off".to_string());

            let interval_secs_opt = parse_interval(&interval_raw);
            if interval_secs_opt.is_none() {
                // Off: poll more frequently for changes
                log::trace!("[scheduler] interval='off' polling again in 30s");
                tokio::time::sleep(Duration::from_secs(30)).await;
                continue;
            }
            let interval_secs = interval_secs_opt.unwrap();

            // Load last run timestamp
            let last_ts_val = commands::settings::get_config_value(
                app.clone(),
                "buckets.lastAutoUpdateTs".to_string(),
            )
            .ok()
            .flatten();
            let last_ts = last_ts_val
                .and_then(|v| v.as_u64())
                .unwrap_or(0u64);

            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            let elapsed = if last_ts == 0 { interval_secs } else { now.saturating_sub(last_ts) };

            if last_ts == 0 {
                log::trace!("[scheduler] no previous run recorded; treating as overdue");
            }

            if elapsed >= interval_secs {
                log::info!("Auto bucket update task running (interval='{}', seconds={}, elapsed={})", interval_raw, interval_secs, elapsed);
                let run_started_at = now;
                
                // Check if silent auto update is enabled
                let silent_auto_update = commands::settings::get_config_value(
                    app.clone(),
                    "buckets.silentUpdateEnabled".to_string(),
                )
                .ok()
                .flatten()
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
                
                // Emit start event to show modal (only if not in silent mode)
                if !silent_auto_update {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("auto-operation-start", "Updating buckets...");
                        let _ = window.emit("operation-output", serde_json::json!({
                            "line": "Starting automatic bucket update...",
                            "source": "stdout"
                        }));
                    }
                } else {
                    log::info!("Running silent auto update - no UI notifications will be shown");
                }
                
                // Get AppState instance to pass to update_all_buckets
                let state = app.state::<state::AppState>();
                match commands::bucket_install::update_all_buckets(state).await {
                    Ok(results) => {
                        let successes = results.iter().filter(|r| r.success).count();
                        log::info!(
                            "Auto bucket update completed: {} successes / {} total",
                            successes,
                            results.len()
                        );
                        
                        // Prepare details for log entry
                        let mut update_details = Vec::new();
                        for result in &results {
                            let detail = if result.success {
                                format!("✓ Updated bucket: {}", result.bucket_name)
                            } else {
                                format!("✗ Failed to update {}: {}", result.bucket_name, result.message)
                            };
                            update_details.push(detail.clone());
                        }
                        
                        // Create bucket update log entry
                        let operation_result = if successes == results.len() {
                            "success"
                        } else if successes > 0 {
                            "partial"
                        } else {
                            "failed"
                        };
                        
                        let bucket_log_entry = crate::commands::update_log::UpdateLogEntry {
                            timestamp: chrono::Utc::now(),
                            operation_type: "bucket".to_string(),
                            operation_result: operation_result.to_string(),
                            success_count: successes as u32,
                            total_count: results.len() as u32,
                            details: update_details,
                        };
                        
                        // Add to log store if enabled
                        if let Err(e) = crate::commands::update_log::add_log_entry_if_enabled(&app, bucket_log_entry).await {
                            log::error!("Failed to save bucket update log: {}", e);
                        }
                        
                        // Stream results to modal (only if not in silent mode)
                        if !silent_auto_update {
                            if let Some(window) = app.get_webview_window("main") {
                                for result in &results {
                                    let line = if result.success {
                                        format!("✓ Updated bucket: {}", result.bucket_name)
                                    } else {
                                        format!("✗ Failed to update {}: {}", result.bucket_name, result.message)
                                    };
                                    let _ = window.emit("operation-output", serde_json::json!({
                                        "line": line,
                                        "source": if result.success { "stdout" } else { "stderr" }
                                    }));
                                }
                                let _ = window.emit("operation-finished", serde_json::json!({
                                    "success": successes == results.len(),
                                    "message": format!("Bucket update completed: {} of {} succeeded", successes, results.len())
                                }));
                            }
                        } else {
                            // 在静默模式下记录结果到日志
                            for result in &results {
                                if result.success {
                                    log::info!("✓ Updated bucket: {}", result.bucket_name);
                                } else {
                                    log::warn!("✗ Failed to update {}: {}", result.bucket_name, result.message);
                                }
                            }
                            log::info!("Silent bucket update completed: {} of {} succeeded", successes, results.len());
                        }
                        
                        // Persist last run timestamp (record even if partial successes to avoid hammering)
                        let _ = commands::settings::set_config_value(
                            app.clone(),
                            "buckets.lastAutoUpdateTs".to_string(),
                            serde_json::json!(run_started_at),
                        );

                        // After buckets update, optionally run package updates
                        let auto_update_packages = commands::settings::get_config_value(
                            app.clone(),
                            "buckets.autoUpdatePackagesEnabled".to_string(),
                        )
                        .ok()
                        .flatten()
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                        if auto_update_packages {
                            log::info!("Auto package update task running after bucket refresh (headless with events)");
                            let state = app.state::<state::AppState>();
                            let mut package_update_logs = Vec::new();
                            
                            // Emit start event for package update (with silent mode support)
                            if !silent_auto_update {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.emit("auto-operation-start", "Updating packages...");
                                    let _ = window.emit("operation-output", serde_json::json!({
                                        "line": "Starting automatic package update...",
                                        "source": "stdout"
                                    }));
                                }
                            }
                            
                            match commands::update::update_all_packages_headless(app.clone(), state).await {
                                Ok(update_details) => {
                                    package_update_logs = update_details;
                                    
                                    // Emit package update completion only if not silent update
                                    if !silent_auto_update {
                                        if let Some(window) = app.get_webview_window("main") {
                                            for line in &package_update_logs {
                                                let _ = window.emit("operation-output", serde_json::json!({
                                                    "line": line,
                                                    "source": "stdout"
                                                }));
                                            }
                                            let _ = window.emit("operation-finished", serde_json::json!({
                                                "success": true,
                                                "message": "Automatic package update completed successfully"
                                            }));
                                        }
                                    }
                                    
                                    // Count successful updates
                                    let success_count = package_update_logs.iter()
                                        .filter(|line| line.contains("Updated") && !line.contains("up to date"))
                                        .count() as u32;
                                    
                                    // Create package update log entry
                                    use crate::commands::update_log::UpdateLogEntry;
                                    let package_log_entry = UpdateLogEntry {
                                        timestamp: chrono::Utc::now(),
                                        operation_type: "package".to_string(),
                                        operation_result: "success".to_string(),
                                        success_count: if success_count == 0 { 1 } else { success_count },
                                        total_count: if package_update_logs.len() == 0 { 1 } else { package_update_logs.len() as u32 },
                                        details: package_update_logs,
                                    };
                                    
                                    // Add to log store if enabled
                                    if let Err(e) = crate::commands::update_log::add_log_entry_if_enabled(&app, package_log_entry).await {
                                        log::error!("Failed to save package update log: {}", e);
                                    }
                                }
                                Err(e) => {
                                    log::warn!("Auto package headless update failed: {}", e);
                                    let log_line = format!("Error: {}", e);
                                    package_update_logs.push(log_line.clone());
                                    
                                    // Emit failure to modal (only if not in silent mode)
                                    if !silent_auto_update {
                                        if let Some(window) = app.get_webview_window("main") {
                                            let _ = window.emit("operation-output", serde_json::json!({
                                                "line": log_line.clone(),
                                                "source": "stderr"
                                            }));
                                            let _ = window.emit("operation-finished", serde_json::json!({
                                                "success": false,
                                                "message": format!("Automatic package update failed: {}", e)
                                            }));
                                        }
                                    }
                                    
                                    // Create error log entry
                                    use crate::commands::update_log::UpdateLogEntry;
                                    let error_log_entry = UpdateLogEntry {
                                        timestamp: chrono::Utc::now(),
                                        operation_type: "package".to_string(),
                                        operation_result: "failed".to_string(),
                                        success_count: 0,
                                        total_count: 1,
                                        details: package_update_logs,
                                    };
                                    
                                    // Add to log store if enabled
                                    if let Err(e) = crate::commands::update_log::add_log_entry_if_enabled(&app, error_log_entry).await {
                                        log::error!("Failed to save package update error log: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        log::warn!("Auto bucket update failed: {}", e);
                        
                        // Emit failure to modal (only if not in silent mode)
                        if !silent_auto_update {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("operation-output", serde_json::json!({
                                    "line": format!("Error: {}", e),
                                    "source": "stderr"
                                }));
                                let _ = window.emit("operation-finished", serde_json::json!({
                                    "success": false,
                                    "message": format!("Bucket update failed: {}", e)
                                }));
                            }
                        } else {
                            log::warn!("Silent bucket update failed: {}", e);
                        }
                        
                        // Even on failure, set timestamp to avoid rapid retry storms
                        let _ = commands::settings::set_config_value(
                            app.clone(),
                            "buckets.lastAutoUpdateTs".to_string(),
                            serde_json::json!(run_started_at),
                        );
                    }
                }
                // Loop again immediately to compute next run
            } else {
                // Sleep until the next check (but not longer than 1 hour to stay responsive to setting changes)
                let sleep_secs = interval_secs.saturating_sub(elapsed).min(3600);
                log::trace!("[scheduler] sleeping for {} seconds", sleep_secs);
                tokio::time::sleep(Duration::from_secs(sleep_secs)).await;
            }
        }
    });
}
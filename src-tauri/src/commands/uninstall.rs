//! Commands for uninstalling packages and clearing the cache.
use crate::commands::auto_cleanup::trigger_auto_cleanup;
use crate::commands::installed::invalidate_installed_cache;
use crate::commands::scoop::{self, ScoopOp};
use crate::commands::search::invalidate_manifest_cache;
use crate::state::AppState;
use tauri::{AppHandle, State, Window};

/// Uninstalls a Scoop package.
///
/// Note: The `bucket` parameter is not used by the underlying `scoop uninstall` command
/// but is included for API consistency and logging purposes.
///
/// # Arguments
/// * `window` - The Tauri window to emit events to.
/// * `package_name` - The name of package to uninstall.
/// * `bucket` - The bucket package belongs to (for logging purposes).
#[tauri::command]
pub async fn uninstall_package(
    window: Window,
    app: AppHandle,
    state: State<'_, AppState>,
    package_name: String,
    bucket: String,
) -> Result<(), String> {
    execute_package_operation(
        window.clone(),
        ScoopOp::Uninstall,
        &package_name,
        Some(&bucket),
    )
    .await?;
    invalidate_manifest_cache().await;
    invalidate_installed_cache(state.clone()).await;

    // Trigger auto cleanup after uninstall
    trigger_auto_cleanup(app, state).await;

    Ok(())
}

/// Clears the cache for a Scoop package.
///
/// Note: The `bucket` parameter is not used by the underlying `scoop cache rm` command
/// but is included for API consistency and logging purposes.
///
/// # Arguments
/// * `window` - The Tauri window to emit events to.
/// * `package_name` - The name of the package to clear the cache for.
/// * `bucket` - The bucket the package belongs to (for logging purposes).
#[tauri::command]
pub async fn clear_package_cache(
    window: Window,
    app: AppHandle,
    state: State<'_, AppState>,
    package_name: String,
    bucket: String,
) -> Result<(), String> {
    execute_package_operation(
        window,
        ScoopOp::ClearCache,
        &package_name,
        Some(&bucket),
    )
    .await?;

    // Trigger auto cleanup after clearing cache
    trigger_auto_cleanup(app, state).await;

    Ok(())
}

/// A helper function to execute a Scoop operation on a package.
///
/// This function handles the common logic for parsing the bucket, logging the operation,
/// and calling the underlying `execute_scoop` function.
async fn execute_package_operation(
    window: Window,
    op: ScoopOp,
    package: &str,
    bucket: Option<&str>,
) -> Result<(), String> {
    log::info!(
        "Executing {} for package '{}' from bucket '{}'",
        match op {
            ScoopOp::Install => "installing",
            ScoopOp::Uninstall => "uninstalling",
            ScoopOp::Update => "updating",
            ScoopOp::UpdateForce => "force updating",
            ScoopOp::ClearCache => "clearing cache for",
            ScoopOp::UpdateAll => "updating all",
        },
        package,
        bucket.unwrap_or("default")
    );

    let operation_id = Some(format!("{}-{}-{}", match op {
        ScoopOp::Install => "install",
        ScoopOp::Uninstall => "uninstall",
        ScoopOp::Update => "update",
        ScoopOp::UpdateForce => "force-update",
        ScoopOp::ClearCache => "clear-cache",
        ScoopOp::UpdateAll => "update-all",
    }, package, std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()));

    // Pass the bucket option along; `execute_scoop` will handle whether it's used.
    scoop::execute_scoop(window, op, Some(package), bucket, operation_id).await
}

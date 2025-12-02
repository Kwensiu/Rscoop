import { Download, RefreshCw, Github, BookOpen } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import pkgJson from "../../../../package.json";
import { t } from "../../../i18n";

export interface AboutSectionRef {
  checkForUpdates: (manual: boolean) => Promise<void>;
}

export interface AboutSectionProps {
  ref: (ref: AboutSectionRef) => void;
  isScoopInstalled?: boolean;
}


export default function AboutSection(props: AboutSectionProps) {
  const [updateStatus, setUpdateStatus] = createSignal<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = createSignal<Update | null>(null);
  const [updateError, setUpdateError] = createSignal<string | null>(null);
  const [downloadProgress, setDownloadProgress] = createSignal<{ downloaded: number; total: number | null }>({ downloaded: 0, total: null });

  const checkForUpdates = async (manual: boolean) => {
    try {
      // Don't check for updates if installed via Scoop
      if (props.isScoopInstalled) {
        if (manual) {
          await message(t("settings.about.update_via_scoop"), {
            title: t("settings.about.updates_via_scoop"),
            kind: "info"
          });
        }
        return;
      }

      setUpdateStatus('checking');
      setUpdateError(null);

      const update = await check();

      if (update?.available) {
        setUpdateStatus('available');
        setUpdateInfo(update);

        // Only show dialog if user manually clicked "Check for updates"
        if (manual) {
          const shouldInstall = await ask(
            t("settings.about.update_available_dialog", { version: update.version, body: update.body || 'No release notes provided' }),
            {
              title: t("settings.about.update_available"),
              kind: "info",
              okLabel: t("buttons.install"),
              cancelLabel: t("buttons.cancel")
            }
          );

          if (shouldInstall) {
            await installAvailableUpdate();
          }
        }
      } else {
        setUpdateStatus('idle');
        if (manual) {
          await message(t("settings.about.latest_version"), {
            title: t("settings.about.no_updates_available"),
            kind: "info"
          });
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateStatus('error');
      setUpdateError(error instanceof Error ? error.message : String(error));
    }
  };

  const installAvailableUpdate = async () => {
    try {
      const currentUpdateInfo = updateInfo();
      if (!currentUpdateInfo) {
        throw new Error("No update information available");
      }

      setUpdateStatus('downloading');
      setDownloadProgress({ downloaded: 0, total: null });

      // Download and install the update with progress reporting
      await currentUpdateInfo.downloadAndInstall((progress) => {
        if (progress.event === 'Started') {
          setDownloadProgress({
            downloaded: 0,
            total: progress.data.contentLength || null
          });
        } else if (progress.event === 'Progress') {
          setDownloadProgress(prev => ({
            downloaded: prev.downloaded + (progress.data.chunkLength || 0),
            total: prev.total
          }));
        } else if (progress.event === 'Finished') {
          setUpdateStatus('installing');
        }
      });

      // Restart the app after successful installation
      await ask(
        t("settings.about.update_complete"),
        {
          title: t("buttons.confirm"),
          kind: "info",
          okLabel: t("settings.about.restart_now")
        }
      );

      await relaunch();
    } catch (error) {
      console.error('Failed to install update:', error);
      setUpdateStatus('error');
      setUpdateError(error instanceof Error ? error.message : String(error));
    }
  };

  props.ref({ checkForUpdates });

  return (
    <div class="card bg-base-200 shadow-xl overflow-hidden">
      {/* Hero Section */}
      <div class="bg-base-300 p-8 flex flex-col items-center text-center space-y-4">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Rscoop-Fork</h2>
          <p class="text-base-content/60 font-medium">v{pkgJson.version}</p>
        </div>
        <p class="max-w-md  leading-relaxed">
          {t("settings.about.description")}
        </p>
        <p class="text-sm text-base-content/60 mt-2">
          {t("settings.about.customized_version")}
        </p>
        <p class="text-sm text-base-content/60">
          {t("settings.about.please_report_issues")}
        </p>

      </div>

      <div class="card-body p-6 space-y-8">

        {/* Update Section */}
        <div class="bg-base-100 rounded-xl p-5 border border-base-content/5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="font-semibold flex items-center gap-2">
              <RefreshCw class="w-4 h-4 text-base-content/70" />
              {t("settings.about.update_status")}
            </div>
            {props.isScoopInstalled && (
              <span class="badge badge-sm badge-info badge-outline">{t("settings.about.managed_by_scoop")}</span>
            )}
          </div>

          {props.isScoopInstalled ? (
            <div class="alert alert-info text-sm shadow-sm">
              <span>{t("settings.about.scoop_update_instruction", { code: "scoop update rscoop" })}</span>
            </div>
          ) : (
            <div class="space-y-4">
              {updateStatus() === 'idle' && (
                <div class="flex items-center justify-between">
                  <span class="text-sm text-base-content/70">{t("settings.about.check_now")}</span>
                  <button
                    class="btn btn-sm btn-primary"
                    onClick={() => checkForUpdates(true)}
                  >
                    {t("settings.about.check_now")}
                  </button>
                </div>
              )}

              {updateStatus() === 'checking' && (
                <div class="flex items-center justify-center py-2 text-base-content/70">
                  <span class="loading loading-spinner loading-sm mr-3"></span>
                  {t("settings.about.checking_for_updates")}
                </div>
              )}

              {updateStatus() === 'available' && (
                <div class="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div class="alert alert-success shadow-sm">
                    <Download class="w-5 h-5" />
                    <div>
                      <h3 class="font-bold">{t("settings.about.update_available")}</h3>
                      <div class="text-xs">{t("settings.about.update_ready", { version: updateInfo()?.version })}</div>
                    </div>
                    <button class="btn btn-sm" onClick={installAvailableUpdate}>{t("buttons.install")}</button>
                  </div>
                  <Show when={updateInfo()?.body}>
                    <div class="bg-base-200 rounded-lg p-3 text-xs max-h-32 overflow-y-auto border border-base-content/5">
                      <div class="font-bold mb-1 opacity-70">{t("settings.about.release_notes")}</div>
                      <div class="whitespace-pre-wrap opacity-80">{updateInfo()?.body}</div>
                    </div>
                  </Show>
                </div>
              )}

              {updateStatus() === 'downloading' && (
                <div class="space-y-2">
                  <div class="flex justify-between text-xs font-medium">
                    <span>{t("settings.about.downloading_update")}</span>
                    <span>{downloadProgress().total
                      ? `${Math.round((downloadProgress().downloaded / (downloadProgress().total || 1)) * 100)}%`
                      : '...'}</span>
                  </div>
                  <progress
                    class="progress progress-primary w-full"
                    value={downloadProgress().downloaded}
                    max={downloadProgress().total || 100}
                  />
                </div>
              )}

              {updateStatus() === 'installing' && (
                <div class="flex items-center justify-center py-2 text-success font-medium">
                  <span class="loading loading-spinner loading-sm mr-3"></span>
                  {t("settings.about.installing_update")}
                </div>
              )}

              {updateStatus() === 'error' && (
                <div class="alert alert-error shadow-sm">
                  <div class="flex-1">
                    <div class="font-bold text-xs">{t("settings.about.update_failed")}</div>
                    <div class="text-xs opacity-80">{updateError()}</div>
                  </div>
                  <button class="btn btn-xs btn-outline" onClick={() => checkForUpdates(true)}>{t("settings.about.retry")}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Links */}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            class="btn btn-outline hover:bg-base-content hover:text-base-100 transition-all"
            onClick={() => openUrl('https://github.com/Kwensiu/Rscoop/').catch(console.error)}
          >
            <Github class="w-5 h-5" />
            {t("settings.about.my_fork")}
          </button>
          <button
            class="btn btn-outline hover:bg-base-content hover:text-base-100 transition-all"
            onClick={() => openUrl('https://github.com/AmarBego/Rscoop').catch(console.error)}
          >
            <Github class="w-5 h-5" />
            {t("settings.about.upstream")}
          </button>

          <button
            class="btn btn-outline btn-info hover:text-info-content transition-all"
            onClick={() => openUrl('https://amarbego.github.io/Rscoop/').catch(console.error)}
          >
            <BookOpen class="w-5 h-5" />
            {t("settings.about.docs")}
          </button>

        </div>

        {/* Footer */}
        <div class="text-center text-xs text-base-content/30 pt-4">
          <p>Copyright © {new Date().getFullYear()} AmarBego / Kwensiu. MIT License.</p>
        </div>
      </div>
    </div>
  );
}
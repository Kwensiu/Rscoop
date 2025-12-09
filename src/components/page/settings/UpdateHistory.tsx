import { createSignal, onMount, Show, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { History, RefreshCw, X } from "lucide-solid";
import Card from "../../common/Card";
import { t } from "../../../i18n";

interface UpdateLogEntry {
    timestamp: string;
    operation_type: string;
    operation_result: string;
    success_count: number;
    total_count: number;
    details: string[];
}

export default function UpdateHistory() {
    const [logs, setLogs] = createSignal<UpdateLogEntry[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [selectedLog, setSelectedLog] = createSignal<UpdateLogEntry | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedLogs = await invoke<UpdateLogEntry[]>("get_update_logs", { limit: 50 });
            setLogs(fetchedLogs);
        } catch (e) {
            setError(t("settings.update_history.fetch_error"));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch {
            return timestamp;
        }
    };

    const getStatusColor = (result: string) => {
        switch (result) {
            case "success":
                return "text-success";
            case "partial":
                return "text-warning";
            case "failed":
                return "text-error";
            default:
                return "";
        }
    };

    const getStatusIcon = (result: string) => {
        switch (result) {
            case "success":
                return "✓";
            case "partial":
                return "⚠";
            case "failed":
                return "✗";
            default:
                return "";
        }
    };

    const getOperationTypeText = (type: string) => {
        switch (type) {
            case "bucket":
                return t("settings.update_history.bucket_update");
            case "package":
                return t("settings.update_history.package_update");
            default:
                return type;
        }
    };

    const getResultText = (result: string) => {
        switch (result) {
            case "success":
                return t("settings.update_history.success");
            case "partial":
                return t("settings.update_history.partial");
            case "failed":
                return t("settings.update_history.failed");
            default:
                return result;
        }
    };

    onMount(() => {
        fetchLogs();
    });

    return (
        <Card
            title={t("settings.update_history.title")}
            icon={History}
            headerAction={
                <button
                    class="btn btn-sm btn-outline"
                    disabled={loading()}
                    onClick={fetchLogs}
                >
                    <RefreshCw class="w-4 h-4" />
                </button>
            }
        >
            <div class="overflow-x-auto">
                <Show when={loading()}>
                    <div class="flex justify-center py-8">
                        <span class="loading loading-spinner loading-lg"></span>
                    </div>
                </Show>

                <Show when={error()}>
                    <div class="alert alert-error">{error()}</div>
                </Show>

                <Show when={!loading() && !error() && logs().length === 0}>
                    <div class="py-8 text-center opacity-70">
                        {t("settings.update_history.no_logs")}
                    </div>
                </Show>

                <Show when={!loading() && !error() && logs().length > 0}>
                    <table class="table table-compact w-full">
                        <thead>
                            <tr>
                                <th>{t("settings.update_history.time")}</th>
                                <th>{t("settings.update_history.type")}</th>
                                <th>{t("settings.update_history.result")}</th>
                                <th>{t("settings.update_history.details")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={logs()}>
                                {(log) => (
                                    <tr>
                                        <td>{formatDate(log.timestamp)}</td>
                                        <td>{getOperationTypeText(log.operation_type)}</td>
                                        <td>
                                            <span class={`${getStatusColor(log.operation_result)} font-medium`}>
                                                {getStatusIcon(log.operation_result)} {getResultText(log.operation_result)}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                class="btn btn-xs btn-ghost"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                {t("settings.update_history.view_details")}
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </Show>
            </div>

            {/* Details Modal */}
            <Show when={selectedLog()}>
                <div class="modal modal-open">
                    <div class="modal-box w-11/12 max-w-2xl">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold">{t("settings.update_history.details_title")}</h3>
                            <button
                                class="btn btn-sm btn-circle btn-ghost"
                                onClick={() => setSelectedLog(null)}
                            >
                                <X class="w-4 h-4" />
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <span class="font-medium">{t("settings.update_history.time")}: </span>
                                <span>{formatDate(selectedLog()!.timestamp)}</span>
                            </div>
                            <div>
                                <span class="font-medium">{t("settings.update_history.type")}: </span>
                                <span>{getOperationTypeText(selectedLog()!.operation_type)}</span>
                            </div>
                            <div>
                                <span class="font-medium">{t("settings.update_history.result")}: </span>
                                <span class={`${getStatusColor(selectedLog()!.operation_result)} font-medium`}>
                                    {getResultText(selectedLog()!.operation_result)}
                                </span>
                            </div>
                            <div>
                                <span class="font-medium">{t("settings.update_history.success_rate")}: </span>
                                <span>
                                    {selectedLog()!.success_count}/{selectedLog()!.total_count}
                                </span>
                            </div>
                        </div>

                        <div class="mockup-code bg-base-300 p-4 max-h-64 overflow-y-auto">
                            <For each={selectedLog()!.details}>
                                {(detail) => (
                                    <pre class="text-sm whitespace-pre-wrap break-words">{detail}</pre>
                                )}
                            </For>
                        </div>

                        <div class="modal-action">
                            <button
                                class="btn btn-primary"
                                onClick={() => setSelectedLog(null)}
                            >
                                {t("buttons.close")}
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </Card>
    );
}
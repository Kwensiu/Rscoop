import { Trash2, Archive } from "lucide-solid";

interface CleanupProps {
    onCleanupApps: () => void;
    onCleanupCache: () => void;
}

function Cleanup(props: CleanupProps) {
    return (
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-xl">
                    Scoop Cleanup
                </h2>
                <p class="text-base-content/80 mb-4">
                    Free up disk space by removing old package versions and outdated download caches.
                </p>
                <div class="card-actions justify-start mt-2">
                    <button class="btn btn-primary" onClick={props.onCleanupApps}>
                        <Trash2 class="w-4 h-4 mr-2" />
                        Cleanup Old Versions
                    </button>
                    <button class="btn btn-secondary" onClick={props.onCleanupCache}>
                        <Archive class="w-4 h-4 mr-2" />
                        Cleanup Outdated Cache
                    </button>
                </div>

                <div class="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
                    <p class="text-xs text-info-content/70">
                        <strong>Notice:</strong> If there's a problem with the cleanup, try to kill all PowerShell processes.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Cleanup; 
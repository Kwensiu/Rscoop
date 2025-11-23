import { createSignal, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { ScoopPackage } from "../types/scoop";
import { OperationNextStep } from "../types/operations";
import installedPackagesStore from "../stores/installedPackagesStore";
import settingsStore from "../stores/settings";

interface UsePackageOperationsReturn {
  operationTitle: () => string | null;
  setOperationTitle: (title: string | null) => void;
  operationNextStep: () => OperationNextStep | null;
  isScanning: () => boolean;
  pendingInstallPackage: () => ScoopPackage | null;
  handleInstall: (pkg: ScoopPackage) => void;
  handleInstallConfirm: () => void;
  handleUninstall: (pkg: ScoopPackage) => void;
  handleUpdate: (pkg: ScoopPackage) => void;
  handleForceUpdate: (pkg: ScoopPackage) => void;
  handleUpdateAll: () => void;
  closeOperationModal: (wasSuccess: boolean) => void;
}

export function usePackageOperations(): UsePackageOperationsReturn {
    const [operationTitle, setOperationTitle] = createSignal<string | null>(null);
    
    const [operationNextStep, setOperationNextStep] = createSignal<OperationNextStep | null>(null);
    const [isScanning, setIsScanning] = createSignal(false);
    const [pendingInstallPackage, setPendingInstallPackage] = createSignal<ScoopPackage | null>(null);
    const { settings } = settingsStore;

    const performInstall = (pkg: ScoopPackage) => {
        setOperationTitle(`Installing ${pkg.name}`);
        setIsScanning(false);
        invoke("install_package", {
            packageName: pkg.name,
            bucket: pkg.source,
        }).catch((err) => {
            console.error(`Installation invocation failed for ${pkg.name}:`, err);
            setOperationNextStep(null);
        });
    };

    const handleInstall = (pkg: ScoopPackage) => {
        // Check if the package is already installed
        if (installedPackagesStore.packages().some(p => p.name === pkg.name)) {
            // If already installed, show a warning and don't proceed
            setOperationNextStep({
                buttonLabel: "OK",
                onNext: () => setOperationNextStep(null),
            } as OperationNextStep);
            return;
        }
        
        // Proceed with installation
        performInstall(pkg);
    };

    const handleInstallConfirm = () => {
        const pkg = pendingInstallPackage();
        if (pkg) {
            performInstall(pkg);
            setPendingInstallPackage(null);
        }
    };

    const handleUninstall = (pkg: ScoopPackage) => {
        setOperationTitle(`Uninstalling ${pkg.name}`);
        
        invoke("uninstall_package", {
            packageName: pkg.name,
            bucket: pkg.source,
        }).catch((err) => {
            console.error(`Uninstallation invocation failed for ${pkg.name}:`, err);
            setOperationNextStep(null);
        });
    };

    const handleUpdate = (pkg: ScoopPackage) => {
        setOperationTitle(`Updating ${pkg.name}`);
        invoke("update_package", { packageName: pkg.name }).catch(err => {
            console.error("Update invocation failed:", err);
        });
    };

    const handleForceUpdate = (pkg: ScoopPackage) => {
        setOperationTitle(`Force Updating ${pkg.name}`);
        invoke("update_package", { packageName: pkg.name, force: true }).catch(err => {
            console.error("Force update invocation failed:", err);
        });
    };

    const handleUpdateAll = () => {
        setOperationTitle("Updating all packages");
        return invoke("update_all_packages").catch(err => {
            console.error("Update all invocation failed:", err);
        });
    };

    const closeOperationModal = (wasSuccess: boolean) => {
        setOperationTitle(null);
        setOperationNextStep(null);
        setIsScanning(false);
        
        // If operation was successful, refresh installed packages
        if (wasSuccess) {
            installedPackagesStore.fetch();
        }
    };

    return {
        operationTitle,
        setOperationTitle,
        operationNextStep,
        isScanning,
        pendingInstallPackage,
        handleInstall,
        handleInstallConfirm,
        handleUninstall,
        handleUpdate,
        handleForceUpdate,
        handleUpdateAll,
        closeOperationModal,
    };
}
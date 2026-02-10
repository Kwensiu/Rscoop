import { Home } from "lucide-solid";
import settingsStore from "../../../stores/settings";
import Card from "../../common/Card";
import { View } from "../../../types/scoop";
import { t } from "../../../i18n";
import { createMemo } from "solid-js";

function DefaultLaunchPageSettings() {
    const { settings, setDefaultLaunchPage } = settingsStore;

    const pages = createMemo<{ value: View; label: string }[]>(() => [
        { value: "search", label: t("settings.default_launch_page.search") },
        { value: "bucket", label: t("settings.default_launch_page.buckets") },
        { value: "installed", label: t("settings.default_launch_page.installed") },
        { value: "doctor", label: t("settings.default_launch_page.doctor") },
        { value: "settings", label: t("settings.default_launch_page.settings") },
    ]);

    const handlePageChange = async (e: Event) => {
        const target = e.currentTarget as HTMLSelectElement;
        await setDefaultLaunchPage(target.value as View);
    };

    return (
        <Card
            title={t("settings.default_launch_page.title")}
            icon={Home}
            description={t("settings.default_launch_page.description")}
            headerAction={
                <label class="label cursor-pointer gap-3">
                    <select
                        class="select select-bordered select-outline select-sm min-w-[140px]"
                        value={settings.defaultLaunchPage || "search"}
                        onChange={handlePageChange}
                    >
                        {pages().map((page) => (
                            <option value={page.value}>{page.label}</option>
                        ))}
                    </select>
                </label>
            }
        />
    );
}

export default DefaultLaunchPageSettings;

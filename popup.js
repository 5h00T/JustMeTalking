(() => {
    const { settings, channelId } = JustMeTalking;
    const enabled = document.querySelector("#enabled");
    const identity = document.querySelector("#identity");
    const input = document.querySelector("#channel");
    const status = document.querySelector("#status");
    const reset = document.querySelector("#reset");
    let config = settings();

    function render() {
        enabled.disabled = !config.channelId;
        enabled.checked = Boolean(config.channelId && config.enabled);
        reset.disabled = !config.channelId;
        identity.textContent = config.channelId ? `登録済み：${config.name || config.channelId}` : "自分のチャンネルが未登録です。";
        input.placeholder = config.channelId || "UC…";
    }

    async function save(next) {
        try {
            const value = settings({ ...config, ...next });
            await chrome.storage.local.set({ jmt: value });
            config = value;
            status.textContent = "";
        } catch {
            status.textContent = "保存できませんでした。拡張機能を再読み込みしてください。";
        }
        render();
    }

    enabled.addEventListener("change", () => save({ enabled: enabled.checked }));
    reset.addEventListener("click", () => save({ channelId: "", name: "" }));
    document.querySelector("#channel-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const id = channelId(input.value);
        if (!id) {
            status.textContent = "UCで始まる24文字のID、または https://www.youtube.com/channel/… を入力してください。";
            input.focus();
            return;
        }
        void save({ channelId: id, name: "", enabled: true });
    });
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local" || !changes.jmt) return;
        config = settings(changes.jmt.newValue);
        render();
    });
    chrome.storage.local.get("jmt").then((result) => {
        config = settings(result.jmt);
        render();
    }).catch(() => {
        status.textContent = "設定を読み込めませんでした。ポップアップを開き直してください。";
        render();
    });
})();

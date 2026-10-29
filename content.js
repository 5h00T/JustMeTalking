(() => {
    const { settings, channelId } = JustMeTalking;
    const LIST = "yt-live-chat-item-list-renderer #items";
    const RENDERERS = [
        "yt-live-chat-text-message-renderer",
        "yt-live-chat-paid-message-renderer",
        "yt-live-chat-paid-sticker-renderer",
        "yt-live-chat-membership-item-renderer",
        "yt-live-chat-sponsorships-gift-purchase-announcement-renderer",
        "yt-live-chat-sponsorships-gift-redemption-announcement-renderer"
    ].join(",");
    let config = settings();
    let choosing = false;
    let panel;
    let toggle;
    let choose;
    let status;
    let error = "";
    let timer;

    function rows() {
        return [...document.querySelectorAll(LIST)].flatMap((list) => [...list.children]);
    }

    function author(row) {
        const renderer = row.matches(RENDERERS) ? row : row.querySelector(RENDERERS);
        if (!renderer) return null;
        renderer.removeAttribute("data-jmt-author");
        renderer.dispatchEvent(new Event("jmt-read-author", { bubbles: true }));
        try {
            const value = JSON.parse(renderer.getAttribute("data-jmt-author"));
            return value && channelId(value.channelId) ? settings(value) : null;
        } catch {
            return null;
        } finally {
            renderer.removeAttribute("data-jmt-author");
        }
    }

    function rowAt(target) {
        if (!(target instanceof Element)) return null;
        const list = target.closest(LIST);
        if (!list) return null;
        let row = target;
        while (row.parentElement && row.parentElement !== list) row = row.parentElement;
        return row.parentElement === list ? row : null;
    }

    function mount() {
        const chat = document.querySelector("yt-live-chat-renderer");
        if (!chat || panel?.isConnected) return;
        panel = document.createElement("section");
        panel.id = "jmt-controls";
        panel.setAttribute("aria-label", "Just Me Talking 設定");
        const buttons = document.createElement("div");
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.addEventListener("click", () => save({ enabled: !config.enabled }));
        choose = document.createElement("button");
        choose.type = "button";
        choose.addEventListener("click", () => {
            choosing = !choosing;
            error = "";
            refresh();
        });
        status = document.createElement("p");
        status.setAttribute("role", "status");
        buttons.append(toggle, choose);
        panel.append(buttons, status);
        chat.prepend(panel);
    }

    function refresh() {
        mount();
        const filtering = Boolean(config.enabled && config.channelId && !choosing);
        for (const row of rows()) {
            const identity = author(row);
            const own = Boolean(identity && identity.channelId === config.channelId);
            if (row.getAttribute("data-jmt-self") !== String(own)) row.setAttribute("data-jmt-self", String(own));
        }
        document.documentElement.toggleAttribute("data-jmt-filtering", filtering);
        document.documentElement.toggleAttribute("data-jmt-choosing", choosing);
        if (!panel) return;
        toggle.disabled = !config.channelId || choosing;
        toggle.setAttribute("aria-pressed", String(filtering));
        const toggleText = filtering ? "自分だけ：ON" : "自分だけ：OFF";
        const chooseText = choosing ? "選択をキャンセル" : config.channelId ? "自分を変更" : "自分を指定";
        if (toggle.textContent !== toggleText) toggle.textContent = toggleText;
        if (choose.textContent !== chooseText) choose.textContent = chooseText;
        choose.setAttribute("aria-pressed", String(choosing));
        const statusText = error || (choosing
            ? "自分のコメントをクリックしてください（Escで取消）。"
            : !config.channelId
                ? "「自分を指定」を押して、自分のコメントを選択してください。"
                : `${config.name || config.channelId} ${filtering ? "のコメントだけを表示中" : "／ 全員のコメントを表示中"}`);
        if (status.textContent !== statusText) status.textContent = statusText;
    }

    async function save(patch) {
        try {
            await chrome.storage.local.set({ jmt: settings({ ...config, ...patch }) });
            error = "";
        } catch {
            error = "設定を保存できません。拡張機能とチャットを再読み込みしてください。";
            refresh();
        }
    }

    async function select(row) {
        const identity = author(row);
        if (!identity) {
            error = "この行からチャンネルIDを取得できません。通常のコメントを選んでください。";
            refresh();
            return;
        }
        await save({ channelId: identity.channelId, name: identity.name, enabled: true });
        if (error) return;
        choosing = false;
        refresh();
        choose?.focus();
    }

    document.addEventListener("click", (event) => {
        if (!choosing) return;
        const row = rowAt(event.target);
        if (!row) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void select(row);
    }, true);

    document.addEventListener("keydown", (event) => {
        if (!choosing) return;
        if (event.key === "Escape") {
            choosing = false;
            error = "";
            refresh();
            choose?.focus();
        }
    }, true);

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local" || !changes.jmt) return;
        config = settings(changes.jmt.newValue);
        error = "";
        refresh();
    });

    const observer = new MutationObserver(() => {
        if (timer !== undefined) return;
        timer = setTimeout(() => {
            timer = undefined;
            refresh();
        }, 50);
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["author-external-channel-id", "href"]
    });

    chrome.storage.local.get("jmt").then((result) => {
        config = settings(result.jmt);
        refresh();
    }).catch(() => {
        error = "設定を読み込めません。チャットを再読み込みしてください。";
        refresh();
    });
})();

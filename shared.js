(() => {
    const CHANNEL_ID = /^UC[\w-]{22}$/;

    function channelId(value) {
        if (typeof value !== "string") return "";
        const input = value.trim();
        if (CHANNEL_ID.test(input)) return input;
        try {
            const url = new URL(input);
            if (url.protocol !== "https:" || !["youtube.com", "www.youtube.com"].includes(url.hostname)) return "";
            const match = url.pathname.match(/^\/channel\/(UC[\w-]{22})\/?$/);
            return match ? match[1] : "";
        } catch {
            return "";
        }
    }

    function settings(value = {}) {
        const source = value && typeof value === "object" ? value : {};
        return {
            enabled: source.enabled !== false,
            channelId: channelId(source.channelId),
            name: typeof source.name === "string" ? source.name.slice(0, 100) : ""
        };
    }

    globalThis.JustMeTalking = { channelId, settings };
})();

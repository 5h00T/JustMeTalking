(() => {
    // Channel IDs are on YouTube's renderer objects, outside the isolated content script.
    document.addEventListener("jmt-read-author", (event) => {
        const element = event.target;
        if (!(element instanceof Element) || !element.localName.startsWith("yt-live-chat-")) return;
        const data = element.data || element.polymerController?.data || {};
        const id = data.authorExternalChannelId || element.getAttribute("author-external-channel-id");
        if (typeof id !== "string" || !/^UC[\w-]{22}$/.test(id)) return;
        const name = data.authorName?.simpleText ||
            data.authorName?.runs?.map((run) => run.text || "").join("") ||
            element.querySelector("#author-name")?.textContent || "";
        element.setAttribute("data-jmt-author", JSON.stringify({ channelId: id, name: String(name).slice(0, 100) }));
    });
})();

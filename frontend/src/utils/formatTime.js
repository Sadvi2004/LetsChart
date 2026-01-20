export default function formatTimestamp(timestamp) {
    if (!timestamp) return "";

    const messageTime = new Date(timestamp);
    if (isNaN(messageTime.getTime())) return "";

    const now = Date.now();
    const diff = now - messageTime.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

    // Show formatted date for older messages
    return messageTime.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
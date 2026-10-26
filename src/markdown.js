function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function markdownHtml(source) {
  const text = String(source || "").replace(/\r\n/g, "\n");
  const blocks = [];
  const parts = text.split(/```/);
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      const nl = part.indexOf("\n");
      const code = nl >= 0 ? part.slice(nl + 1) : part;
      blocks.push("<pre><code>" + escapeHtml(code.replace(/\n$/, "")) + "</code></pre>");
      return;
    }
    const lines = part.split("\n");
    let list = "";
    const flush = () => {
      if (!list) return;
      blocks.push(list.startsWith("<ol") ? list + "</ol>" : list + "</ul>");
      list = "";
    };
    for (const line of lines) {
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      const bullet = /^[-*]\s+(.+)$/.exec(line);
      const numbered = /^\d+\.\s+(.+)$/.exec(line);
      const quote = /^>\s?(.+)$/.exec(line);
      if (heading) {
        flush();
        const level = heading[1].length;
        blocks.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
      } else if (bullet) {
        if (!list.startsWith("<ul")) {
          flush();
          list = "<ul>";
        }
        list += "<li>" + inline(bullet[1]) + "</li>";
      } else if (numbered) {
        if (!list.startsWith("<ol")) {
          flush();
          list = "<ol>";
        }
        list += "<li>" + inline(numbered[1]) + "</li>";
      } else if (quote) {
        flush();
        blocks.push("<blockquote>" + inline(quote[1]) + "</blockquote>");
      } else if (!line.trim()) {
        flush();
      } else {
        flush();
        blocks.push("<p>" + inline(line) + "</p>");
      }
    }
    flush();
  });
  return blocks.join("");
}

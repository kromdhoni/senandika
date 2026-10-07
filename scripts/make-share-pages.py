import io
import json
import os
import re

SITE = "https://kromdhoni.github.io/senandika"

src = io.open("src/data/published.ts", encoding="utf-8").read()
pattern = re.compile(
    r'id: "([^"]+)",\s*cover: "([^"]+)",\s*title: "((?:[^"\\]|\\.)*)",\s*content:\s+"((?:[^"\\]|\\.)*)"',
    re.DOTALL,
)

entries = []
for m in pattern.finditer(src):
    eid, cover, title, content = m.groups()
    text = content.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
    title = title.replace('\\"', '"')
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    desc = " / ".join(lines[:3])[:170]
    entries.append({"id": eid, "title": title, "desc": desc, "cover": cover})

assert len(entries) == 43, "ketemu %d, harus 43" % len(entries)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


for e in entries:
    url = "%s/baca/%s/" % (SITE, e["id"])
    img = "%s/%s" % (SITE, e["cover"])
    html = """<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>%s &middot; Senandika</title>
<meta name="description" content="%s">
<meta property="og:type" content="article">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta property="og:image" content="%s">
<meta property="og:url" content="%s">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="%s">
<meta http-equiv="refresh" content="0;url=../#/baca/%s">
</head>
<body>
<p>Membuka tulisan&hellip; <a href="/senandika/#/baca/%s">baca di sini</a></p>
<script>location.replace(location.pathname.split("/baca/")[0] + "/#/baca/%s")</script>
</body>
</html>
""" % (
        esc(e["title"]),
        esc(e["desc"]),
        esc(e["title"]),
        esc(e["desc"]),
        esc(img),
        url,
        url,
        e["id"],
        e["id"],
        e["id"],
    )
    d = os.path.join("public", "baca", e["id"])
    os.makedirs(d, exist_ok=True)
    io.open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline="").write(html)

print("43 halaman share ok")

import json

path = r"C:\Users\musil\.cursor\projects\c-Users-musil-Desktop-GLORIOUS-GOSPEL-CENTRE\agent-transcripts\fc7d6d04-a8ef-4cf6-813f-da2fb8bf7e7d\fc7d6d04-a8ef-4cf6-813f-da2fb8bf7e7d.jsonl"
out = r"C:\Users\musil\Desktop\GLORIOUS GOSPEL CENTRE\scripts\_phase_e_out.txt"
chunks = []
with open(path, encoding="utf-8") as f:
    for line in f:
        if "Audit complete" in line and "Phase E" in line:
            obj = json.loads(line)
            text = obj["message"]["content"][0]["text"]
            for marker in ["Phase E", "Member Experience", "member", "Member UX"]:
                idx = 0
                while True:
                    i = text.find(marker, idx)
                    if i < 0:
                        break
                    chunks.append(f"\n==== {marker} @{i} ====\n" + text[i : i + 1800])
                    idx = i + len(marker)
                    if len(chunks) > 12:
                        break
            break
with open(out, "w", encoding="utf-8") as w:
    w.write("\n".join(chunks[:15]))
print("wrote", len(chunks))

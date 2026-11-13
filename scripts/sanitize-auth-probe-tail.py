"""Print probe outcome/timing only; never write request headers or credentials."""
import json
import sys

buffer = ""
depth = 0
quoted = False
escaped = False
line = ""
for char in iter(lambda: sys.stdin.read(1), ""):
    if depth == 0:
        if char != "{":
            line += char
            if char == "\n":
                if "Connected to domino-os-auth-cpu-check" in line or "Successfully created tail" in line:
                    print(line.strip(), flush=True)
                line = ""
            continue
        buffer = ""
        line = ""
    buffer += char
    if quoted:
        if escaped:
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == '"':
            quoted = False
    elif char == '"':
        quoted = True
    elif char == "{":
        depth += 1
    elif char == "}":
        depth -= 1
        if depth == 0:
            try:
                event = json.loads(buffer)
                safe = {key: event.get(key) for key in ["outcome", "cpuTime", "cpuTimeMs", "wallTime", "wallTimeMs", "eventTimestamp"] if key in event}
                safe["fields"] = list(event)
                print(json.dumps(safe), flush=True)
            except ValueError:
                pass

import json
import os
from graphify.detect import detect
from pathlib import Path

os.makedirs('graphify-out', exist_ok=True)
result = detect(Path('.'))
with open('graphify-out/.graphify_detect.json', 'w') as f:
    f.write(json.dumps(result))
print("Done")

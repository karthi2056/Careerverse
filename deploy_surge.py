import subprocess, time, sys

node_exe = r"d:\Career Guidence\.tools\node-v20.18.0-win-x64\node.exe"
surge_js = r"d:\Career Guidence\.tools\node_modules\surge\bin\surge"

domain = "careerverse-ai.surge.sh"
project = r"d:\Career Guidence"

cmd = [node_exe, surge_js, project, domain, "--token", "83ccc1206836ba3e866bfdd4e02ce464"]

print(f"Starting Surge deployment to https://{domain}...")

proc = subprocess.Popen(
    cmd,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    cwd=project
)

# Feed credentials to interactive prompts
out, err = proc.communicate(input="careerverse.demo.2026@gmail.com\nCareerVersePassword2026!\n")

print("STDOUT:")
print(out)
if err:
    print("STDERR:")
    print(err)

print("Exit code:", proc.returncode)

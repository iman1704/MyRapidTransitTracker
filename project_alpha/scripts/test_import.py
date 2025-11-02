
# scripts/test_imports.py
"""Test that all imports work in Docker container"""
import subprocess
import sys

tests = [
    "from project_alpha.config.settings import settings",
    "from project_alpha.database.models import Vehicle",
    "from project_alpha.utils.logger import setup_logger",
    "print('✅ All imports successful!')",
]

for test in tests:
    result = subprocess.run(
        ["docker", "exec", "gtfs-raw-consumer", "python", "-c", test],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"✅ {test}")
    else:
        print(f"❌ {test}")
        print(f"   Error: {result.stderr}")
        sys.exit(1)

print("\n🎉 All tests passed!")

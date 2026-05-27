import os, re
from pathlib import Path

SUPPORTED = {".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".c", ".cpp", ".h", ".cs", ".go", ".rb"}

def sanitize_filename(filename: str) -> str:
    filename = os.path.basename(filename)
    return re.sub(r"[^\w\s\-\.]", "", filename)

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()

def is_supported_file(filename: str) -> bool:
    return get_file_extension(filename) in SUPPORTED

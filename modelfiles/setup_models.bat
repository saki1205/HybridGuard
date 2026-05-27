@echo off

echo ========================================
echo Creating HybridGuard Custom Models
echo ========================================

echo Creating hybridguard-codellama...
ollama create hybridguard-codellama -f Modelfile.codellama
if %errorlevel% neq 0 (
    echo Failed to create hybridguard-codellama
    exit /b 1
)
echo [OK] hybridguard-codellama created

echo Creating hybridguard-mistral...
ollama create hybridguard-mistral -f Modelfile.mistral
if %errorlevel% neq 0 (
    echo Failed to create hybridguard-mistral
    exit /b 1
)
echo [OK] hybridguard-mistral created

echo Creating hybridguard-deepseek...
ollama create hybridguard-deepseek -f Modelfile.deepseek
if %errorlevel% neq 0 (
    echo Failed to create hybridguard-deepseek
    exit /b 1
)
echo [OK] hybridguard-deepseek created

echo.
echo ========================================
echo All models created successfully!
echo ========================================
echo.
echo Available models:
ollama list | findstr hybridguard

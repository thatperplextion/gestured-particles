# Installation & Setup Guide - Python Hand Detection System

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Quick Start (2 Minutes)](#quick-start-2-minutes)
3. [Detailed Installation](#detailed-installation)
4. [Troubleshooting](#troubleshooting)
5. [Verification](#verification)

---

## System Requirements

### Operating System
- ✅ Windows 10/11 (recommended)
- ✅ macOS 10.14+
- ✅ Linux (Ubuntu 18.04+, Debian 9+)

### Hardware
- **CPU**: Intel i5 / AMD Ryzen 5 or better
- **RAM**: 4GB minimum, 8GB recommended
- **Camera**: USB webcam or built-in camera
- **Storage**: 500MB free space

### Software
- **Python**: 3.7, 3.8, 3.9, 3.10, or 3.11
- **pip**: Package manager (included with Python)

---

## Quick Start (2 Minutes)

### Windows
```cmd
# Navigate to project folder
cd "c:\Users\JUNAID ASAD KHAN\gestured particles"

# Double-click run.bat
# OR type this in Command Prompt:
run.bat
```

### macOS / Linux
```bash
# Navigate to project folder
cd ~/path/to/gestured\ particles

# Make run script executable
chmod +x run.sh

# Run it
./run.sh
```

---

## Detailed Installation

### Step 1: Verify Python Installation

**Windows (Command Prompt or PowerShell):**
```cmd
python --version
```

**macOS / Linux (Terminal):**
```bash
python3 --version
```

Expected output: `Python 3.7.x` or higher

**If Python is not found:**
- Download from https://python.org
- Run installer with ✅ "Add Python to PATH"
- Restart your terminal/command prompt

### Step 2: Create Virtual Environment (Recommended)

Creating a virtual environment isolates project dependencies.

**Windows:**
```cmd
# Create venv
python -m venv venv

# Activate it
venv\Scripts\activate

# Your terminal should now show (venv)
```

**macOS / Linux:**
```bash
# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate

# Your terminal should now show (venv)
```

### Step 3: Upgrade pip

```cmd
# Windows
python -m pip install --upgrade pip

# macOS / Linux
python3 -m pip install --upgrade pip
```

### Step 4: Install Dependencies

Navigate to the project folder first:

**Windows:**
```cmd
cd "c:\Users\JUNAID ASAD KHAN\gestured particles"
pip install -r requirements_python.txt
```

**macOS / Linux:**
```bash
cd ~/path/to/gestured\ particles
pip install -r requirements_python.txt
```

Expected output:
```
Successfully installed opencv-python-4.8.1.78
Successfully installed mediapipe-0.10.9
Successfully installed numpy-1.24.3
```

### Step 5: Verify Installation

```python
python -c "import cv2, mediapipe, numpy; print('✓ All packages installed correctly')"
```

If you see the checkmark, you're ready to go!

---

## Running the Application

### Basic Launch
```cmd
python hand_detection.py
```

### With Options
```cmd
# Use different camera (if you have multiple)
python hand_detection.py --camera 1

# Use higher FPS
python hand_detection.py --fps 60

# Use lower resolution (for older computers)
python hand_detection.py --width 640 --height 480

# Use fallback detector (if MediaPipe issues)
python hand_detection.py --fallback
```

### Run Examples
```cmd
python examples.py
```

Follow the menu to try different examples.

---

## Troubleshooting

### Problem: "Python is not recognized"

**Solution:**
1. Install Python from https://python.org
2. ✅ Check "Add Python to PATH" during installation
3. Restart Command Prompt
4. Try again

### Problem: "ModuleNotFoundError: No module named 'cv2'"

**Solution:**
```cmd
# Make sure venv is activated (you should see (venv) in terminal)
# Then reinstall:
pip install --upgrade opencv-python mediapipe numpy
```

### Problem: "ImportError: libGL.so.1"

**Linux only - Solution:**
```bash
sudo apt-get install libgl1-mesa-glx
```

### Problem: "Camera not found" or "Empty frame"

**Troubleshooting:**
1. Check if camera works in other apps (Zoom, Skype, etc.)
2. Check camera permissions
3. Try different camera ID:
   ```cmd
   python hand_detection.py --camera 0
   python hand_detection.py --camera 1
   python hand_detection.py --camera 2
   ```
4. Restart the application
5. Plug/unplug camera

### Problem: "Low FPS" or "Slow performance"

**Solutions (in order):**
1. Close other applications
2. Lower resolution:
   ```cmd
   python hand_detection.py --width 640 --height 480
   ```
3. Reduce FPS target:
   ```cmd
   python hand_detection.py --fps 24
   ```
4. Use fallback detector (lighter):
   ```cmd
   python hand_detection.py --fallback
   ```
5. Check CPU usage in Task Manager (Windows) or Activity Monitor (macOS)

### Problem: "Hand not detected"

**Troubleshooting:**
1. **Lighting**: Ensure good lighting (avoid backlighting)
2. **Camera angle**: Position camera at eye level
3. **Hand position**: Keep hand centered in frame
4. **Movement**: Move slowly and deliberately
5. **Confidence**: Try adjusting in code:
   ```python
   # In hand_detection.py, line 46:
   min_detection_confidence=0.3  # Lower = more sensitive
   ```

### Problem: "ModuleNotFoundError: No module named 'mediapipe'"

**Solution:**
```cmd
# Try installing older version if latest has issues
pip install mediapipe==0.8.11

# Or reinstall fresh
pip uninstall mediapipe
pip install mediapipe --upgrade
```

### Problem: Permission denied / Access denied

**Windows:**
- Run Command Prompt as Administrator
- Try creating venv again

**macOS / Linux:**
```bash
# Use sudo if needed
sudo pip install -r requirements_python.txt

# Or fix permissions
chmod -R u+w ~/path/to/project
```

---

## Verification Checklist

After installation, verify everything works:

- [ ] Python installed: `python --version` shows 3.7+
- [ ] Virtual environment active (terminal shows `(venv)`)
- [ ] All packages installed: `pip list` shows opencv, mediapipe, numpy
- [ ] Can import packages: `python -c "import cv2, mediapipe, numpy"`
- [ ] Camera works: `python hand_detection.py` shows live camera feed
- [ ] Hand detected: Show hand to camera, see green landmarks
- [ ] No errors: Check terminal for any error messages

---

## System-Specific Notes

### Windows Specific

**Visual C++ Runtime Required:**
If you get errors about "missing DLL", install:
- Visual C++ Redistributable: https://support.microsoft.com/en-us/help/2977003

**Using WSL2 (Windows Subsystem for Linux):**
Camera support is limited. Use native Windows Python instead.

### macOS Specific

**Camera Permissions:**
- First run: macOS will ask for camera permission
- Grant permission: System Preferences > Security & Privacy > Camera
- If denied, reset: `tccutil reset Camera com.apple.Terminal`

**M1/M2 Mac:**
- Some packages may compile from source
- This is normal and safe
- May take 5-10 minutes first time

### Linux Specific

**Required System Packages:**
```bash
sudo apt-get update
sudo apt-get install python3-pip python3-dev
sudo apt-get install libatlas-base-dev
sudo apt-get install libjasper-dev
sudo apt-get install libqtgui4
sudo apt-get install libharfbuzz0b
sudo apt-get install libwebp6
sudo apt-get install libtiff5
sudo apt-get install libjasper-dev
sudo apt-get install libqjasper1
```

**Camera Access:**
```bash
# Add user to video group
sudo usermod -a -G video $USER

# Log out and back in
```

---

## GPU Acceleration (Optional)

For faster performance with NVIDIA GPU:

```cmd
# Uninstall CPU version
pip uninstall opencv-python

# Install GPU-enabled version
pip install opencv-python-headless
pip install opencv-contrib-python-headless

# CUDA toolkit (optional, for faster MediaPipe)
# From: https://developer.nvidia.com/cuda-downloads
```

---

## Uninstall Instructions

If you need to remove the installation:

```cmd
# Deactivate virtual environment
deactivate

# Delete venv folder
# Windows: Remove "venv" folder manually
# macOS/Linux: rm -rf venv

# All packages are safely contained in venv
```

---

## Getting Help

### If something still doesn't work:

1. **Check Python version**: `python --version`
2. **Check pip list**: `pip list` (shows all installed packages)
3. **Run test script**: `python -c "import cv2; print(cv2.__version__)"`
4. **Check logs**: Look at terminal output for error messages
5. **Try examples**: `python examples.py` (simpler tests)

### Common Issues Summary

| Issue | Check | Fix |
|-------|-------|-----|
| Python not found | PATH variable | Reinstall Python |
| Packages not found | Virtual env active | Activate venv first |
| Camera not working | Device permissions | Grant camera access |
| Low performance | CPU/RAM usage | Close other apps |
| Hand not detected | Lighting & angle | Improve environment |

---

## Next Steps After Installation

1. ✅ **Run basic example**: `python hand_detection.py`
2. 📖 **Read documentation**: Open `README_PYTHON.md`
3. 📚 **Try examples**: `python examples.py`
4. 🎯 **Customize**: Edit code for your use case
5. 🚀 **Deploy**: Use in your own project

---

## Support Resources

- **MediaPipe Docs**: https://mediapipe.dev
- **OpenCV Docs**: https://docs.opencv.org
- **NumPy Docs**: https://numpy.org/doc
- **Python Docs**: https://docs.python.org/3

---

**Last Updated**: December 2025
**Status**: All systems go ✅

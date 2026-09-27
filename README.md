<div align="center">

# 🍂 Tab Rot

### Your tabs decay if you ignore them.

**A VS Code extension that makes editor tabs visually rot over time — faded, grainy, then cracked like old paper left in the sun. Click to restore.**

 

</div>
--

## 📖 Table of Contents
- [What Is Tab Rot?](#-what-is-tab-rot)


## 🤔 What Is Tab Rot?
**Tab Rot** is a gentle visual nudge. Files you havent visited in a while slowly decay through three stages - **faded**, **grainy**, then *cracked* - like old paper left in the sun. When you finally click back to a neglected file, it **restore itself** with a satisfy animation.

 

## ✨ Features

| Feature                       | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| 🍂 **3 Decay Stages**          | Faded → Grainy → Cracked based on inactivity time |
| ✨ **Restore Animation**       | Green flash heals decayed tabs back to fresh      |
| ⏱️ **Configurable Thresholds** | Set your own timelines (default: 1h / 1d / 1w)    |
| 🎯 **Quick Presets**           | Extreme, Aggressive, Moderate, Chill — one click  |
| ⚙️ **Settings Panel**          | Dedicated sidebar panel with visual controls      |
| 📊 **Decayed Tabs View**       | Sidebar tree showing all rotting files            |
| 📍 **Status Bar**              | Live count of decaying tabs                       |
| 🎨 **Theme-Aware**             | Adapts to any light or dark color theme           |
| 🚀 **Zero Config**             | Install and forget — works out of the box         |

## 📦 Installation
1. Download the latest `.vsix` from Github Release
2. Open VS Code
3. Then Press `CTRL+SHIFT+P` → Type `Extentions: Install From VSIX...`
4. Select the downloaded `.vsix` file
   
 
 ## 🚀 Quick Start  
1. **Instal** the extension
2. **Open** a few files in VS code
3. **Switch** between then normally
4. **wait** - after 1 Hour, inactivate file start faiding
5. **click** a decaed files to restore it instantly
6. **config** Change Decaye stages times

## ⚙️ Settings & Configarations 

All settings are available in **VS Code Settings** (Ctrl+,) under the Tab Rot section, or in the dedicated **Settings Panel** in the sidebar.
### Decay Thresholds
---------------------------------------------
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
|`tabRot.stage1Threshold` | `number`| `60`| Minutes before Stage 1 (Faded) begins |
|`tabRot.stage1Threshold` | `number`| `1440`| Minutes before Stage 2 (Grainy) begins |
|`tabRot.stage1Threshold` | `number`| `10080`| Minutes before Stage 3 (Cracked) begins |

```⚠️ Important: Thresholds must be in ascending order: stage1 < stage2 < stage3. The settings panel will highlight invalid values in red.```

## 🎯 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
| Command | Description |
|---------|-------------|
|Tab Rot: Restore Tab |  Restore the  currently active tab to fresh state | 
|Tab Rot: Reastore All Tabs | Restore all tracked tabs to fress state | 
|Tab Rot: Show Decayed Tabs | Focus the sidebar view showing all decayed tabs
| Tab Rot: Open Settings Panel | Open the Settings panel in the side bar | 


<div align="center">

If you find Tab Rot useful, please leave a review on the Marketplace!
Your tabs are rotting. Go check on them. 🍂
</div>
 
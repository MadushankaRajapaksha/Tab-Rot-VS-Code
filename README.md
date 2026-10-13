# Tab Rot VS Code

A VS Code extension thats track how long a tabs been inactive and visualy show how long tab inactive with 3 stages!


![alt text](temp_devlogs/baner.PNG)

[<kbd> <br> Try It <br> </kbd>](https://github.com/MadushankaRajapaksha/Tab-Rot-VS-Code/releases)


## Quick start

1. Download Extension from [Github Releases.](https://github.com/MadushankaRajapaksha/Tab-Rot-VS-Code/releases)
2. Then Open VS Code.
3. Press `CTRL + SHIFT + P` in Windows | `CMD + SHIFT + P` in Mac.
4. Type `Extension: Install from VSIX....` and pick downloded file.
## How its work

Every time you click or switch to a fle, the extension saves a record, then, a background timer cheacks every 60 seconds to see how old ur tabs are.Once file hits the time limit you set,it injects visual effects right into the editor. And when u click back into that file, its instantly restore.


## Usage
### Setting
1. Press `CTRL + SHIFT + P` in Windows | `CMD + SHIFT + P` in Mac
2. Type `Tab Rot: Show Tab Rot Settings` and hit Enter Then Open Window of Settings!
   
after that you can see like this window.

![alt text](temp_devlogs/10.1.PNG)


## Commands
Press `Ctrl + Shift + P` and use commands:
![alt text](image.png)
- **Tab Rot: Restore Tab** — Fixes your current tab.
- **Tab Rot: Restore All Tabs** — Fixes all open tabs.
- **Tab Rot: Show Decayed Tabs** — Opens the side list of old tabs.
- **Tab Rot: Show Tab Rot Settings** - Opens Settigs
-----
📌 Note: By default, after installation, the decay times are set to 1 min, 2 mins, and 3 mins so you can see it working quickly. Please change these settings to your own custom times after installing!

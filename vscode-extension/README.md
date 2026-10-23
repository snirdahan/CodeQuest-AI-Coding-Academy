# CodeQuest for VS Code

Practice CodeQuest exercises in Visual Studio Code.

- **Connect Account** – secure pairing from the CodeQuest website (one-time code → token stored in VS Code SecretStorage).
- **Open Exercise** – creates the exercise file in `~/CodeQuest/<course>/<lesson>/` and shows the instructions panel.
- **Check Solution** (`Ctrl+Alt+Enter`) – sends only the exercise file to the CodeQuest server, where it runs in an isolated Lua sandbox, and shows results, explanations and editor diagnostics.
- **Show Hint**, **Next Lesson**, **Disconnect**.

XP and progress sync to your CodeQuest account automatically.

Privacy: the extension never runs code on your computer and never reads files outside the CodeQuest exercises folder.

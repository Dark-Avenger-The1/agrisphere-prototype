# Windows Setup

Run these commands from this folder when you are ready to use the Gemini Deep Research API.

```powershell
cd "C:\Users\peopl\Documents\Context Protocol\Codex- Deep Research"
```

Create a local virtual environment:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

Create `.env` from `.env.example`, then add your Gemini API key:

```powershell
Copy-Item .env.example .env
notepad .env
```

Run a prompt:

```powershell
python scripts\research.py --query "Research circular agriculture and agribusiness opportunities in the Philippines." --stream
```

For better prompts, start with `PROMPTING.md` or one of the files in `templates/`.


# <span style="color: #FF69B4;">🕒 Changelog</span>

All notable changes to the **Blabber-MCP** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## <span style="color: #ADD8E6;">[0.1.2] - 2025-04-05</span>

### <span style="color: #90EE90;">✨ Added</span>

*   Configurable default voice via `DEFAULT_TTS_VOICE` environment variable.

## <span style="color: #FFD700;">[0.1.1] - 2025-04-05</span>

### <span style="color: #90EE90;">✨ Added</span>

*   Optional automatic playback of generated audio via `play: true` parameter.
*   Configurable audio player command via `AUDIO_PLAYER_COMMAND` environment variable (defaults to `xdg-open`).
*   Server now saves audio to `output/` directory and returns file path instead of base64 data.

## <span style="color: #FFA07A;">[0.1.0] - 2025-04-05</span>

### <span style="color: #90EE90;">✨ Added</span>

*   Initial Blabber-MCP server setup.
*   `text_to_speech` tool using OpenAI TTS API.
*   Support for selecting voice, model, and response format.
*   Requires `OPENAI_API_KEY` environment variable.
*   Basic project structure (`README.md`, `LICENSE`, `CHANGELOG.md`).
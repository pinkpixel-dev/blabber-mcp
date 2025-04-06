# <span style="color: #FF69B4;">📢 Blabber-MCP</span> <span style="color: #ADD8E6;">🗣️</span>

<span style="color: #90EE90;">An MCP server that gives your LLMs a voice using OpenAI's Text-to-Speech API!</span> 🔊

---

## <span style="color: #FFD700;">✨ Features</span>

*   **Text-to-Speech:** Converts input text into high-quality spoken audio.
*   **Voice Selection:** Choose from various OpenAI voices (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`).
*   **Model Selection:** Use standard (`tts-1`) or high-definition (`tts-1-hd`) models.
*   **Format Options:** Get audio output in `mp3`, `opus`, `aac`, or `flac`.
*   **File Saving:** Saves the generated audio to a local file.
*   **Optional Playback:** Automatically play the generated audio using a configurable system command.
*   **Configurable Defaults:** Set a default voice via configuration.

---

## <span style="color: #FFA07A;">🔧 Configuration</span>

To use this server, you need to add its configuration to your MCP client's settings file (e.g., `mcp_settings.json`).

1.  **Get OpenAI API Key:** You need an API key from [OpenAI](https://platform.openai.com/api-keys).
2.  **Add to MCP Settings:** Add the following block to the `mcpServers` object in your settings file, replacing `"YOUR_OPENAI_API_KEY"` with your actual key.

```json
{
  "mcpServers": {
    "blabber-mcp": {
      "command": "node",
      "args": ["/full/path/to/blabber-mcp/build/index.js"], (IMPORTANT: Use the full, absolute path to the built index.js file)
      "env": {
        "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY",
        "AUDIO_PLAYER_COMMAND": "xdg-open", (Optional: Command to play audio (e.g., "cvlc", "vlc", "mpv", "ffplay", "afplay", "xdg-open"; defaults to "cvlc")
        "DEFAULT_TTS_VOICE": "nova" (Optional: Set default voice (alloy, echo, fable, onyx, nova, shimmer); defaults to nova)
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

<span style="color: #FF6347;">**Important:**</span> Make sure the `args` path points to the correct location of the `build/index.js` file within your `blabber-mcp` project directory. Use the full absolute path.

---

## <span style="color: #87CEEB;">🚀 Usage</span>

Once configured and running, you can use the `text_to_speech` tool via your MCP client.

**Tool:** `text_to_speech`
**Server:** `blabber-mcp` (or the key you used in the config)

**Arguments:**

*   `input` (string, **required**): The text to synthesize.
*   `voice` (string, optional): The voice to use (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`). Defaults to the `DEFAULT_TTS_VOICE` set in config, or `nova`.
*   `model` (string, optional): The model (`tts-1`, `tts-1-hd`). Defaults to `tts-1`.
*   `response_format` (string, optional): Audio format (`mp3`, `opus`, `aac`, `flac`). Defaults to `mp3`.
*   `play` (boolean, optional): Set to `true` to automatically play the audio after saving. Defaults to `false`.

**Example Tool Call (with playback):**

```xml
<use_mcp_tool>
  <server_name>blabber-mcp</server_name>
  <tool_name>text_to_speech</tool_name>
  <arguments>
  {
    "input": "Hello from Blabber MCP!",
    "voice": "shimmer",
    "play": true
  }
  </arguments>
</use_mcp_tool>
```

**Output:**

The tool saves the audio file to the `output/` directory within the `blabber-mcp` project folder and returns a JSON response like this:

```json
{
  "message": "Audio saved successfully. Playback initiated using command: cvlc",
  "filePath": "path/to/speech_1743908694848.mp3", 
  "format": "mp3",
  "voiceUsed": "shimmer"
}
```

---

## <span style="color: #98FB98;">📜 License</span>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## <span style="color: #BA55D3;">🕒 Changelog</span>

See the [CHANGELOG.md](CHANGELOG.md) file for details on version history.

---

<p align="center">Made with ❤️ by Pink Pixel</p>

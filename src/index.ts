#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { APIError } from "openai/error.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

// --- Configuration ---
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set.");
  process.exit(1);
}

const AUDIO_PLAYER_COMMAND = process.env.AUDIO_PLAYER_COMMAND || 'xdg-open';

// Define allowed voices
const ALLOWED_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type AllowedVoice = typeof ALLOWED_VOICES[number];

// Read default voice from env var, validate, and set default
let DEFAULT_VOICE: AllowedVoice = "nova"; 
const configuredDefaultVoice = process.env.DEFAULT_TTS_VOICE;
if (configuredDefaultVoice && (ALLOWED_VOICES as readonly string[]).includes(configuredDefaultVoice)) {
    DEFAULT_VOICE = configuredDefaultVoice as AllowedVoice;
    console.error(`Using configured default voice: ${DEFAULT_VOICE}`);
} else if (configuredDefaultVoice) {
    console.error(`Warning: Invalid DEFAULT_TTS_VOICE "${configuredDefaultVoice}" provided. Using default "alloy".`);
} else {
    console.error(`Using default voice: ${DEFAULT_VOICE}`);
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');

const openai = new OpenAI({
  apiKey: API_KEY,
});

// --- MCP Server Setup ---
const server = new Server(
  {
    name: "@pink/pixel/blabber-mcp",
    version: "0.1.2", 
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// --- Tool Definition ---
const TEXT_TO_SPEECH_TOOL_NAME = "text_to_speech";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: TEXT_TO_SPEECH_TOOL_NAME,
        description: `Converts text into spoken audio using OpenAI TTS (default voice: ${DEFAULT_VOICE}), saves it to a file, and optionally plays it.`, // Updated description
        inputSchema: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "The text to synthesize into speech.",
            },
            voice: {
              type: "string",
              description: `Optional: The voice to use. Overrides the configured default (${DEFAULT_VOICE}).`,
              enum: [...ALLOWED_VOICES], // Use the defined constant
            },
            model: {
              type: "string",
              description: "The TTS model to use.",
              enum: ["tts-1", "tts-1-hd"],
              default: "tts-1",
            },
            response_format: {
              type: "string",
              description: "The format of the audio response.",
              enum: ["mp3", "opus", "aac", "flac"],
              default: "mp3",
            },
            play: {
              type: "boolean",
              description: "Whether to automatically play the generated audio file.",
              default: false,
            }
          },
          required: ["input"],
        },
      },
    ],
  };
});

// --- Tool Implementation ---

type TextToSpeechArgs = {
  input: string;
  voice?: AllowedVoice; // Use the specific type
  model?: "tts-1" | "tts-1-hd";
  response_format?: "mp3" | "opus" | "aac" | "flac";
  play?: boolean;
};

// Updated type guard
function isValidTextToSpeechArgs(args: any): args is TextToSpeechArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.input === "string" &&
    (args.voice === undefined || (ALLOWED_VOICES as readonly string[]).includes(args.voice)) && // Validate against allowed voices
    (args.model === undefined || ["tts-1", "tts-1-hd"].includes(args.model)) &&
    (args.response_format === undefined || ["mp3", "opus", "aac", "flac"].includes(args.response_format)) &&
    (args.play === undefined || typeof args.play === 'boolean')
  );
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== TEXT_TO_SPEECH_TOOL_NAME) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }

  if (!isValidTextToSpeechArgs(request.params.arguments)) {
    throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for text_to_speech tool.");
  }

  const {
    input,
    // Use voice from args if provided, otherwise use the configured DEFAULT_VOICE
    voice = DEFAULT_VOICE,
    model = "tts-1",
    response_format = "mp3",
    play = false,
  } = request.params.arguments;

  // Ensure the final voice is valid (handles case where default might somehow be invalid, though unlikely with validation above)
  const finalVoice: AllowedVoice = (ALLOWED_VOICES as readonly string[]).includes(voice) ? voice : DEFAULT_VOICE;


  let playbackMessage = "";

  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.error(`Created output directory: ${OUTPUT_DIR}`);
    }

    console.error(`Generating speech with voice: ${finalVoice}`); // Log the voice being used

    const speechResponse = await openai.audio.speech.create({
      model: model,
      voice: finalVoice, // Use the validated final voice
      input: input,
      response_format: response_format,
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const timestamp = Date.now();
    const filename = `speech_${timestamp}.${response_format}`;
    const filePath = path.join(OUTPUT_DIR, filename);
    const relativeFilePath = path.relative(process.cwd(), filePath);

    fs.writeFileSync(filePath, audioBuffer);
    console.error(`Audio saved to: ${filePath}`);

    if (play) {
      const command = `${AUDIO_PLAYER_COMMAND} "${filePath}"`;
      console.error(`Attempting to play audio with command: ${command}`);
      exec(command, (error, stdout, stderr) => {
        if (error) console.error(`Playback Error: ${error.message}`);
        if (stderr) console.error(`Playback Stderr: ${stderr}`);
        if (stdout) console.error(`Playback stdout: ${stdout}`);
      });
      playbackMessage = ` Playback initiated using command: ${AUDIO_PLAYER_COMMAND}.`;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: `Audio saved successfully.${playbackMessage}`,
            filePath: relativeFilePath,
            format: response_format,
            voiceUsed: finalVoice, // Inform client which voice was actually used
          }),
          mimeType: "application/json",
        },
      ],
    };
  } catch (error) {
    let errorMessage = "Failed to generate speech.";
    if (error instanceof APIError) {
      errorMessage = `OpenAI API Error (${error.status}): ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(`[${TEXT_TO_SPEECH_TOOL_NAME} Error]`, errorMessage, error);
    return {
        content: [{ type: "text", text: errorMessage }],
        isError: true
    }
  }
});

// --- Server Start ---
async function main() {
  const transport = new StdioServerTransport();
  server.onerror = (error) => console.error("[MCP Error]", error);
  process.on('SIGINT', async () => {
      console.error("Received SIGINT, shutting down server...");
      await server.close();
      process.exit(0);
  });
  await server.connect(transport);
  console.error("OpenAI TTS MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});

// // // 负责输入 2-3 张图片 URL
// // // ↓
// // // OpenAI 看图
// // // ↓
// // // 返回风格总结文字
// // // lib/openai-vision.ts


// lib/openai-vision.ts

import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export type FashionVisionImage = {
  url: string
  source?: string
  alt?: string
}

function extractOutputText(data: any): string {
  const outputText = data?.output_text

  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim()
  }

  const output = data?.output

  if (Array.isArray(output)) {
    for (const item of output) {
      const content = item?.content

      if (!Array.isArray(content)) {
        continue
      }

      for (const contentItem of content) {
        if (
          contentItem?.type === "output_text" &&
          typeof contentItem?.text === "string"
        ) {
          return contentItem.text.trim()
        }
      }
    }
  }

  return ""
}

function buildRequestBody(images: FashionVisionImage[]) {
  const cleanedImages = images
    .filter((image) => image.url && image.url.startsWith("http"))
    .slice(0, 3)

  const imageInputs = cleanedImages.map((image) => ({
    type: "input_image",
    image_url: image.url,
    detail: "low",
  }))

  return {
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You are a fashion visual analyst.

Analyze these fashion reference images and summarize the current visual style.

Focus only on:
- color palette
- silhouette
- materials / texture
- styling mood
- femininity / masculinity balance
- luxury level
- outfit formulas
- what this suggests for a personal style DNA

Return Chinese output.
Do not identify people.
Do not describe irrelevant background details.
Keep it concise and useful for a styling assistant.`,
          },
          ...imageInputs,
        ],
      },
    ],
    max_output_tokens: 500,
  }
}

async function callOpenAIWithFetch(
  apiKey: string,
  requestBody: Record<string, unknown>,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    console.warn(
      "[OpenAI Vision] Fetch failed:",
      response.status,
      await response.text(),
    )
    return ""
  }

  const data = await response.json()
  return extractOutputText(data)
}

async function callOpenAIWithLocalCurl(
  apiKey: string,
  requestBody: Record<string, unknown>,
): Promise<string> {
  const { stdout } = await execFileAsync(
    "curl",
    [
      "-sS",
      "--connect-timeout",
      "15",
      "--max-time",
      "60",
      "https://api.openai.com/v1/responses",
      "-H",
      `Authorization: Bearer ${apiKey}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify(requestBody),
    ],
    {
      timeout: 70000,
      maxBuffer: 1024 * 1024 * 5,
      env: {
        ...process.env,
        ALL_PROXY: process.env.ALL_PROXY || "socks5h://127.0.0.1:1081",
        all_proxy: process.env.all_proxy || "socks5h://127.0.0.1:1081",
      },
    },
  )

  const data = JSON.parse(stdout)

  if (data?.error) {
    console.warn("[OpenAI Vision] Local curl API error:", data.error)
    return ""
  }

  return extractOutputText(data)
}

export async function analyzeFashionImagesWithOpenAI(
  images: FashionVisionImage[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn("[OpenAI Vision] Missing OPENAI_API_KEY.")
    return ""
  }

  const cleanedImages = images
    .filter((image) => image.url && image.url.startsWith("http"))
    .slice(0, 3)

  if (cleanedImages.length === 0) {
    return ""
  }

  const requestBody = buildRequestBody(cleanedImages)

  try {
    const result = await callOpenAIWithFetch(apiKey, requestBody)

    if (result) {
      console.log("[OpenAI Vision] Fetch success.")
      return result
    }
  } catch (error) {
    console.warn("[OpenAI Vision] Fetch error:", error)
  }

  if (process.env.VERCEL === "1") {
    console.warn("[OpenAI Vision] Running on Vercel, skip local curl fallback.")
    return ""
  }

  try {
    const result = await callOpenAIWithLocalCurl(apiKey, requestBody)

    if (result) {
      console.log("[OpenAI Vision] Local curl success.")
      return result
    }
  } catch (error) {
    console.warn("[OpenAI Vision] Local curl error:", error)
  }

  return ""
}
/**
 * 火山引擎 API 配置
 *
 * 注意：此文件包含密钥，已加入 .gitignore，请勿提交到 git 仓库。
 * 比赛规则：大区赛允许接入 AI API。
 */

/*
 * ============================================================
 *  一、API Key
 * ============================================================
 * Key 名称: api-key-20260729235320
 * Key 值:   f9433291-23b1-4dfc-bb40-663d12d82786
 * 来源:    火山引擎控制台 > API Key 管理
 * ============================================================
 */
export const API_KEY = 'f9433291-23b1-4dfc-bb40-663d12d82786';

/*
 * ============================================================
 *  二、豆包语音合成 TTS（Chat / 安抚话语用）
 *  文档: https://www.volcengine.com/docs/6561/2534847
 * ============================================================
 */
export const TTS_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/create';

export const TTS_MODEL = 'seed-audio-1.0-multilingual';

/** TTS 鉴权头（使用 X-Api-Key，不是 Bearer） */
export function buildTTSHeaders(requestId = crypto.randomUUID()) {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
    'X-Api-Request-Id': requestId,
  };
}

/*
 * ============================================================
 *  三、豆包大模型 Chat Completions（文本/视觉/OCR）
 *  需在 Ark 控制台创建推理接入点后获得 endpoint_id
 * ============================================================
 */
export const ARK_CHAT_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

/** TODO: 推理接入点 ID，需在火山引擎 Ark 控制台创建并填入 */
export const ARK_ENDPOINT_ID = 'TODO-ep-xxxxxxxx';

/** Chat 鉴权头（Bearer 方式） */
export function buildChatHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };
}

/*
 * ============================================================
 *  四、通用配置
 * ============================================================
 */

/** HTTP 请求超时（毫秒） */
export const API_TIMEOUT_MS = 15000;

/** 兜底重试次数 */
export const API_MAX_RETRIES = 1;

/**
 * 带超时的 fetch 封装
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  return fetch(url, Object.assign({ signal: controller.signal }, options)).finally(function () {
    clearTimeout(timer);
  });
}

/*
 * ============================================================
 *  五、TTS 调用封装
 *  已实测：HTTP 200，返回 Base64 WAV 音频
 * ============================================================
 */

/**
 * 调用豆包 TTS 生成音频
 * @param {Object} opts
 * @param {string} opts.text - 合成文本（纯文本模式）最大3000字符
 * @param {string} [opts.model] - 默认 seed-audio-1.0-multilingual
 * @param {'wav'|'mp3'|'pcm'|'ogg_opus'} [opts.format] - 输出格式，默认 wav
 * @param {number} [opts.sampleRate] - 采样率，默认 24000
 * @param {number} [opts.speechRate] - 语速 -50~100
 * @param {number} [opts.loudnessRate] - 音量 -50~100
 * @param {number} [opts.pitchRate] - 音调 -12~12
 * @param {Object} [opts.audioRef] - 参考音频 { url?: string, data?: string }
 * @param {Object} [opts.imageRef] - 参考图片 { url?: string, data?: string }
 * @returns {Promise<{ok: boolean, audioBase64?: string, audioUrl?: string, duration?: number, error?: string}>}
 */
export async function ttsGenerate(opts = {}) {
  const {
    text = '',
    model = TTS_MODEL,
    format = 'wav',
    sampleRate = 24000,
    speechRate,
    loudnessRate,
    pitchRate,
    audioRef,
    imageRef,
  } = opts;

  if (!text.trim()) {
    return { ok: false, error: 'text_prompt 不能为空' };
  }

  const body = {
    model,
    text_prompt: text.slice(0, 3000),
    audio_config: {
      format,
      sample_rate: sampleRate,
    },
  };

  if (speechRate !== undefined) body.audio_config.speech_rate = speechRate;
  if (loudnessRate !== undefined) body.audio_config.loudness_rate = loudnessRate;
  if (pitchRate !== undefined) body.audio_config.pitch_rate = pitchRate;

  // 参考音频（与 speaker 互斥）
  if (audioRef) {
    if (audioRef.url) body.audio_url = audioRef.url;
    else if (audioRef.data) body.audio_data = audioRef.data;
  }

  // 参考图片（与音频参考互斥）
  if (imageRef) {
    if (imageRef.url) body.image_url = imageRef.url;
    else if (imageRef.data) body.image_data = imageRef.data;
  }

  try {
    const resp = await fetchWithTimeout(TTS_ENDPOINT, {
      method: 'POST',
      headers: buildTTSHeaders(),
      body: JSON.stringify(body),
    }, 30000); // TTS 生成最长 ~15s

    if (!resp.ok) {
      const errText = await resp.text();
      return { ok: false, error: `HTTP ${resp.status}: ${errText.slice(0, 200)}` };
    }

    const json = await resp.json();

    // API 返回结构: { audio, url, duration, original_duration }
    // 没有 code 字段，有 audio 即成功
    if (json.audio || json.url) {
      return {
        ok: true,
        audioBase64: json.audio || undefined,
        audioUrl: json.url || undefined,
        duration: json.duration || json.original_duration || undefined,
      };
    }

    return { ok: false, error: 'TTS 响应中未找到音频数据' };
  } catch (e) {
    return { ok: false, error: `网络错误: ${e.message}` };
  }
}

/**
 * 音频格式转换工具 - 支持 iOS 兼容性
 * iOS 不支持 WebM，需要转换为 MP4/AAC 或 WAV
 */

/**
 * 检测浏览器是否支持特定的音频 MIME 类型
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  try {
    return MediaRecorder.isTypeSupported(mimeType);
  } catch {
    return false;
  }
}

/**
 * 获取最佳的音频 MIME 类型（优先级：MP4 > WAV > WebM）
 */
export function getBestAudioMimeType(): string {
  const mimeTypes = [
    'audio/mp4',
    'audio/aac',
    'audio/wav',
    'audio/webm;codecs=opus',
    'audio/webm',
  ];

  for (const mimeType of mimeTypes) {
    if (isMimeTypeSupported(mimeType)) {
      console.log('Using MIME type:', mimeType);
      return mimeType;
    }
  }

  // 默认回退到 webm（桌面浏览器通常支持）
  console.warn('No supported MIME type found, falling back to audio/webm');
  return 'audio/webm';
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/mp4': 'mp4',
    'audio/aac': 'aac',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
  };
  return mimeToExt[mimeType] || 'webm';
}

/**
 * 将 Blob 转换为 WAV 格式（通用兼容格式）
 * 这是一个备选方案，当浏览器不支持其他格式时使用
 */
export async function convertBlobToWav(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 尝试解码音频
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 转换为 WAV
    return audioBufferToWav(audioBuffer);
  } catch (error) {
    console.error('Failed to convert to WAV:', error);
    // 如果转换失败，返回原始 blob
    return blob;
  }
}

/**
 * 将 AudioBuffer 转换为 WAV Blob
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = {
    numberOfChannels,
    sampleRate,
  };
  const audioData = {
    left: audioBuffer.getChannelData(0),
    right: numberOfChannels > 1 ? audioBuffer.getChannelData(1) : audioBuffer.getChannelData(0),
  };
  const wavBytes = encodeWAV(audioData, format);
  return new Blob([wavBytes], { type: 'audio/wav' });
}

/**
 * 编码 WAV 文件
 */
function encodeWAV(
  audioData: { left: Float32Array; right: Float32Array },
  format: { numberOfChannels: number; sampleRate: number }
): ArrayBuffer {
  const { left, right } = audioData;
  const { numberOfChannels, sampleRate } = format;
  const length = left.length;
  const interleaved = new Float32Array(length * numberOfChannels);

  let index = 0;
  const inputIndex = 0;

  while (index < length) {
    interleaved[inputIndex * numberOfChannels] = left[index];
    if (numberOfChannels > 1) {
      interleaved[inputIndex * numberOfChannels + 1] = right[index];
    }
    index++;
  }

  const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2 * numberOfChannels, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  floatTo16BitPCM(view, 44, interleaved);

  return buffer;
}

/**
 * 检测是否是 iOS 设备
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * 检测是否是 Safari 浏览器
 */
export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

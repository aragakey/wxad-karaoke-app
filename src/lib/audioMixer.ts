/**
 * 音频混音工具 - 将多个音频轨道混合为一个
 */

export async function mixAudioTracks(
  backingTrackUrl: string,
  recordings: Array<{
    id: string;
    audioUrl: string;
    startTime: number;
    endTime: number;
  }>,
  totalDuration: number
): Promise<Blob> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 加载所有音频
    const backingTrackBuffer = await fetchAndDecodeAudio(audioContext, backingTrackUrl);
    const recordingBuffers = await Promise.all(
      recordings.map(async (recording) => ({
        buffer: await fetchAndDecodeAudio(audioContext, recording.audioUrl),
        startTime: recording.startTime,
        endTime: recording.endTime,
      }))
    );

    // 创建离线音频上下文用于渲染
    const offlineContext = new OfflineAudioContext(
      2, // 立体声
      Math.ceil(audioContext.sampleRate * totalDuration),
      audioContext.sampleRate
    );

    // 创建增益节点以控制音量
    const backingGain = offlineContext.createGain();
    backingGain.gain.value = 0.3; // 伴奏 30%
    backingGain.connect(offlineContext.destination);

    // 混合伴奏
    const backingSource = offlineContext.createBufferSource();
    backingSource.buffer = backingTrackBuffer;
    backingSource.connect(backingGain);
    backingSource.start(0);

    // 混合所有人声
    recordingBuffers.forEach(({ buffer, startTime, endTime }) => {
      const recordingGain = offlineContext.createGain();
      recordingGain.gain.value = 0.7 / Math.max(1, recordingBuffers.length); // 人声总共 70%，平均分配
      recordingGain.connect(offlineContext.destination);

      const source = offlineContext.createBufferSource();
      source.buffer = buffer;
      source.connect(recordingGain);
      
      // 计算实际应该播放的时长
      const duration = endTime - startTime;
      source.start(startTime, 0, duration);
    });

    // 渲染混合后的音频
    const renderedBuffer = await offlineContext.startRendering();

    // 转换为 Blob
    return audioBufferToBlob(renderedBuffer);
  } catch (error) {
    console.error('Error in mixAudioTracks:', error);
    throw error;
  }
}

async function fetchAndDecodeAudio(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

function audioBufferToBlob(audioBuffer: AudioBuffer): Blob {
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

function encodeWAV(
  audioData: { left: Float32Array; right: Float32Array },
  format: { numberOfChannels: number; sampleRate: number }
): ArrayBuffer {
  const { left, right } = audioData;
  const { numberOfChannels, sampleRate } = format;
  const length = left.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataLength = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  // WAV 文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // 写入音频数据
  let offset = 44;
  for (let i = 0; i < length; i++) {
    // 左声道 - 添加削波保护
    let leftSample = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7fff, true);
    offset += 2;

    // 右声道 - 添加削波保护
    if (numberOfChannels > 1) {
      let rightSample = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

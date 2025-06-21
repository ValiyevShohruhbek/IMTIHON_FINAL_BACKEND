import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { Injectable } from '@nestjs/common';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
@Injectable()
class VideoService {
  constructor() {
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
    ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
  }
  getVideoResolution(videoPath: string) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );
        const video = videoStream;
        resolve({ width: video?.width, height: video?.height });
      });
    });
  }
  convertToResolutions(
    inputPath: string,
    outputBasePath: string,
    resolutions: any,
  ) {
    return resolutions.map((res: { height: number }) => {
      return new Promise((resolve, reject) => {
        const output = `${outputBasePath}/${res.height}p.mp4`;
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .size(`?x${res.height}`) // width proportional
          .outputOptions(['-preset fast', '-crf 23', '-movflags +faststart'])
          .on('end', () => {
            console.log(`✅ ${res.height}p created.`);
            resolve('ok');
          })
          .on('progress', (progress) => {
            const progressMonitor = `${Math.floor(progress.percent as number)}%`;
            console.log(progressMonitor);
          })
          .on('error', (err) => {
            console.error(`❌ Error at ${res.height}p:`, err);
            reject(err);
          })
          .save(output);
      });
    });
  }
  getChunkProps(range: string, fileSize: number) {
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start;

      return {
        start,
        end,
        chunkSize,
      };
    }
    return {
      start: 0,
      end: fileSize,
      chunkSize: fileSize,
    };
  }
}
export default VideoService;

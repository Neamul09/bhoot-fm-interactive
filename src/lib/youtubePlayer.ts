declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, any>;
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number; target: any }) => void;
            onError?: (event: { data: number; target: any }) => void;
          };
        }
      ) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type PlayerStateChangeHandler = (state: 'playing' | 'paused' | 'buffering' | 'ended' | 'cued') => void;
export type PlayerTimeUpdateHandler = (currentTime: number, duration: number) => void;
export type PlayerErrorHandler = (errorCode: number, message: string) => void;

export class YouTubePlayerController {
  private player: any = null;
  private timerId: number | null = null;
  private isReady: boolean = false;
  private currentVideoId: string = '';

  private onStateChangeCb?: PlayerStateChangeHandler;
  private onTimeUpdateCb?: PlayerTimeUpdateHandler;
  private onErrorCb?: PlayerErrorHandler;

  constructor(callbacks?: {
    onStateChange?: PlayerStateChangeHandler;
    onTimeUpdate?: PlayerTimeUpdateHandler;
    onError?: PlayerErrorHandler;
  }) {
    if (callbacks) {
      this.onStateChangeCb = callbacks.onStateChange;
      this.onTimeUpdateCb = callbacks.onTimeUpdate;
      this.onErrorCb = callbacks.onError;
    }
  }

  /**
   * Loads the YouTube IFrame API script tag if not already loaded.
   */
  public static loadApi(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve();
      if (window.YT && window.YT.Player) {
        return resolve();
      }

      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousReady) previousReady();
        resolve();
      };

      // Fallback check if already loaded
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Initializes player in the target container
   */
  public async init(containerId: string, videoId: string, initialVolume: number = 80): Promise<void> {
    await YouTubePlayerController.loadApi();
    this.currentVideoId = videoId;

    if (this.player) {
      this.destroy();
    }

    return new Promise((resolve) => {
      this.player = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event) => {
            this.isReady = true;
            try {
              event.target.setVolume(initialVolume);
            } catch (e) {
              console.warn('Could not set initial volume', e);
            }
            resolve();
          },
          onStateChange: (event) => {
            this.handleStateChange(event.data);
          },
          onError: (event) => {
            this.handleError(event.data);
          },
        },
      });
    });
  }

  private handleStateChange(stateCode: number) {
    if (!window.YT) return;
    const { PlayerState } = window.YT;

    switch (stateCode) {
      case PlayerState.PLAYING:
        this.startTimeLoop();
        this.onStateChangeCb?.('playing');
        break;
      case PlayerState.PAUSED:
        this.stopTimeLoop();
        this.onStateChangeCb?.('paused');
        break;
      case PlayerState.BUFFERING:
        this.onStateChangeCb?.('buffering');
        break;
      case PlayerState.ENDED:
        this.stopTimeLoop();
        this.onStateChangeCb?.('ended');
        break;
      case PlayerState.CUED:
        this.onStateChangeCb?.('cued');
        break;
    }
  }

  private handleError(code: number) {
    let message = 'An error occurred while loading the YouTube episode.';
    switch (code) {
      case 2:
        message = 'Invalid YouTube video ID parameter.';
        break;
      case 5:
        message = 'The requested content cannot be played in an HTML5 player.';
        break;
      case 100:
        message = 'The requested video was not found or has been marked as private.';
        break;
      case 101:
      case 150:
        message = 'The owner of this YouTube video does not allow it to be played in embedded players. Please choose another episode or authorized stream.';
        break;
    }
    this.onErrorCb?.(code, message);
  }

  private startTimeLoop() {
    this.stopTimeLoop();
    this.timerId = window.setInterval(() => {
      if (this.player && this.player.getCurrentTime && this.player.getDuration) {
        try {
          const currentTime = this.player.getCurrentTime() || 0;
          const duration = this.player.getDuration() || 0;
          this.onTimeUpdateCb?.(currentTime, duration);
        } catch {
          // Ignore transient cross-frame errors during fast seeks
        }
      }
    }, 150);
  }

  private stopTimeLoop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public play(): void {
    if (this.player && this.player.playVideo) {
      try {
        this.player.playVideo();
      } catch (e) {
        console.warn('playVideo failed', e);
      }
    }
  }

  public pause(): void {
    if (this.player && this.player.pauseVideo) {
      try {
        this.player.pauseVideo();
      } catch (e) {
        console.warn('pauseVideo failed', e);
      }
    }
  }

  public seekTo(seconds: number, allowSeekAhead: boolean = true): void {
    if (this.player && this.player.seekTo) {
      try {
        this.player.seekTo(seconds, allowSeekAhead);
        const duration = this.player.getDuration ? this.player.getDuration() : 0;
        this.onTimeUpdateCb?.(seconds, duration);
      } catch (e) {
        console.warn('seekTo failed', e);
      }
    }
  }

  public setVolume(volume: number): void {
    if (this.player && this.player.setVolume) {
      try {
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        this.player.setVolume(clamped);
      } catch (e) {
        console.warn('setVolume failed', e);
      }
    }
  }

  public loadVideoById(videoId: string): void {
    this.currentVideoId = videoId;
    if (this.player && this.player.loadVideoById) {
      this.player.loadVideoById(videoId);
    }
  }

  public getCurrentTime(): number {
    if (this.player && this.player.getCurrentTime) {
      return this.player.getCurrentTime() || 0;
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && this.player.getDuration) {
      return this.player.getDuration() || 0;
    }
    return 0;
  }

  public isReadyState(): boolean {
    return this.isReady;
  }

  public destroy(): void {
    this.stopTimeLoop();
    if (this.player && this.player.destroy) {
      try {
        this.player.destroy();
      } catch (e) {
        console.warn('destroy failed', e);
      }
      this.player = null;
    }
    this.isReady = false;
  }
}

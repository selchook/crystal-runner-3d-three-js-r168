import * as THREE from 'three';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private listener: THREE.AudioListener;
  private isMuted = false;

  constructor() {
    this.listener = new THREE.AudioListener();
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  public getListener(): THREE.AudioListener {
    return this.listener;
  }

  public mute() {
    this.isMuted = true;
  }

  public unmute() {
    this.isMuted = false;
  }

  public playTone(frequency: number, duration: number, volume = 0.1) {
    if (this.isMuted || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  public playCollectSound() {
    this.playTone(800, 0.2, 0.05);
  }

  public playHitSound() {
    this.playTone(150, 0.3, 0.08);
  }

  public playMenuSound() {
    this.playTone(600, 0.1, 0.03);
  }
}
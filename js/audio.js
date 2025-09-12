// audio.js
import { generateSong, generateSound } from './sonantx.js';

let audioCtx;
let masterGain;
let music;

// A default instrument with all properties required by sonantx's sound generator
const defaultInstrument = {
    osc1_oct: 0, osc1_det: 0, osc1_detune: 0, osc1_xenv: 0, osc1_vol: 0, osc1_waveform: 0,
    osc2_oct: 0, osc2_det: 0, osc2_detune: 0, osc2_xenv: 0, osc2_vol: 0, osc2_waveform: 0,
    noise_fader: 0,
    env_attack: 0, env_sustain: 0, env_release: 0, env_master: 192,
    fx_filter: 0, fx_freq: 11025, fx_resonance: 255, fx_delay_time: 0, fx_delay_amt: 0,
    fx_pan_freq: 0, fx_pan_amt: 0,
    lfo_osc1_freq: 0, lfo_fx_freq: 0, lfo_freq: 0, lfo_amt: 0, lfo_waveform: 0,
};

// Define only the unique properties for each sound effect
const soundEffects = {
    move: {
        instrument: { osc1_oct: 7, osc1_vol: 120, osc1_waveform: 2, env_attack: 10, env_sustain: 80, env_release: 100, fx_filter: 2, fx_freq: 1200, fx_resonance: 100, },
        note: 140
    },
    town: {
        instrument: { osc1_oct: 6, osc1_det: 4, osc1_vol: 150, osc1_waveform: 1, osc2_oct: 6, osc2_vol: 150, osc2_waveform: 1, env_attack: 200, env_sustain: 200, env_release: 300, fx_filter: 2, fx_freq: 900, fx_resonance: 120, },
        note: 145
    },
    event: {
        instrument: { osc1_oct: 6, osc1_vol: 150, osc1_waveform: 3, lfo_osc1_freq: 1, lfo_freq: 4, lfo_amt: 80, env_attack: 300, env_sustain: 150, env_release: 300, fx_filter: 2, fx_freq: 2000, fx_resonance: 80, },
        note: 150
    },
    buy: {
        instrument: { noise_fader: 150, env_attack: 10, env_sustain: 50, env_release: 80, fx_filter: 1, fx_freq: 3000, fx_resonance: 100, },
        note: 155
    },
    sell: {
        instrument: { osc1_oct: 8, osc1_vol: 180, osc1_waveform: 0, env_attack: 50, env_sustain: 50, env_release: 100, fx_filter: 2, fx_freq: 1500, fx_resonance: 100, },
        note: 160
    },
    error: {
        instrument: { osc1_oct: 5, osc1_detune: 10, osc1_vol: 150, osc1_waveform: 2, env_attack: 10, env_sustain: 10, env_release: 150, fx_filter: 2, fx_freq: 400, fx_resonance: 130, },
        note: 120
    }
};

export function initAudio() {
    if (audioCtx) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain for volume control
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
        
        if (audioCtx.state === 'suspended') {
            console.log("AudioContext is suspended. Attempting to resume...");
            audioCtx.resume();
        }
        console.log("AudioContext initialized, state:", audioCtx.state);
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
    }
}

export async function playMusic() {
    if (!audioCtx || audioCtx.state !== 'running' || music) {
        console.warn(`Cannot play music. AudioContext state: ${audioCtx?.state}, Music exists: ${!!music}`);
        return;
    }

    try {
        console.log("Fetching music.json...");
        const response = await fetch('music.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch music.json: ${response.statusText}`);
        }
        const songData = await response.json();
        console.log("Music data loaded");
        
        // Use generateSong instead of MusicGenerator
        const buffer = await generateSong(songData, audioCtx.sampleRate);
        console.log("Music buffer generated");
        
        const bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        bufferSource.connect(masterGain);
        bufferSource.start();
        
        music = bufferSource; // Store reference to stop later if needed
        console.log("Background music started.");
    } catch (error) {
        console.error("Failed to load or play music:", error);
    }
}

export async function playSound(effectName) {
    if (!audioCtx || audioCtx.state !== 'running') return;

    const effect = soundEffects[effectName];
    if (!effect) {
        console.warn(`Sound effect "${effectName}" not found.`);
        return;
    }

    try {
        const finalInstrument = { ...defaultInstrument, ...effect.instrument };
        const buffer = await generateSound(finalInstrument, effect.note, audioCtx.sampleRate);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(masterGain);
        source.start();
    } catch (error) {
        console.error(`Failed to generate sound for "${effectName}":`, error);
    }
}
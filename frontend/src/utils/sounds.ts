// Sound effect utility for chess moves
let moveSound: HTMLAudioElement | null = null;
let captureSound: HTMLAudioElement | null = null;
let checkSound: HTMLAudioElement | null = null;
let soundsLoaded = false;

const createSound = (path: string): HTMLAudioElement => {
    const audio = new Audio(`/sounds/${path}`);
    audio.preload = 'auto';
    return audio;
};

export const loadSounds = async (): Promise<void> => {
    try {
        // Create sound instances if they don't exist
        moveSound = moveSound || createSound('move.mp3');
        captureSound = captureSound || createSound('capture.mp3');
        checkSound = checkSound || createSound('check.mp3');

        // Load all sounds and wait for them to be ready
        await Promise.all([
            moveSound.load(),
            captureSound.load(),
            checkSound.load()
        ]);

        soundsLoaded = true;
    } catch (error) {
        console.error('Failed to load sounds. Please check if sound files exist in public/sounds/ directory:', error);
        soundsLoaded = false;
    }
};

export const playMoveSound = async (move: string, isCheck: boolean = false): Promise<void> => {
    if (!soundsLoaded) {
        await loadSounds();
    }

    try {
        let soundToPlay = isCheck ? checkSound : 
                         move.includes('x') ? captureSound : 
                         moveSound;

        if (soundToPlay) {
            soundToPlay.currentTime = 0;
            await soundToPlay.play();
        }
    } catch (error) {
        console.warn(`Failed to play sound for move ${move}:`, error);
        if ((error as any)?.name === 'NotSupportedError') {
            console.error('Sound files not found or not supported. Please verify files exist in public/sounds/ directory');
        }
    }
};

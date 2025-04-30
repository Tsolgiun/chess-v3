// Sound effect utility for chess moves
const moveSound: HTMLAudioElement = new Audio('/sounds/move.mp3');
const captureSound: HTMLAudioElement = new Audio('/sounds/capture.mp3');
const checkSound: HTMLAudioElement = new Audio('/sounds/check.mp3');

export const loadSounds = (): void => {
    // Preload sounds
    [moveSound, captureSound, checkSound].forEach(sound => {
        sound.load();
    });
};

export const playMoveSound = (move: string, isCheck: boolean = false): void => {
    try {
        if (isCheck) {
            checkSound.currentTime = 0;
            checkSound.play();
        } else if (move.includes('x')) {
            captureSound.currentTime = 0;
            captureSound.play();
        } else {
            moveSound.currentTime = 0;
            moveSound.play();
        }
    } catch (error) {
        console.warn('Failed to play sound:', error);
    }
};

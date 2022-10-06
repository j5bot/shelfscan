export const removeStreamTracks = (stream: MediaStream): void => {
    stream.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
        stream.removeTrack(track);
    });
};

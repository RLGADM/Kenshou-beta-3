export function copyRoomLink(roomCode: string) {
  const roomLink = `${window.location.origin}/join/${roomCode}`;
  navigator.clipboard.writeText(roomLink).then(
    () => {
      console.log('Room link copied to clipboard:', roomLink);
    },
    (err) => {
      console.error('Could not copy room link: ', err);
    }
  );
}

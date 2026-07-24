export type MusicTrack = { id: string; label: string; file: string };

export const musicTracks: MusicTrack[] = [
  { id: "tic-tac-quiz", label: "Tic Tac Quiz (original)", file: "/musicas/tic-tac-quiz.mp3" },
  { id: "tic-tac-arcade", label: "Arcade", file: "/musicas/tic-tac-arcade.mp3" },
  { id: "tic-tac-bandinha", label: "Bandinha", file: "/musicas/tic-tac-bandinha.mp3" },
  { id: "tic-tac-country", label: "Country", file: "/musicas/tic-tac-country.mp3" },
  { id: "tic-tac-game", label: "Game", file: "/musicas/tic-tac-game.mp3" },
  { id: "tic-tac-rock", label: "Rock", file: "/musicas/tic-tac-rock.mp3" },
  { id: "tic-tac-samba", label: "Samba", file: "/musicas/tic-tac-samba.mp3" },
  { id: "tic-tac-sertanejo", label: "Sertanejo", file: "/musicas/tic-tac-sertanejo.mp3" },
];

export const defaultMusicTrack = "tic-tac-quiz";

export type MusicScope = "all" | "host" | "off";

export function musicTrackFile(id: string): string {
  return musicTracks.find(t => t.id === id)?.file ?? musicTracks[0].file;
}

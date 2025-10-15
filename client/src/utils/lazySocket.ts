// Lazy load socket.io client only when needed (Fix #9)
let socketIOPromise: Promise<typeof import("socket.io-client")> | null = null;

export const loadSocketIO = () => {
  if (!socketIOPromise) {
    socketIOPromise = import("socket.io-client");
  }
  return socketIOPromise;
};

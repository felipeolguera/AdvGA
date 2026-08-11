import { joinRoom, selfId } from "@trystero-p2p/mqtt";

const APP_ID = "advga-playtest-v1";
const ROOM_PREFIX = "advga-mp-";

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export function getSelfPeerId() {
  return selfId;
}

/**
 * Peer-to-peer playtest room over WebRTC (MQTT signaling).
 * Roles: table (shared board), a / b (player phones).
 */
export function connectPlaytestRoom({
  roomCode,
  role,
  onPeerJoin,
  onPeerLeave,
  onPresence,
  onSeat,
  onMeta,
  onHello,
}) {
  const code = normalizeRoomCode(roomCode);
  if (!code) {
    throw new Error("Room code is required.");
  }
  if (!["table", "a", "b"].includes(role)) {
    throw new Error("Role must be table, a, or b.");
  }

  const room = joinRoom({ appId: APP_ID }, `${ROOM_PREFIX}${code}`);
  const seatAction = room.makeAction("seat");
  const metaAction = room.makeAction("meta");
  const helloAction = room.makeAction("hello");

  const peers = new Set();

  const emitPresence = () => {
    onPresence?.({
      peerCount: peers.size,
      peerIds: [...peers],
      selfId,
    });
  };

  room.onPeerJoin = (peerId) => {
    peers.add(peerId);
    emitPresence();
    onPeerJoin?.(peerId);
  };

  room.onPeerLeave = (peerId) => {
    peers.delete(peerId);
    emitPresence();
    onPeerLeave?.(peerId);
  };

  seatAction.onMessage = (data, { peerId }) => {
    if (!data || typeof data !== "object") {
      return;
    }
    onSeat?.(data, peerId);
  };

  metaAction.onMessage = (data, { peerId }) => {
    if (!data || typeof data !== "object") {
      return;
    }
    onMeta?.(data, peerId);
  };

  helloAction.onMessage = (data, { peerId }) => {
    if (!data || typeof data !== "object") {
      return;
    }
    onHello?.(data, peerId);
  };

  // Seed current peers (joinRoom may already know some).
  try {
    Object.keys(room.getPeers?.() || {}).forEach((peerId) => peers.add(peerId));
  } catch {
    // ignore
  }
  emitPresence();

  return {
    roomCode: code,
    role,
    selfId,
    sendSeat: (payload) => seatAction.send(payload),
    sendMeta: (payload) => metaAction.send(payload),
    sendHello: (payload) => helloAction.send(payload),
    getPeerCount: () => peers.size,
    async leave() {
      seatAction.onMessage = null;
      metaAction.onMessage = null;
      helloAction.onMessage = null;
      room.onPeerJoin = null;
      room.onPeerLeave = null;
      await room.leave();
    },
  };
}

export function buildJoinUrl({ baseUrl, roomCode, role }) {
  const url = new URL(baseUrl, window.location.href);
  url.searchParams.set("room", normalizeRoomCode(roomCode));
  url.searchParams.set("role", role);
  return url.href;
}

export function readRoomParams(search = window.location.search) {
  const params = new URLSearchParams(search);
  const room = normalizeRoomCode(params.get("room"));
  const roleRaw = String(params.get("role") || "").toLowerCase();
  const role = ["table", "a", "b"].includes(roleRaw) ? roleRaw : null;
  return { room, role };
}

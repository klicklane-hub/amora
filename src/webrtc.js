import { supabase } from "./main";

const iceServers = (() => {
  try {
    const raw = import.meta.env.VITE_AMORA_ICE_SERVERS;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

export function createMediaCall({ callId, isCaller, callType, onRemoteStream, onState, onError }) {
  let channel;
  let pc;
  let localStream;
  let closed = false;
  let pendingCandidates = [];

  const send = async (event, payload) => {
    if (!channel) return;
    await channel.send({ type: "broadcast", event, payload });
  };

  const ensurePeer = async () => {
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = async (event) => {
      if (event.candidate) await send("ice", { candidate: event.candidate });
    };
    pc.ontrack = (event) => {
      if (event.streams[0]) onRemoteStream?.(event.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      onState?.(pc.connectionState);
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        if (pc.connectionState === "failed") onError?.("The media connection failed. Please try again.");
      }
    };
    pc.oniceconnectionstatechange = () => onState?.("ice:" + pc.iceConnectionState);
    return pc;
  };

  const startLocalMedia = async () => {
    if (localStream) return localStream;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not provide microphone/camera access.");
    const constraints = callType === "video"
      ? { audio: true, video: { facingMode: "user" } }
      : { audio: true, video: false };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    const peer = await ensurePeer();
    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    return localStream;
  };

  const handleOffer = async (offer) => {
    const peer = await ensurePeer();
    await startLocalMedia();
    await peer.setRemoteDescription(offer);
    for (const candidate of pendingCandidates.splice(0)) await peer.addIceCandidate(candidate);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await send("answer", { answer });
  };

  const handleAnswer = async (answer) => {
    if (!pc) return;
    await pc.setRemoteDescription(answer);
    for (const candidate of pendingCandidates.splice(0)) await pc.addIceCandidate(candidate);
  };

  const handleIce = async (candidate) => {
    const ice = new RTCIceCandidate(candidate);
    if (pc?.remoteDescription) await pc.addIceCandidate(ice);
    else pendingCandidates.push(ice);
  };

  const startOffer = async () => {
    await startLocalMedia();
    const peer = await ensurePeer();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await send("offer", { offer });
  };

  const connect = async () => {
    channel = supabase.channel("amora-call-" + callId, {
      config: { private: true, broadcast: { self: false } }
    });
    channel.on("broadcast", { event: "offer" }, ({ payload }) => handleOffer(payload.offer).catch(e => onError?.(e.message)));
    channel.on("broadcast", { event: "answer" }, ({ payload }) => handleAnswer(payload.answer).catch(e => onError?.(e.message)));
    channel.on("broadcast", { event: "ice" }, ({ payload }) => handleIce(payload.candidate).catch(e => onError?.(e.message)));
    channel.on("broadcast", { event: "hangup" }, () => close(false));
    const status = await channel.subscribe();
    if (status !== "SUBSCRIBED") throw new Error("Could not connect to the private call channel.");
    if (isCaller) await startOffer();
  };

  const close = async (broadcast = true) => {
    if (closed) return;
    closed = true;
    if (broadcast) await send("hangup", {});
    localStream?.getTracks().forEach(track => track.stop());
    pc?.close();
    if (channel) await supabase.removeChannel(channel);
  };

  return {
    connect,
    startLocalMedia,
    close
  };
}

import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket, MatchData } from "@heroiclabs/nakama-js";
import { useGameStore } from "../store/gameStore";

let client: Client;
let session: Session;
let socket: Socket;

const OPCODES = {
    MATCH_INFO: 1,
    MOVE: 2,
    ERROR: 3
};

/**
 * Safely parse RPC payloads. 
 * nakama-js may automatically parse JSON payloads into objects depending on server headers.
 */
const parsePayload = (payload: any): any => {
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload);
        } catch (e) {
            return payload;
        }
    }
    return payload;
};

export const initNakama = async (username?: string) => {
    const host = import.meta.env.VITE_NAKAMA_HOST || "127.0.0.1";
    const port = import.meta.env.VITE_NAKAMA_PORT || "7350";
    const serverKey = import.meta.env.VITE_NAKAMA_KEY || "defaultkey";
    const useSSL = import.meta.env.VITE_NAKAMA_SSL === "true";

    client = new Client(serverKey, host, port, useSSL);

    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);

    session = await client.authenticateDevice(deviceId, true);
    socket = client.createSocket(useSSL, false);
    await socket.connect(session, true);

    if (username) {
        await client.updateAccount(session, {
            display_name: username,
            username: username
        });
    }

    const account = await client.getAccount(session);
    useGameStore.getState().setUserInfo(session.user_id!, account.user?.username || session.username!);

    socket.onmatchdata = (matchstate: MatchData) => {
        if (matchstate.op_code === OPCODES.MATCH_INFO) {
            const data = JSON.parse(new TextDecoder().decode(matchstate.data));
            useGameStore.getState().setGameState(data);
        } else if (matchstate.op_code === OPCODES.ERROR) {
            const err = new TextDecoder().decode(matchstate.data);
            console.error("Server Error: ", err);
        }
    };

    return session;
};

export const createMatch = async (mode: "classic" | "timed") => {
    console.info(`[Nakama] Creating ${mode} match...`);
    try {
        const response = await client.rpc(session, "create_match", { mode });
        console.info("[Nakama] Create match RPC response:", response);
        
        if (response.payload) {
            const data = parsePayload(response.payload);
            const { matchId } = data;
            console.info("[Nakama] Joining created match:", matchId);
            await socket.joinMatch(matchId);
            useGameStore.getState().setMatchId(matchId);
            return matchId;
        }
    } catch (err) {
        console.error("[Nakama] Create match failed:", err);
        throw err;
    }
};

export const joinMatch = async (matchId: string) => {
    console.info("[Nakama] Joining match by ID:", matchId);
    try {
        await socket.joinMatch(matchId);
        console.info("[Nakama] Successfully joined match:", matchId);
        useGameStore.getState().setMatchId(matchId);
    } catch (err) {
        console.error("[Nakama] Join match failed:", err);
        throw err;
    }
};

export const leaveMatch = async (matchId: string) => {
    await socket.leaveMatch(matchId);
    useGameStore.getState().reset();
};

export const findMatch = async (mode: "classic" | "timed") => {
    console.info(`[Nakama] Calling auto_match RPC for ${mode} mode...`);
    try {
        const response = await client.rpc(session, "auto_match", { mode });
        console.info("[Nakama] auto_match RPC response:", response);
        
        if (response.payload) {
            const data = parsePayload(response.payload);
            const { matchId } = data;
            console.info("[Nakama] Auto Match found/created match ID:", matchId);
            
            // Join the found or created match
            await socket.joinMatch(matchId);
            console.info("[Nakama] Successfully joined match:", matchId);
            useGameStore.getState().setMatchId(matchId);
            return matchId;
        } else {
            throw new Error("No payload from auto_match RPC");
        }
    } catch (err) {
        console.error("[Nakama] findMatch error:", err);
        throw err;
    }
};

export const listMatches = async (mode?: "classic" | "timed") => {
    const payload = mode ? { mode } : {};
    const res = await client.rpc(session, "list_matches", payload);
    if (res.payload) {
        const data = parsePayload(res.payload);
        return data.matches || [];
    }
    return [];
};

export const sendMove = async (matchId: string, position: number) => {
    const moveId = crypto.randomUUID();
    const payload = JSON.stringify({ position, moveId });
    await socket.sendMatchState(matchId, OPCODES.MOVE, payload);
};

export const getLeaderboard = async () => {
    const res = await client.rpc(session, "get_leaderboard", {});
    if (res.payload) {
        return parsePayload(res.payload);
    }
    return [];
};

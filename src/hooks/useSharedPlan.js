import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialPlan } from "../data/nyc-planner-data.js";

const API_ORIGIN = (import.meta.env.VITE_SYNC_API_ORIGIN || "").replace(/\/$/, "");
// The public fallback only runs on GitHub Pages; Sites deployments keep using the D1 API.
// It is an unguessable shared namespace rather than a credential and is safe to ship client-side.
const MANTLE_NAMESPACE = import.meta.env.VITE_MANTLE_NAMESPACE || "nyc-couple-2026-ba57209cf1cd1c906a2ec9da";
const USE_MANTLE = Boolean(MANTLE_NAMESPACE) && window.location.hostname.endsWith("github.io");
const MANTLE_ORIGIN = "https://mantledb.sh";
const CLIENT_KEY = "nyc-planner-client-id";

function randomId(prefix = "trip") {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("")}`;
}

function getClientId() {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = randomId("guest");
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

function getShareId() {
  const url = new URL(window.location.href);
  let id = url.searchParams.get("trip");
  if (!id || !/^[a-zA-Z0-9_-]{12,80}$/.test(id)) {
    id = randomId();
    url.searchParams.set("trip", id);
    window.history.replaceState({}, "", url);
  }
  return id;
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mantleUrl(path) {
  return `${MANTLE_ORIGIN}/v2/${encodeURIComponent(MANTLE_NAMESPACE)}/${path}`;
}

async function readMantlePlan(shareId, minimumRevision = -1) {
  const root = `plans/${encodeURIComponent(shareId)}`;
  const metaResponse = await fetch(mantleUrl(`${root}/meta`), { cache: "no-store", headers: { accept: "application/json" } });
  if (metaResponse.status === 404) return { status: 404, payload: null };
  if (!metaResponse.ok) throw new Error(`mantle meta ${metaResponse.status}`);
  const meta = await metaResponse.json();
  const revision = Number(meta.revision || 0);
  if (revision < 1) return { status: 404, payload: null, revision: 0 };
  if (revision <= minimumRevision) return { status: 200, payload: null, revision };
  const planResponse = await fetch(mantleUrl(`${root}/revisions/${revision}`), { cache: "no-store", headers: { accept: "application/json" } });
  if (planResponse.status === 404) return { status: 202, payload: null, revision };
  if (!planResponse.ok) throw new Error(`mantle plan ${planResponse.status}`);
  return { status: 200, payload: await planResponse.json(), revision };
}

async function writeMantlePlan(shareId, data, updatedBy) {
  const root = `plans/${encodeURIComponent(shareId)}`;
  const increment = () => fetch(`${MANTLE_ORIGIN}/v2/increment/${encodeURIComponent(MANTLE_NAMESPACE)}/${root}/meta`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ key: "revision", by: 1 }),
  });
  let incrementResponse = await increment();
  if (incrementResponse.status === 404) {
    const initializeResponse = await fetch(mantleUrl(`${root}/meta`), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ revision: 0 }),
    });
    if (!initializeResponse.ok) throw new Error(`mantle initialize ${initializeResponse.status}`);
    incrementResponse = await increment();
  }
  if (!incrementResponse.ok) throw new Error(`mantle increment ${incrementResponse.status}`);
  const incrementResult = await incrementResponse.json();
  const revision = Number(incrementResult.revision);
  if (!Number.isInteger(revision) || revision < 1) throw new Error("mantle invalid revision");
  const payload = { revision, data, updatedBy, updatedAt: new Date().toISOString() };
  const writeResponse = await fetch(mantleUrl(`${root}/revisions/${revision}`), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!writeResponse.ok) throw new Error(`mantle write ${writeResponse.status}`);
  return payload;
}

function mergeSet(base = [], local = [], remote = []) {
  const baseSet = new Set(base);
  const localSet = new Set(local);
  const result = new Set(remote);
  base.forEach((value) => { if (!localSet.has(value)) result.delete(value); });
  local.forEach((value) => { if (!baseSet.has(value)) result.add(value); });
  return [...result];
}

function mergeRecord(base = {}, local = {}, remote = {}) {
  const result = { ...remote };
  for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if (!(key in local) && key in base) delete result[key];
    else if (!(key in base) || !same(local[key], base[key])) result[key] = local[key];
  }
  return result;
}

function mergeDay(base = {}, local = {}, remote = {}) {
  const baseItems = new Map((base.items || []).map((item) => [item.id, item]));
  const localItems = new Map((local.items || []).map((item) => [item.id, item]));
  const remoteItems = new Map((remote.items || []).map((item) => [item.id, item]));
  const resolved = new Map();
  for (const id of new Set([...baseItems.keys(), ...localItems.keys(), ...remoteItems.keys()])) {
    const before = baseItems.get(id); const ours = localItems.get(id); const theirs = remoteItems.get(id);
    if (before && !ours) continue;
    if (before && !theirs && ours && same(ours, before)) continue;
    if (ours && (!before || !same(ours, before))) resolved.set(id, ours);
    else if (theirs) resolved.set(id, theirs);
    else if (ours) resolved.set(id, ours);
  }
  const baseOrder = (base.items || []).map((item) => item.id);
  const localOrder = (local.items || []).map((item) => item.id);
  const remoteOrder = (remote.items || []).map((item) => item.id);
  const order = same(baseOrder, localOrder) ? remoteOrder : localOrder;
  const items = [];
  [...order, ...remoteOrder, ...localOrder].forEach((id) => {
    if (resolved.has(id) && !items.some((item) => item.id === id)) items.push(resolved.get(id));
  });
  const merged = { ...remote };
  for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if (["items", "candidateIds"].includes(key)) continue;
    if (!(key in base) || !same(local[key], base[key])) merged[key] = local[key];
  }
  merged.items = items;
  merged.candidateIds = mergeSet(base.candidateIds, local.candidateIds, remote.candidateIds);
  return merged;
}

function mergePlans(base = {}, local = {}, remote = {}) {
  const merged = { ...remote };
  for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if (["days", "favorites", "completed", "notes", "customPlaces", "updatedAt"].includes(key)) continue;
    if (!(key in base) || !same(local[key], base[key])) merged[key] = local[key];
  }
  const baseDays = new Map((base.days || []).map((day) => [day.id, day]));
  const localDays = new Map((local.days || []).map((day) => [day.id, day]));
  const remoteDays = new Map((remote.days || []).map((day) => [day.id, day]));
  const dayOrder = [...(local.days || []).map((day) => day.id), ...(remote.days || []).map((day) => day.id)];
  merged.days = [...new Set(dayOrder)].map((id) => mergeDay(baseDays.get(id), localDays.get(id) || remoteDays.get(id), remoteDays.get(id) || localDays.get(id))).filter((day) => day?.id);
  merged.favorites = mergeSet(base.favorites, local.favorites, remote.favorites);
  merged.completed = mergeSet(base.completed, local.completed, remote.completed);
  merged.notes = mergeRecord(base.notes, local.notes, remote.notes);
  merged.customPlaces = mergeRecord(base.customPlaces, local.customPlaces, remote.customPlaces);
  merged.updatedAt = new Date().toISOString();
  return merged;
}

export function useSharedPlan() {
  const [shareId] = useState(getShareId);
  const storageKey = `nyc-shared-plan:${shareId}`;
  const initialRef = useRef(null);
  if (!initialRef.current) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      initialRef.current = saved?.days?.length ? saved : createInitialPlan();
    } catch { initialRef.current = createInitialPlan(); }
  }
  const [plan, setPlanState] = useState(initialRef.current);
  const [sync, setSync] = useState({ state: "loading", message: "공유 일정을 불러오는 중" });
  const [retryTick, setRetryTick] = useState(0);
  const planRef = useRef(initialRef.current);
  const basePlanRef = useRef(null);
  const revisionRef = useRef(0);
  const changeSequenceRef = useRef(0);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const channelRef = useRef(null);
  const clientRef = useRef(getClientId());
  const tabSourceRef = useRef(randomId("tab"));

  const scheduleRetry = useCallback((minimumDelay = 0) => {
    window.clearTimeout(retryTimerRef.current);
    const delay = Math.max(minimumDelay, Math.min(30000, 1500 * (2 ** retryCountRef.current)));
    retryTimerRef.current = window.setTimeout(() => setRetryTick((value) => value + 1), delay);
  }, []);

  const applyRemote = useCallback((payload) => {
    if (!payload?.data?.days?.length) return;
    revisionRef.current = payload.revision || revisionRef.current;
    basePlanRef.current = payload.data;
    planRef.current = payload.data;
    dirtyRef.current = false;
    retryCountRef.current = 0;
    setPlanState(payload.data);
    localStorage.setItem(storageKey, JSON.stringify(payload.data));
    setSync({ state: "synced", message: "모든 기기에 저장됨" });
  }, [storageKey]);

  const reconcileRemote = useCallback((payload) => {
    if (!payload?.data?.days?.length) return;
    const merged = mergePlans(basePlanRef.current || payload.data, planRef.current, payload.data);
    revisionRef.current = payload.revision || revisionRef.current;
    basePlanRef.current = payload.data;
    planRef.current = merged;
    dirtyRef.current = true;
    changeSequenceRef.current += 1;
    setPlanState(merged);
    localStorage.setItem(storageKey, JSON.stringify(merged));
    setSync({ state: "saving", message: "동시 변경 내용을 합치는 중" });
  }, [storageKey]);

  const loadRemote = useCallback(async ({ quiet = false } = {}) => {
    try {
      let payload;
      let status;
      if (USE_MANTLE) {
        const result = await readMantlePlan(shareId, revisionRef.current);
        payload = result.payload;
        status = result.status;
      } else {
        const response = await fetch(`${API_ORIGIN}/api/plans/${shareId}`, { headers: { accept: "application/json" } });
        status = response.status;
        if (response.ok) payload = await response.json();
      }
      if (status === 404) {
        if (!hydratedRef.current) {
          hydratedRef.current = true;
          basePlanRef.current = {};
          const stamped = { ...planRef.current, updatedAt: new Date().toISOString() };
          planRef.current = stamped;
          dirtyRef.current = true;
          changeSequenceRef.current += 1;
          setPlanState(stamped);
          setSync({ state: "saving", message: "새 공유 일정 만드는 중" });
        } else if (dirtyRef.current) scheduleRetry();
        return;
      }
      if (status === 202) { scheduleRetry(500); return; }
      if (status < 200 || status >= 300) throw new Error(`sync ${status}`);
      hydratedRef.current = true;
      if (payload && payload.revision > revisionRef.current) {
        if (dirtyRef.current) reconcileRemote(payload);
        else applyRemote(payload);
      } else if (dirtyRef.current) scheduleRetry();
      else if (!quiet) setSync({ state: "synced", message: "모든 기기에 저장됨" });
    } catch {
      hydratedRef.current = true;
      if (dirtyRef.current) scheduleRetry();
      setSync({ state: "offline", message: "오프라인 · 이 기기에 임시 저장" });
    }
  }, [applyRemote, reconcileRemote, scheduleRetry, shareId]);

  useEffect(() => {
    loadRemote();
    const timer = window.setInterval(() => loadRemote({ quiet: true }), 5000);
    return () => { window.clearInterval(timer); window.clearTimeout(retryTimerRef.current); };
  }, [loadRemote]);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return undefined;
    const channel = new BroadcastChannel(`nyc-planner:${shareId}`);
    channelRef.current = channel;
    channel.onmessage = ({ data }) => {
      if (data?.source === tabSourceRef.current || !data?.plan?.days?.length) return;
      if (!dirtyRef.current) basePlanRef.current = planRef.current;
      planRef.current = data.plan;
      dirtyRef.current = true;
      changeSequenceRef.current += 1;
      setPlanState(data.plan);
      localStorage.setItem(storageKey, JSON.stringify(data.plan));
      setSync({ state: "saving", message: "다른 탭의 변경 내용 저장 중" });
    };
    return () => channel.close();
  }, [shareId, storageKey]);

  const setPlan = useCallback((updater) => {
    const current = planRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    if (!dirtyRef.current) basePlanRef.current = current;
    planRef.current = stamped;
    dirtyRef.current = true;
    changeSequenceRef.current += 1;
    setPlanState(stamped);
    localStorage.setItem(storageKey, JSON.stringify(stamped));
    channelRef.current?.postMessage({ source: tabSourceRef.current, plan: stamped });
    setSync({ state: "saving", message: "변경 내용 저장 중" });
  }, [storageKey]);

  const saveRemote = useCallback(async () => {
    if (!hydratedRef.current || !dirtyRef.current || savingRef.current) return;
    savingRef.current = true;
    const snapshot = planRef.current;
    const sequence = changeSequenceRef.current;
    const baseBeforeSave = basePlanRef.current || {};
    try {
      if (USE_MANTLE) {
        const before = await readMantlePlan(shareId, revisionRef.current);
        if (before.status === 202) { scheduleRetry(500); return; }
        if (before.payload?.revision > revisionRef.current) {
          reconcileRemote(before.payload);
          return;
        }
        const payload = await writeMantlePlan(shareId, snapshot, clientRef.current);
        revisionRef.current = payload.revision;
        basePlanRef.current = snapshot;
        retryCountRef.current = 0;
        const latest = await readMantlePlan(shareId, payload.revision);
        if (latest.status === 202) { scheduleRetry(500); return; }
        if (latest.payload?.revision > payload.revision) {
          basePlanRef.current = baseBeforeSave;
          reconcileRemote(latest.payload);
        } else if (sequence === changeSequenceRef.current) {
          applyRemote(payload);
        }
        return;
      }
      const response = await fetch(`${API_ORIGIN}/api/plans/${shareId}`, {
        method: "PUT",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ data: snapshot, updatedBy: clientRef.current, baseRevision: revisionRef.current }),
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 409 && payload?.data) {
        retryCountRef.current = 0;
        reconcileRemote(payload);
      } else if (!response.ok || !payload?.data) {
        throw new Error(`sync ${response.status}`);
      } else {
        revisionRef.current = payload.revision;
        basePlanRef.current = payload.data;
        retryCountRef.current = 0;
        if (sequence === changeSequenceRef.current) applyRemote(payload);
      }
    } catch {
      retryCountRef.current += 1;
      setSync({ state: "offline", message: "오프라인 · 자동 재시도 중" });
    } finally {
      savingRef.current = false;
      if (dirtyRef.current) scheduleRetry(500);
    }
  }, [applyRemote, reconcileRemote, scheduleRetry, shareId]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return undefined;
    const timer = window.setTimeout(saveRemote, 700);
    return () => window.clearTimeout(timer);
  }, [plan, retryTick, saveRemote]);

  const resetPlan = useCallback(() => setPlan(createInitialPlan()), [setPlan]);
  return { plan, setPlan, resetPlan, shareId, sync, refresh: loadRemote };
}

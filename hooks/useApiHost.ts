import { useStore } from "../store";
import { useLoggerStore } from "../store/logger";
import { decryptData } from "../plugin/hosts";
import { encrypt, decrypt, makeSign, timestamp } from "../plugin/crypto";
import DeviceInfo from "react-native-device-info";
import { useDecryption } from "./useDecryption";

/* =====================================================
 * Session scoped runtime state
 * ===================================================== */
let loading = false;
let failedHosts: string[] = [];
let failedClouds: string[] = [];
const reportedDomains = new Set<string>();

/* =====================================================
 * Utils
 * ===================================================== */
const isUrl = (u: string) =>
  typeof u === "string" &&
  (u.startsWith("http://") || u.startsWith("https://"));

const clean = (u: string) => u.replace(/\/+$/, "");

function pushUnique(arr: string[], v: string) {
  if (!arr.includes(v)) arr.push(v);
}

function getDomainFromUrl(u: string) {
  try {
    if (!u.startsWith("http")) return u;
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

async function withTiming<T>(fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const value = await fn();
    return { ok: true as const, value, time: Date.now() - start };
  } catch (error) {
    return { ok: false as const, error, time: Date.now() - start };
  }
}

/* =====================================================
 * Crypto payload
 * ===================================================== */
function wrapPayload(rawData: object = {}) {
  const ts = timestamp();
  const encryptedData = encrypt(rawData ?? {});
  const sign = makeSign(ts, encryptedData);

  return {
    client: DeviceInfo.getSystemName(),
    timestamp: ts,
    data: encryptedData,
    sign,
  };
}

/* =====================================================
 * Safe JSON parsing (prevents "Unexpected end of input")
 * ===================================================== */
async function safeJson(res: Response) {
  try {
    const data = await res.json();

    if (!data || typeof data !== "object") {
      return { ok: false as const, reason: "empty" as const };
    }

    return { ok: true as const, data };
  } catch (e) {
    return {
      ok: false as const,
      reason: "invalid_json" as const,
    };
  }
}

/* =====================================================
 * Report failed domain (deduped)
 * ===================================================== */
async function reportFailedDomainOnce(hostOrUrl: string, logger: any) {
  const domain = getDomainFromUrl(hostOrUrl);
  if (reportedDomains.has(domain)) return;
  reportedDomains.add(domain);

  try {
    const reportApi = process.env.EXPO_PUBLIC_REPORT_API_DOMAIN;
    if (!reportApi) return;

    logger.log(`📡 Report failed domain: ${domain}`);

    await fetch(`${reportApi}/apiv1/domain/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        access_time: Math.floor(Date.now() / 1000),
      }),
    });
  } catch {
    // silent (do not crash startup)
  }
}

/* =====================================================
 * Store helpers (log + remove exact host URL)
 * ===================================================== */
function removeApiHostFromStore(hostUrl: string, logger: any) {
  useStore.setState((state: any) => {
    const next = (state.apiHosts || []).filter((h: string) => h !== hostUrl);
    logger.log(`🧹 Removed bad API host from store: ${hostUrl}`);
    return { apiHosts: next };
  });
}

function setApiEndPointLogged(hostUrl: string, logger: any) {
  const { setApiEndPoint } = useStore.getState() as any;
  logger.log(`🧩 setApiEndPoint = ${hostUrl || "(empty)"}`);
  setApiEndPoint(hostUrl);
}

function setUrlEndPointLogged(frontUrl: string, logger: any) {
  const { setUrlEndPoint } = useStore.getState() as any;
  logger.log(`🧩 setUrlEndPoint = ${frontUrl || "(empty)"}`);
  setUrlEndPoint(frontUrl);
}

function setAdsLogged(advert: any, logger: any) {
  const { setAds } = useStore.setState as any;
  logger.log(`🧩 setAds = ${advert?.name || "(no name)"}`);
  setAds(advert);
}

function injectApiHostsLogged(hosts: string[], logger: any) {
  useStore.setState({ apiHosts: hosts } as any);
  logger.log(`☁ Injected cloud apiHosts: ${hosts.length} items`);
}

/* =====================================================
 * Native fetch helpers
 * ===================================================== */
async function postJson(apiUrl: string, params: any, logger: any) {
  const payload = wrapPayload(params);

  try {
    logger.log(`→ POST ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(res);

    const parsed = await safeJson(res);

    if (!parsed.ok) {
      logger.log(`❌ POST invalid JSON (${parsed.reason}) ${apiUrl}`);
      return { ok: false as const, reason: parsed.reason };
    }

    const resData = parsed.data;

    // Your server might return encrypted top-level; keep your rule:
    // If resData.data exists -> decrypt(resData.data)
    if (resData?.data) {
      const decrypted = decrypt(resData.data);
      return { ok: true as const, data: decrypted };
    }

    return { ok: true as const, data: resData };
  } catch (e) {
    logger.log(`❌ POST exception ${apiUrl}`);
    return { ok: false as const, reason: "network" as const };
  }
}

async function fetchJson(url: string, logger: any) {
  try {
    logger.log(`→ GET ${url}`);

    const res = await fetch(url, { method: "GET" });

    const parsed = await safeJson(res);

    if (!parsed.ok) {
      logger.log(`❌ GET invalid JSON (${parsed.reason}) ${url}`);
      return null;
    }

    // return parsed.data;
  } catch {
    logger.log(`❌ GET exception ${url}`);
    return null;
  }
}

/* =====================================================
 * MAIN HOOK
 * ===================================================== */
export function useApiHosts() {
  const logger = useLoggerStore();
  const { decryptImage } = useDecryption();
  /* -----------------------------------------------
   * 1) resolveApiHost (FASTEST WINS)
   * --------------------------------------------- */
  async function resolveApiHost() {
    logger.log("🔍 Checking API hosts (fastest wins)…");

    const { apiHosts } = useStore.getState() as any;
    const candidates: string[] = (apiHosts || []).filter(isUrl);

    // If store has no hosts
    if (!candidates.length) {
      logger.log("⚠️ No apiHosts in store");
      setApiEndPointLogged("", logger);
      return null;
    }

    const results = await Promise.all(
      candidates.map((hostUrl) =>
        withTiming(async () => {
          const apiUrl = `${clean(hostUrl)}/apiv1/latest-redbook-conf`;

          const r = await postJson(apiUrl, {}, logger);

          // r.data is either decrypted object or raw object
          if (!r.ok) {
            // mark fail, report, remove
            pushUnique(failedHosts, hostUrl);
            await reportFailedDomainOnce(hostUrl, logger);
            removeApiHostFromStore(hostUrl, logger);
            throw new Error("api_failed");
          }

          const raw = r.data;

          // Your validation rule (keep same intent)
          if (!raw || raw.errcode !== 0 || !raw.data) {
            logger.log(`❌ API bad structure: ${hostUrl}`);
            pushUnique(failedHosts, hostUrl);
            await reportFailedDomainOnce(hostUrl, logger);
            removeApiHostFromStore(hostUrl, logger);
            throw new Error("api_bad_structure");
          }

          logger.log(`✅ API OK: ${hostUrl}`);
          return { host: clean(hostUrl), raw };
        })
      )
    );

    const valid = results.filter((x) => x.ok).sort((a, b) => a.time - b.time);

    if (!valid.length) {
      logger.log("❌ All API hosts failed");
      setApiEndPointLogged("", logger);
      return null;
    }

    const fastest = valid[0]!.value;
    const host = fastest.host;
    const raw = fastest.raw;

    logger.log(`⚡ Fastest API host: ${host} (${valid[0]!.time}ms)`);
    setApiEndPointLogged(host, logger);

    /* =================================================
     * 🟡 Ads (image) — RN CORRECT VERSION
     * ================================================= */
    const store = useStore.getState() as any;
    const advert = raw.data?.advert;

    // 🔑 Decide if advert is really new
    const isNewAdvert = advert.image !== store.ads.image;

    if (isNewAdvert) {
      logger.log("🟡 New advert detected → decrypting");
      try {
        // 2️⃣ Decrypt image (RN returns base64 data URI)
        const dataUri = await decryptImage(advert.image);
        if (dataUri) {
          // 3️⃣ Save decrypted image
          store.setAds({
            image: advert.image,
            url: advert.url,
            name: advert.name,
            position: advert.position,
            base64: dataUri,
          });
          logger.log("✅ Advert image decrypted & stored");
        } else {
          logger.log("⚠ Advert decrypt finished but returned empty image");
        }
      } catch (e) {
        logger.log("⚠ Advert decrypt failed");
      }
    } else if (advert?.image) {
      // Explicitly log why we skipped
      logger.log(
        "ℹ️ Advert unchanged — skip decrypt1 " + `image=${store.ads.image})`
      );
    } else {
      logger.log("ℹ️ No advert in response");
    }

    /* -------- Frontend URLs -------- */
    const fronts: string[] = Array.isArray(raw.data?.urls)
      ? raw.data.urls.filter(isUrl).map(clean)
      : [];

    logger.log(`🌐 Front candidates: ${fronts.length}`);

    const frontResults = await Promise.all(
      fronts.map((front) =>
        withTiming(async () => {
          const pingUrl = `${clean(front)}/ping.txt`;
          logger.log(`→ GET ${pingUrl}`);
          const res = await fetch(pingUrl, {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) {
            throw new Error(`ping_failed_${res.status}`);
          }
          return front;
        })
      )
    );

    const okFronts = frontResults
      .filter((x) => x.ok)
      .sort((a, b) => a.time - b.time);

    if (!okFronts.length) {
      logger.log("❌ No working frontend URL");
      setUrlEndPointLogged("", logger);
    } else {
      logger.log(`⚡ Fastest frontend: ${okFronts[0]!.value}`);
      setUrlEndPointLogged(okFronts[0]!.value, logger);
    }

    return host;
  }

  /* -----------------------------------------------
   * 2) resolveCloudHost (KEEP YOUR DECRYPT LOGIC)
   * --------------------------------------------- */
  async function resolveCloudHost() {
    const { clouds } = useStore.getState() as any;

    logger.log("☁ Cloud fallback started");
    logger.log(`☁ Cloud sources: ${(clouds || []).length}`);

    for (const cloud of clouds || []) {
      logger.log(`→ Fetching cloud: ${cloud.name} (${cloud.value})`);

      const raw = await fetchJson(cloud.value, logger);

      if (!raw) {
        logger.log(`❌ Cloud fetch failed: ${cloud.value}`);
        pushUnique(failedClouds, cloud.value);
        await reportFailedDomainOnce(cloud.value, logger);
        continue;
      }

      // ✅ THIS IS YOUR ORIGINAL BEHAVIOR
      const list = Array.isArray(raw) ? raw : [];
      logger.log(`☁ Cloud list items: ${list.length}`);

      const hosts = list
        .map((x) => {
          try {
            return clean(decryptData(x)); // ✅ keep your decrypt
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as string[];

      logger.log(`☁ Cloud decrypted hosts: ${hosts.length}`);

      if (!hosts.length) {
        pushUnique(failedClouds, cloud.value);
        continue;
      }

      injectApiHostsLogged(hosts, logger);

      const working = await resolveApiHost();
      if (working) return working;

      pushUnique(failedClouds, cloud.value);
    }

    logger.log("🧨 All cloud sources exhausted");
    return null;
  }

  /* -----------------------------------------------
   * 3) initApiHosts
   * --------------------------------------------- */
  async function initApiHosts() {
    if (loading) {
      logger.log("⏳ initApiHosts ignored: already loading");
      return null;
    }

    loading = true;
    failedHosts = [];
    failedClouds = [];
    // reportedDomains.clear(); // optional: keep across one app session
    logger.clear();

    logger.log("🚀 Host resolution started");

    try {
      const direct = await resolveApiHost();
      if (direct) return direct;

      logger.log("↪ Switching to cloud fallback…");
      return await resolveCloudHost();
    } finally {
      loading = false;
      logger.log("🏁 Host resolution finished");
    }
  }

  return {
    get loading() {
      return loading;
    },
    get failedHosts() {
      return failedHosts;
    },
    get failedClouds() {
      return failedClouds;
    },
    resolveApiHost,
    resolveCloudHost,
    initApiHosts,
  };
}

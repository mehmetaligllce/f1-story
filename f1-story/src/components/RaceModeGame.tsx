"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/src/store/gameStore";
import locations from "@/src/db/locations.json";
import { simulateRace } from "@/src/hooks/raceSimulator";
import styles from "./RaceModeGame.module.css";

export interface RaceResultEntry {
  position: number;
  name: string;
  points: number;
  teamScore?: number;
  driverScore?: number;
  luck?: number;
}

interface RaceModeGameProps {
  driverNumber?: number | string;
  customResults?: RaceResultEntry[];
}

const getF1Points = (pos: number): number => {
  const pts = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return pos <= 10 ? pts[pos - 1] : 0;
};

const TEAM_COLORS: Record<string, string> = {
  "Mercedes-AMG Petronas F1 Team":       "#00D2BE",
  "Scuderia Ferrari HP":                  "#E8002D",
  "McLaren Mastercard F1 Team":           "#FF8000",
  "Oracle Red Bull Racing":               "#3671C6",
  "Visa Cash App Racing Bulls F1 Team":   "#6692FF",
  "BWT Alpine F1 Team":                   "#FF87BC",
  "TGR Haas F1 Team":                    "#B6BABD",
  "Audi Revolut F1 Team":                "#C0C0C0",
  "Atlassian Williams F1 Team":           "#64C4FF",
  "Aston Martin Aramco F1 Team":          "#358C75",
  "Cadillac Formula 1 Team":             "#004F9A",
};

export default function RaceModeGame({ driverNumber, customResults }: RaceModeGameProps) {
  const router = useRouter();
  const round = useGameStore((state) => state.round);
  const season = useGameStore((state) => state.season);
  const storeDrivers = useGameStore((state) => state.drivers);
  const storeTeams = useGameStore((state) => state.teams);

  // Track location for active round
  const track = useMemo(() => {
    return (
      locations.find((l) => l.round === round) ||
      locations[(round - 1) % locations.length] ||
      locations[0]
    );
  }, [round]);

  // Selected User Driver
  const numParsed = driverNumber ? Number(driverNumber) : null;
  const userDriver = useMemo(() => {
    if (!numParsed) return storeDrivers[0] || null;
    return storeDrivers.find((d) => d.number === numParsed) || storeDrivers[0] || null;
  }, [numParsed, storeDrivers]);

  // Active race result array (from customResults prop OR simulated algorithm)
  const [raceResults, setRaceResults] = useState<RaceResultEntry[]>(() => {
    if (customResults && customResults.length > 0) return customResults;
    return simulateRace(storeDrivers, storeTeams, track);
  });

  // Re-simulate handler
  const handleReSimulate = () => {
    const freshResults = simulateRace(storeDrivers, storeTeams, track);
    setRaceResults(freshResults);
  };

  // User driver position in the results array
  const userResult = raceResults.find((r) => r.name === userDriver?.name);
  const userPos = userResult ? userResult.position : null;
  const userPts = userPos ? getF1Points(userPos) : 0;
  const userTeamColor = userDriver ? (TEAM_COLORS[userDriver.team] ?? "#00e676") : "#00e676";

  const p1 = raceResults[0] ?? null;
  const p2 = raceResults[1] ?? null;
  const p3 = raceResults[2] ?? null;

  return (
    <div className={styles.container}>
      {/* ── TRACK HEADER ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <span className={styles.seasonBadge}>SEZON {season} • RAUND {round}</span>
            <h1 className={styles.trackTitle}>{track.name} Grand Prix</h1>
            <p className={styles.trackSub}>📍 {track.country} · Tarih: {track.date}</p>
          </div>
          <div className={styles.circuitBadges}>
            <span className={styles.chip}>☀️ Hava: <strong>{track.weather}</strong></span>
            <span className={styles.chip}>🏎️ Tip: <strong>{track.circuit_type.toUpperCase()}</strong></span>
            <span className={styles.chip}>🎯 Overtake Zorluğu: <strong>{track.overtake_diffuculity}/10</strong></span>
          </div>
        </div>
      </div>

      {/* ── USER DRIVER SPOTLIGHT ── */}
      {userDriver && (
        <div
          className={styles.spotlightCard}
          style={{ "--team-color": userTeamColor } as React.CSSProperties}
        >
          <div className={styles.spotlightAvatarWrapper}>
            <Image
              src={userDriver.image}
              alt={userDriver.name}
              fill
              className={styles.spotlightImg}
              sizes="100px"
            />
          </div>

          <div>
            <div className={styles.spotlightLabel}>
              <span>🎮 Seçtiğin Sürücü Performance Özeti</span>
            </div>
            <h2 className={styles.spotlightName}>{userDriver.name} <small style={{ opacity: 0.6 }}>#{userDriver.number}</small></h2>
            <div className={styles.spotlightTeam} style={{ color: userTeamColor }}>
              {userDriver.team}
            </div>
          </div>

          <div className={styles.spotlightStats}>
            <div className={styles.statBox}>
              <div className={`${styles.statVal} ${userPos && userPos <= 3 ? styles.statValGold : styles.statValGreen}`}>
                P{userPos ?? "-"}
              </div>
              <div className={styles.statLabel}>Bitiş Sırası</div>
            </div>

            <div className={styles.statBox}>
              <div className={`${styles.statVal} ${userPts > 0 ? styles.statValGreen : ""}`}>
                +{userPts}
              </div>
              <div className={styles.statLabel}>Kazanılan Puan</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PODIUM SECTION ── */}
      <div className={styles.sectionTitle}>
        <span>🏆 YARIŞ PODİUMU</span>
        <span className={styles.liveBadge}>RESMİ SONUÇLAR</span>
      </div>

      <div className={styles.podiumContainer}>
        {/* P2 - Silver */}
        {p2 && (() => {
          const d = storeDrivers.find((driver) => driver.name === p2.name);
          const t = storeTeams.find((team) => team.name === d?.team);
          return (
            <div className={`${styles.podiumCard} ${styles.silverPodium}`}>
              <div className={styles.podiumBadge}>P2</div>
              <div className={styles.podiumAvatar}>
                {d && <Image src={d.image} alt={p2.name} fill className={styles.podiumDriverImg} sizes="90px" />}
              </div>
              <h3 className={styles.podiumDriverName}>{p2.name}</h3>
              <div className={styles.podiumTeamRow}>
                {t && <Image src={t.image} alt="" width={18} height={18} />}
                <span>{d?.team.replace(" F1 Team", "")}</span>
              </div>
              <span className={styles.ptsBadge}>+18 PTS</span>
            </div>
          );
        })()}

        {/* P1 - Gold */}
        {p1 && (() => {
          const d = storeDrivers.find((driver) => driver.name === p1.name);
          const t = storeTeams.find((team) => team.name === d?.team);
          return (
            <div className={`${styles.podiumCard} ${styles.goldPodium}`}>
              <div className={styles.winnerCrown}>🏆 YARIŞ KAZANANI</div>
              <div className={styles.podiumBadge}>P1</div>
              <div className={styles.podiumAvatar}>
                {d && <Image src={d.image} alt={p1.name} fill className={styles.podiumDriverImg} sizes="110px" />}
              </div>
              <h3 className={styles.podiumDriverName}>{p1.name}</h3>
              <div className={styles.podiumTeamRow}>
                {t && <Image src={t.image} alt="" width={20} height={20} />}
                <span>{d?.team.replace(" F1 Team", "")}</span>
              </div>
              <span className={`${styles.ptsBadge} ${styles.goldPts}`}>+25 PTS</span>
            </div>
          );
        })()}

        {/* P3 - Bronze */}
        {p3 && (() => {
          const d = storeDrivers.find((driver) => driver.name === p3.name);
          const t = storeTeams.find((team) => team.name === d?.team);
          return (
            <div className={`${styles.podiumCard} ${styles.bronzePodium}`}>
              <div className={styles.podiumBadge}>P3</div>
              <div className={styles.podiumAvatar}>
                {d && <Image src={d.image} alt={p3.name} fill className={styles.podiumDriverImg} sizes="90px" />}
              </div>
              <h3 className={styles.podiumDriverName}>{p3.name}</h3>
              <div className={styles.podiumTeamRow}>
                {t && <Image src={t.image} alt="" width={18} height={18} />}
                <span>{d?.team.replace(" F1 Team", "")}</span>
              </div>
              <span className={styles.ptsBadge}>+15 PTS</span>
            </div>
          );
        })()}
      </div>

      {/* ── FULL CLASSIFICATION LIST ── */}
      <div className={styles.sectionTitle}>
        <span>📋 TÜM SÜRÜCÜ SİLMANI (P1 - P{raceResults.length})</span>
      </div>

      <div className={styles.gridList}>
        <div className={styles.gridListHeader}>
          <span>SIRA</span>
          <span>SÜRÜCÜ & TAKIM</span>
          <span>PUAN</span>
        </div>

        {raceResults.map((res) => {
          const driver = storeDrivers.find((d) => d.name === res.name);
          const team = storeTeams.find((t) => t.name === driver?.team);
          const ptsEarned = getF1Points(res.position);
          const isUser = driver?.number === userDriver?.number;

          return (
            <div
              key={res.name}
              className={`${styles.gridRow} ${isUser ? styles.userDriverRow : ""}`}
            >
              <div className={`${styles.posBadge} ${styles[`pos${res.position}`] || ""}`}>
                P{res.position}
              </div>

              <div className={styles.driverCell}>
                {driver && (
                  <div className={styles.avatarMini}>
                    <Image src={driver.image} alt={res.name} fill className={styles.rowImg} sizes="40px" />
                  </div>
                )}
                <div className={styles.driverInfo}>
                  <div className={styles.driverNameRow}>
                    <span className={styles.driverName}>
                      {res.name} <small style={{ color: "#7a8092" }}>#{driver?.number}</small>
                    </span>
                    {isUser && <span className={styles.userTag}>SENSİN</span>}
                  </div>
                  <div className={styles.teamName}>
                    {team && <Image src={team.image} alt="" width={14} height={14} style={{ verticalAlign: "middle", marginRight: 5 }} />}
                    {driver?.team}
                  </div>
                </div>
              </div>

              <div className={styles.ptsCell}>
                {ptsEarned > 0 ? (
                  <span className={styles.f1PtsBadge}>+{ptsEarned} PTS</span>
                ) : (
                  <span className={styles.noPts}>-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className={styles.actionRow}>
        <button className={styles.btnPrimary} onClick={() => router.push("/race-mode")}>
          🏎️ Başka Sürücü Seç
        </button>
        <button className={styles.btnSecondary} onClick={handleReSimulate}>
          🔄 Yarışı Yeniden Simüle Et
        </button>
        <button className={styles.btnSecondary} onClick={() => router.push("/standings")}>
          🏆 Şampiyona Tablosu
        </button>
        <button className={styles.btnSecondary} onClick={() => router.push("/")}>
          🏠 Ana Sayfa
        </button>
      </div>
    </div>
  );
}

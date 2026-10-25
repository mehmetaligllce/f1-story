"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameStore } from "../store/gameStore";
import type { Driver } from "../types/driver";
import styles from "./DriverSelectScreen.module.css";

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

function getOverallRating(driver: Driver): number {
  const r = driver.rating;
  const vals = [r.pace, r.racecraft, r.aggression, r.coldblood, r.qualifying,
                r.tyre_management, r.wet_skill, r.consistency, r.media_skill];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function getRatingTier(ovr: number): { label: string; color: string } {
  if (ovr >= 92) return { label: "ELİT", color: "#ffd700" };
  if (ovr >= 86) return { label: "USTA",  color: "#00e676" };
  if (ovr >= 78) return { label: "İYİ",   color: "#40c4ff" };
  return             { label: "GELİŞEN", color: "#a0a0b0" };
}

export default function DriverSelectScreen() {
  const drivers = useGameStore(state => state.drivers);
  const season  = useGameStore(state => state.season);
  const [selected, setSelected] = useState<Driver | null>(null);
  const router = useRouter();

  const sorted = [...drivers].sort((a, b) => getOverallRating(b) - getOverallRating(a));

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <p className={styles.heroSub}>{season} Sezonu · Hikaye Modu</p>
        <h1 className={styles.heroTitle}>Sürücünü <span>Seç</span></h1>
        <p className={styles.heroDesc}>
          Pistte her karar senin. Bir sürücü seç ve yarış içi anlık kararlarınla
          şampiyonluğa koş.
        </p>
      </div>

      {/* ── GRID ── */}
      <div className={styles.gridWrapper}>
        <div className={styles.grid}>
          {sorted.map(driver => {
            const color   = TEAM_COLORS[driver.team] ?? "#e10600";
            const ovr     = getOverallRating(driver);
            const tier    = getRatingTier(ovr);
            const isSelected = selected?.number === driver.number;

            return (
              <button
                key={driver.number}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                style={{
                  "--team-color": color,
                  "--team-color-dim": `${color}22`,
                } as React.CSSProperties}
                onClick={() => setSelected(isSelected ? null : driver)}
              >
                {/* Number watermark */}
                <span className={styles.cardNumber}>#{driver.number}</span>

                {/* Selected tick */}
                {isSelected && <span className={styles.tick}>✓</span>}

                {/* Photo */}
                <div className={styles.photoWrapper}>
                  <Image
                    src={driver.image}
                    alt={driver.name}
                    fill
                    className={styles.photo}
                    sizes="180px"
                  />
                </div>

                {/* Info */}
                <div className={styles.cardInfo}>
                  <div className={styles.driverName}>{driver.name}</div>
                  <div className={styles.teamName} style={{ color }}>
                    {driver.team.replace(" F1 Team", "").replace("Scuderia ", "")}
                  </div>
                  <div className={styles.ratingRow}>
                    <span className={styles.ovrLabel}>OVR</span>
                    <span className={styles.ovrValue}>{ovr}</span>
                    <span className={styles.tierBadge} style={{ color: tier.color, borderColor: tier.color }}>
                      {tier.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className={`${styles.footer} ${selected ? styles.footerVisible : ""}`}>
        {selected && (
          <>
            <div className={styles.footerLeft}>
              <span className={styles.footerNum} style={{ color: TEAM_COLORS[selected.team] ?? "#e10600" }}>
                #{selected.number}
              </span>
              <div>
                <div className={styles.footerName}>{selected.name}</div>
                <div className={styles.footerTeam}>{selected.team}</div>
              </div>
            </div>
            <button
              className={styles.startBtn}
              onClick={() => router.push(`/race-mode/${selected.number}`)}
            >
              🏁 YARIŞA BAŞLA
            </button>
          </>
        )}
      </div>
    </div>
  );
}

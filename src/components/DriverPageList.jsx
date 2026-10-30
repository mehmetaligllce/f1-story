"use client"
import { useParams } from "next/navigation";
import Image from "next/image";
import ReactCountryFlag from "react-country-flag";
import { useGameStore } from "../store/gameStore";
import styles from "./DriverPageList.module.css";
import locations from "../db/locations.json";


const RATINGS = [
  { key: "pace",            label: "Hız",             icon: "⚡" },
  { key: "racecraft",       label: "Yarış Zekası",    icon: "🧠" },
  { key: "aggression",      label: "Agresiflik",      icon: "💥" },
  { key: "coldblood",       label: "Soğukkanlılık",  icon: "🧊" },
  { key: "qualifying",      label: "Sıralama Turu",   icon: "⏱️" },
  { key: "tyre_management", label: "Lastik Yönetimi", icon: "🔧" },
  { key: "wet_skill",       label: "Islak Pist",      icon: "🌧️" },
  { key: "consistency",     label: "Tutarlılık",      icon: "📈" },
  { key: "media_skill",     label: "Medya Becerisi",  icon: "🎤" },
];

const getPositionColor = (pos) => {
  if (pos === 1) return "#ffd700";
  if (pos === 2) return "#c0c0c0";
  if (pos === 3) return "#cd7f32";
  if (pos <= 10) return "#e10600";
  return "#6b6b7e";
};

const getPositionLabel = (pos) => {
  if (pos === 1) return "🏆 P1";
  if (pos <= 3) return `🥈 P${pos}`;
  if (pos <= 10) return `P${pos}`;
  return `P${pos}`;
};

const getRatingColor = (val) => {
  if (val >= 95) return "#ffd700";
  if (val >= 88) return "#00e676";
  if (val >= 80) return "#40c4ff";
  if (val >= 70) return "#e1e1e1";
  return "#ff6b6b";
};

const DriverPageList = () => {
  const driverId = useParams().id;
  const driver = useGameStore((state) => state.drivers).find(
    (d) => d.number === Number(driverId)
  );
  const deltaNumber = useGameStore(state => state.deltaNumber).filter(d=>d.name===driver.name);



  if (!driver) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px", fontSize: "1.5rem" }}>
        Sürücü bulunamadı
      </div>
    );
  }

  const sortedStandings = [...(driver.standings || [])].reverse();

  // Stats
  const totalRaces = sortedStandings.length;
  const wins = sortedStandings.filter((s) => s.position === 1).length;
  const podiums = sortedStandings.filter((s) => s.position <= 3).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.driverInfo}>
          <div className={styles.numberWrapper}>
            <span className={styles.number}>{driver.number}</span>
          </div>
          <div className={styles.nameWrapper}>
            <h1 className={styles.name}>{driver.name}</h1>
            <span className={styles.team}>{driver.team}</span>
          </div>
          <ReactCountryFlag countryCode={driver.country} svg className={styles.flag} />
        </div>
        <div className={styles.imageWrapper}>
          <Image src={driver.image} alt={driver.name} width={200} height={200} className={styles.image} />
        </div>
      </div>

      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#e10600" }}>{driver.points}</span>
          <span className={styles.quickStatLabel}>PUAN</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#ffd700" }}>{wins}</span>
          <span className={styles.quickStatLabel}>GALİBİYET</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#c0c0c0" }}>{podiums}</span>
          <span className={styles.quickStatLabel}>PODYUM</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#40c4ff" }}>{totalRaces}</span>
          <span className={styles.quickStatLabel}>YARIŞLAR</span>
        </div>
      </div>

      <div className={styles.ratingsSection}>
        <h2 className={styles.sectionTitle}>Sürücü Reyting <span>Profili</span></h2>
        <div className={styles.ratingGrid}>
          {RATINGS.map(({ key, label, icon }) => {
            const val = Math.round(driver.rating[key] ?? 0);
            const color = getRatingColor(val);
            const deltaEntry = deltaNumber.find(d => d.stats === key);
            const deltaVal = deltaEntry ? Math.round(deltaEntry.delta * 10) / 10 : null;
            return (
              <div key={key} className={styles.ratingItem}>
                <span className={styles.ratingIcon}>{icon}</span>
                <span className={styles.ratingLabel}>{label}</span>
                {deltaVal != null ? (
                  <span className={styles.deltaBadge} style={{
                    background: deltaVal > 0 ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 77, 77, 0.12)',
                    color: deltaVal > 0 ? '#00e676' : '#ff4d4d',
                    border: `1px solid ${deltaVal > 0 ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 77, 77, 0.35)'}`
                  }}>
                    {deltaVal > 0 ? `▲ +${deltaVal}` : `▼ ${deltaVal}`}
                  </span>
                ) : (
                  <span className={styles.deltaNone}>—</span>
                )}
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${val}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
                  />
                </div>
                <span className={styles.ratingValue} style={{ color }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Yarış <span>Geçmişi</span></h2>
        {sortedStandings.length ? (
          <div className={styles.historyList}>
            {sortedStandings.map((standing, index) => {
              const loc = locations.find((l) => l.round === standing.round);
              const raceName = loc ? loc.name : `${standing.season} Sezonu Yarışı`;
              const raceFlag = loc?.country_code;
              const posColor = getPositionColor(standing.position);
              return (
                <div key={index} className={styles.historyItem} style={{ borderLeftColor: posColor }}>
                  <div className={styles.historyLeft}>
                    {raceFlag && (
                      <ReactCountryFlag
                        countryCode={raceFlag}
                        svg
                        style={{ width: "1.6em", height: "1.2em", borderRadius: "3px", marginRight: "8px" }}
                      />
                    )}
                    <div>
                      <span className={styles.raceName}>{raceName}</span>
                      <span className={styles.raceMeta}>
                        {standing.season} Sezonu
                        {standing.round ? ` · Raund ${standing.round}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className={styles.historyPosition} style={{ color: posColor }}>
                    {getPositionLabel(standing.position)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyMessage}>Henüz yarış sonucu yok.</p>
        )}
      </div>
    </div>
  );
};

export default DriverPageList;

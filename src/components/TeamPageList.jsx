"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { useGameStore } from "../store/gameStore";
import styles from "./TeamPageList.module.css";

const RATINGS = [
  { key: "pace",            label: "Hız",             icon: "⚡" },
  { key: "reliability",     label: "Dayanıklılık",    icon: "🛡️" },
  { key: "development",     label: "Geliştirme",      icon: "🧪" },
  { key: "morale",          label: "Moral",           icon: "🤝" },
  { key: "downforce",       label: "Downforce",       icon: "🌪️" },
  { key: "power_unit",      label: "Güç Ünitesi",     icon: "⚡" },
  { key: "tyre_management", label: "Lastik Yönetimi", icon: "🛞" },
  { key: "strategy",        label: "Strateji",        icon: "🧠" },
];

const getRatingColor = (val) => {
  if (val >= 95) return "#ffd700";
  if (val >= 88) return "#00e676";
  if (val >= 80) return "#40c4ff";
  if (val >= 70) return "#e1e1e1";
  return "#ff6b6b";
};

const TeamPageList = () => {
  const params = useParams();
  const rawName = params?.name;
  const teamName = rawName ? decodeURIComponent(rawName) : "";

  const teams = useGameStore((state) => state.teams) || [];
  const drivers = useGameStore((state) => state.drivers) || [];

  const team = teams.find(
    (t) => t.name.toLowerCase() === teamName.toLowerCase()
  ) || teams.find((t) => t.name === teamName);

  if (!team) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Takım bulunamadı</div>
      </div>
    );
  }

  // Sıralamayı puan durumuna göre hesapla
  const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
  const standingIndex = sortedTeams.findIndex((t) => t.name === team.name);
  const standing = standingIndex !== -1 ? standingIndex + 1 : null;

  // Takıma ait sürücüler ve istatistikleri
  const teamDrivers = drivers.filter((d) => d.team === team.name);
  const allStandings = teamDrivers.flatMap((d) => d.standings || []);
  const wins = allStandings.filter((s) => s.position === 1).length;
  const podiums = allStandings.filter((s) => s.position <= 3).length;

  return (
    <div className={styles.container}>
      {/* Header Card */}
      <div className={styles.header}>
        <div className={styles.teamInfo}>
          <div className={styles.numberWrapper}>
            <span className={styles.number}>{standing ? `P${standing}` : "F1"}</span>
          </div>
          <div className={styles.nameWrapper}>
            <h1 className={styles.name}>{team.name}</h1>
            <span className={styles.subtitle}>Formula 1 Takımı</span>
          </div>
        </div>
        {team.image && (
          <div className={styles.imageWrapper}>
            <Image
              src={team.image}
              alt={team.name}
              width={180}
              height={100}
              className={styles.image}
              priority
            />
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#e10600" }}>
            {team.points ?? 0}
          </span>
          <span className={styles.quickStatLabel}>PUAN</span>
        </div>
        <div className={styles.quickStat}>
          <span
            className={styles.quickStatValue}
            style={{
              color:
                standing === 1
                  ? "#ffd700"
                  : standing === 2
                  ? "#c0c0c0"
                  : standing === 3
                  ? "#cd7f32"
                  : "#ffffff",
            }}
          >
            {standing ? standing : "-"}
          </span>
          <span className={styles.quickStatLabel}>SIRALAMA</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#00e676" }}>
            {wins}
          </span>
          <span className={styles.quickStatLabel}>GALİBİYET</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue} style={{ color: "#40c4ff" }}>
            {podiums}
          </span>
          <span className={styles.quickStatLabel}>PODYUM</span>
        </div>
      </div>

      {/* Ratings Section */}
      <div className={styles.ratingsSection}>
        <h2 className={styles.sectionTitle}>
          Takım Reyting <span>Profili</span>
        </h2>
        <div className={styles.ratingGrid}>
          {RATINGS.map(({ key, label, icon }) => {
            const val = Math.round(team.rating?.[key] ?? 0);
            const color = getRatingColor(val);

            return (
              <div key={key} className={styles.ratingItem}>
                <span className={styles.ratingIcon}>{icon}</span>
                <span className={styles.ratingLabel}>{label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.min(100, Math.max(0, val))}%`,
                      background: `linear-gradient(90deg, ${color}66, ${color})`,
                    }}
                  />
                </div>
                <span className={styles.ratingValue} style={{ color }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Drivers Section */}
      <div className={styles.driversSection}>
        <h2 className={styles.sectionTitle}>
          Takım <span>Sürücüleri</span>
        </h2>
        {teamDrivers.length > 0 ? (
          <div className={styles.driversList}>
            {teamDrivers.map((driver) => (
              <Link
                key={driver.number}
                href={`/drivers/${driver.number}`}
                className={styles.driverCard}
              >
                <div className={styles.driverLeft}>
                  <span className={styles.driverNumberBadge}>{driver.number}</span>
                  {driver.image && (
                    <div className={styles.driverPhotoWrapper}>
                      <Image
                        src={driver.image}
                        alt={driver.name}
                        width={44}
                        height={44}
                        className={styles.driverPhoto}
                      />
                    </div>
                  )}
                  <div className={styles.driverMeta}>
                    <div className={styles.driverNameRow}>
                      <span className={styles.driverName}>{driver.name}</span>
                      {driver.country && (
                        <ReactCountryFlag
                          countryCode={driver.country}
                          svg
                          style={{
                            width: "1.2em",
                            height: "0.9em",
                            borderRadius: "2px",
                          }}
                        />
                      )}
                    </div>
                    <span className={styles.driverPoints}>{driver.points ?? 0} PUAN</span>
                  </div>
                </div>
                <span className={styles.arrowIcon}>→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>Bu takıma ait sürücü bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

export default TeamPageList;

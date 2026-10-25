'use client';

import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { useGameStore } from "../store/gameStore";
import locations from "../db/locations.json";
import news from "../db/news.json";
import styles from "./page.module.css";
import ModeGuard from "../components/ModeGuard";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  readTime: string;
}

const typedNews = news as NewsItem[];

const getWeatherIcon = (weather: string) => {
  switch (weather) {
    case "Yağmurlu": return "🌧️";
    case "Kuru": return "☀️";
    case "Geçiş": return "⛅";
    default: return "🌤️";
  }
};

export default function Home() {
  const { round, drivers, teams, season, resetGame } = useGameStore();

  const currentTrack = locations.find((l) => l.round === round) || locations[locations.length - 1];

  const topDrivers = [...drivers].sort((a, b) => b.points - a.points).slice(0, 3);
  const topTeams = [...teams].sort((a, b) => b.points - a.points).slice(0, 3);

  const handleReset = () => {
    if (window.confirm('Şampiyonaları ve puan tablosunu sıfırlamak istediğine emin misin? Bu işlem geri alınamaz.')) {
      resetGame();
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardGrid}>
        
        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>PİST <span>BİLGİLERİ</span></h2>
              <span className={styles.badge}>SEZON {season}</span>
            </div>
            
            {currentTrack && (
              <div className={styles.trackWidget}>
                <div className={styles.trackHeader}>
                  <div className={styles.trackName}>{currentTrack.name}</div>
                  <ReactCountryFlag 
                    countryCode={currentTrack.country_code} 
                    svg 
                    style={{
                      width: '2.5em',
                      height: '1.8em',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }} 
                  />
                </div>
                
                <div className={styles.trackDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tur</span>
                    <span className={styles.detailValue}>Round {currentTrack.round}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tarih</span>
                    <span className={styles.detailValue}>📅 {currentTrack.date}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ülke</span>
                    <span className={styles.detailValue}>{currentTrack.country}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Hava Durumu</span>
                    <span className={styles.detailValue}>
                      {getWeatherIcon(currentTrack.weather)} {currentTrack.weather}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${styles.card} ${styles.actionCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>ARAÇLAR <span>HAZIR</span></h2>
            </div>
            
            <Link href="/season-simulate" style={{ width: '100%' }}>
              <button className={styles.ctaButton} style={{ background: 'linear-gradient(135deg, #e10600, #b00000)', marginBottom: '10px' }}>
                ⚡ Sezonu Otomatik Simüle Et
              </button>
            </Link>
            <ModeGuard requiredMode={1}>
              <Link href="/race" style={{ width: '100%' }}>
                <button className={styles.ctaButton} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  🏁 Tekli Yarışa Git
                </button>
              </Link>
            </ModeGuard>
            <button
              onClick={handleReset}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#888899',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              🔄 Şampiyonayı Sıfırla
            </button>
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.card} style={{ minHeight: '400px' }}>
            <div className={`${styles.cardHeader} ${styles.newsCardHeader}`}>
              <h2 className={styles.cardTitle}>HABERLER</h2>
            </div>
            
            <div className={styles.newsFeed}>
              {typedNews.map((item) => (
                <div key={item.id} className={styles.newsCard}>
                  <div className={styles.newsHeader}>
                    <span className={styles.badge} style={{ fontSize: '0.65rem' }}>{item.category}</span>
                    <div className={styles.newsMeta}>
                      <span>📅 {item.date}</span>
                      <span>⏱️ {item.readTime}</span>
                    </div>
                  </div>
                  <h3 className={styles.newsTitle}>{item.title}</h3>
                  <p className={styles.newsContent}>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>SÜRÜCÜLER</h2>
            </div>
            
            <div className={styles.leaderboardList}>
              {topDrivers.map((driver, index) => (
                <Link 
                  href={`/standings/drivers`} 
                  key={driver.number} 
                  className={styles.leaderboardRow}
                >
                  <div className={`${styles.pos} ${styles[`pos${index + 1}`]}`}>
                    {index + 1}
                  </div>
                  <div className={styles.rowMainInfo}>
                    <span className={styles.rowName}>
                      {driver.name} 
                      <ReactCountryFlag countryCode={driver.country} svg style={{ fontSize: '0.9em' }} />
                    </span>
                    <span className={styles.rowSub}>{driver.team}</span>
                  </div>
                  <div className={styles.rowPoints}>
                    <span>{driver.points}</span>
                    <span className={styles.rowPtsLabel}>PTS</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>TAKIMLAR</h2>
            </div>
            
            <div className={styles.leaderboardList}>
              {topTeams.map((team, index) => (
                <Link 
                  href={`/standings/teams`} 
                  key={team.name} 
                  className={styles.leaderboardRow}
                >
                  <div className={`${styles.pos} ${styles[`pos${index + 1}`]}`}>
                    {index + 1}
                  </div>
                  <div className={styles.rowMainInfo}>
                    <span className={styles.rowName}>{team.name}</span>
                  </div>
                  <div className={styles.rowPoints}>
                    <span>{team.points}</span>
                    <span className={styles.rowPtsLabel}>PTS</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

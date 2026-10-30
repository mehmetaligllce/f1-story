'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactCountryFlag from 'react-country-flag';
import { useGameStore } from '../store/gameStore';
import { simulateRace } from '../hooks/raceSimulator';
import locations from '../db/locations.json';
import type { Driver } from '../types/driver';
import type { Location } from '../types/locations';
import styles from './SeasonSimulator.module.css';

interface RaceSimResult {
  position: number;
  name: string;
  points: number;
  teamScore: number;
  driverScore: number;
  luck: number;
}

interface LastRaceInfo {
  location: typeof locations[0];
  results: RaceSimResult[];
}

const getWeatherIcon = (weather: string) => {
  switch (weather) {
    case "Yağmurlu": return "🌧️";
    case "Kuru": return "☀️";
    case "Geçiş": return "⛅";
    default: return "🌤️";
  }
};

const getCircuitTypeLabel = (circuitType: string) => {
  switch (circuitType) {
    case "street": return "🏙️ Şehir Pisti";
    case "power": return "🚀 Güç Pisti";
    case "technic": return "🌀 Teknik Pist";
    default: return "🏎️ Dengeli Pist";
  }
};

export const SeasonSimulator = () => {
  const { round, season, drivers, teams, addRaceResult, resetGame, nextSeason } = useGameStore();

  const [isRunning, setIsRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(1500); // 1.5 seconds per race by default
  const [lastRace, setLastRace] = useState<LastRaceInfo | null>(null);
  const [raceHistory, setRaceHistory] = useState<{ round: number; locationName: string; countryCode: string; winnerName: string; winnerTeam: string; winnerImage: string }[]>([]);
  const [ratingNotice, setRatingNotice] = useState<string | null>(null);
  const ratingNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalRounds = locations.length;
  const isSeasonEnded = round > totalRounds;

  const sortedDrivers = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
  const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));

  const getDriverObj = React.useCallback((name: string): Driver | undefined => {
    return drivers.find(d => d.name === name);
  }, [drivers]);

  const handleSimulateSingleRace = React.useCallback(() => {
    if (round > totalRounds) return;

    const currentLoc = locations.find(l => l.round === round) || locations[round - 1] || locations[0];
    const results = simulateRace(drivers, teams, currentLoc as Location);
    const driverNamesOrder = results.map(r => r.name);

    const winnerDriver = getDriverObj(results[0].name);
    addRaceResult(driverNamesOrder);

    setLastRace({
      location: currentLoc,
      results
    });

    setRaceHistory(prev => [
      {
        round: currentLoc.round,
        locationName: currentLoc.name,
        countryCode: currentLoc.country_code,
        winnerName: results[0].name,
        winnerTeam: winnerDriver?.team || '',
        winnerImage: winnerDriver?.image || '/images/drivers/max-verstappen.webp'
      },
      ...prev
    ]);

    if (currentLoc.round % 6 === 0) {
      setRatingNotice(`⚡ ${currentLoc.round}. Yarış tamamlandı! Sürücü ve takım form grafiği güncellendi.`);
      if (ratingNoticeTimerRef.current) clearTimeout(ratingNoticeTimerRef.current);
      ratingNoticeTimerRef.current = setTimeout(() => setRatingNotice(null), 4000);
    }
  }, [round, totalRounds, drivers, teams, addRaceResult, getDriverObj]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let stopTimer: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (round <= totalRounds) {
        timer = setTimeout(() => {
          handleSimulateSingleRace();
        }, speedMs);
      } else {
        stopTimer = setTimeout(() => {
          setIsRunning(false);
        }, 0);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (stopTimer) clearTimeout(stopTimer);
      if (ratingNoticeTimerRef.current) clearTimeout(ratingNoticeTimerRef.current);
    };
  }, [isRunning, round, speedMs, totalRounds, handleSimulateSingleRace]);

  const handleToggleRun = () => {
    if (isSeasonEnded) {
      if (window.confirm('Sezon sona erdi. Yeni sezona başlamak ister misiniz?')) {
        nextSeason();
        setLastRace(null);
        setRaceHistory([]);
        setIsRunning(true);
      }
      return;
    }
    setIsRunning(prev => !prev);
  };

  const handleResetSeason = () => {
    if (window.confirm('Şampiyona verilerini sıfırlayıp 1. Yarıştan başlamak istediğinize emin misiniz?')) {
      setIsRunning(false);
      resetGame();
      setLastRace(null);
      setRaceHistory([]);
      fetch('/api/generate-news', { method: 'DELETE' }).catch(() => {});
    }
  };

  const handleNextSeasonClick = () => {
    nextSeason();
    setLastRace(null);
    setRaceHistory([]);
  };

  const winnerObj = lastRace ? getDriverObj(lastRace.results[0].name) : null;
  const p2Obj = lastRace ? getDriverObj(lastRace.results[1].name) : null;
  const p3Obj = lastRace ? getDriverObj(lastRace.results[2].name) : null;

  const progressPercent = Math.min(100, Math.round(((round - 1) / totalRounds) * 100));

  return (
    <div className={styles.simulatorContainer}>
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <span className={styles.seasonBadge}>{season} F1 DÜNYA ŞAMPİYONASI</span>
          <h1 className={styles.title}>Otomatik Sezon Simülasyonu</h1>
          <p className={styles.subtitle}>
            Yarışları canlı adımlarla simüle edin, kazananları ve canlı puan durumunu takip edin.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.roundBox}>
            <span className={styles.roundNumber}>
              {isSeasonEnded ? totalRounds : Math.min(round, totalRounds)} / {totalRounds}
            </span>
            <span className={styles.roundLabel}>TAMAMLANAN YARIŞ</span>
          </div>
        </div>
      </div>
      <div className={styles.progressSection}>
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className={styles.progressInfo}>
          <span>İlerleme: %{progressPercent}</span>
          <span>{isSeasonEnded ? '🏁 Sezon Bitti!' : `Sıradaki: Round ${round} (${locations.find(l => l.round === round)?.name || 'Abu Dhabi GP'})`}</span>
        </div>
      </div>

      <div className={styles.controlsBar}>
        <button
          onClick={handleToggleRun}
          className={`${styles.mainBtn} ${isRunning ? styles.pauseBtn : styles.startBtn}`}
        >
          {isRunning ? '⏸️ Simülasyonu Duraklat' : isSeasonEnded ? '🏁 Yeni Sezona Başla' : '▶️ Sezonu Simüle Et'}
        </button>

        <button
          onClick={handleSimulateSingleRace}
          disabled={isRunning || isSeasonEnded}
          className={styles.stepBtn}
        >
          ⏩ Tek Yarış Oyna
        </button>

        <div className={styles.speedSelector}>
          <span className={styles.speedLabel}>Hız:</span>
          <button
            className={`${styles.speedBtn} ${speedMs === 2000 ? styles.activeSpeed : ''}`}
            onClick={() => setSpeedMs(2000)}
          >
            1x (Yavaş)
          </button>
          <button
            className={`${styles.speedBtn} ${speedMs === 1200 ? styles.activeSpeed : ''}`}
            onClick={() => setSpeedMs(1200)}
          >
            2x (Normal)
          </button>
          <button
            className={`${styles.speedBtn} ${speedMs === 600 ? styles.activeSpeed : ''}`}
            onClick={() => setSpeedMs(600)}
          >
            4x (Hızlı)
          </button>
        </div>

        <button onClick={handleResetSeason} className={styles.resetBtn}>
          🔄 Sezonu Sıfırla
        </button>
      </div>
      {ratingNotice && (
        <div className={styles.ratingToast}>
          {ratingNotice}
        </div>
      )}
      {isSeasonEnded && sortedDrivers[0] && (
        <div className={styles.championCard}>
          <div className={styles.championBadge}>🏆 DÜNYA ŞAMPİYONU</div>
          <div className={styles.championMain}>
            <div className={styles.championImgWrapper}>
              <Image
                src={sortedDrivers[0].image}
                alt={sortedDrivers[0].name}
                width={180}
                height={180}
                className={styles.championImg}
              />
            </div>
            <div className={styles.championDetails}>
              <h2 className={styles.championName}>{sortedDrivers[0].name}</h2>
              <div className={styles.championTeam}>{sortedDrivers[0].team}</div>
              <div className={styles.championPoints}>{sortedDrivers[0].points} PTS</div>
            </div>
          </div>
          <button onClick={handleNextSeasonClick} className={styles.nextSeasonBtn}>
            🏆 Sonraki Sezona Başla ({season + 1})
          </button>
        </div>
      )}
      <div className={styles.mainGrid}>
        
        <div className={styles.raceHeroColumn}>
          {lastRace ? (
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.trackInfoWrapper}>
                  <ReactCountryFlag
                    countryCode={lastRace.location.country_code}
                    svg
                    style={{
                      width: '3.2em',
                      height: '2.2em',
                      borderRadius: '6px',
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                  <div>
                    <span className={styles.roundTag}>ROUND {lastRace.location.round}</span>
                    <h2 className={styles.trackTitle}>{lastRace.location.name}</h2>
                    <div className={styles.trackMeta}>
                      <span>{getWeatherIcon(lastRace.location.weather)} {lastRace.location.weather}</span>
                      <span>•</span>
                      <span>{getCircuitTypeLabel(lastRace.location.circuit_type)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {winnerObj && (
                <div className={styles.winnerSection}>
                  <div className={styles.winnerHeaderBadge}>
                    <span>🥇 YARIŞ KAZANANI (+25 PTS)</span>
                  </div>

                  <div className={styles.winnerBody}>
                    <div className={styles.winnerImageContainer}>
                      <Image
                        src={winnerObj.image}
                        alt={winnerObj.name}
                        width={240}
                        height={240}
                        className={styles.winnerImage}
                        priority
                      />
                    </div>

                    <div className={styles.winnerDetails}>
                      <div className={styles.winnerNumber}>#{winnerObj.number}</div>
                      <h3 className={styles.winnerName}>{winnerObj.name}</h3>
                      <div className={styles.winnerTeam}>{winnerObj.team}</div>
                      <div className={styles.winnerScoreBadge}>
                        Simülasyon Skoru: <strong>{lastRace.results[0].points} pts</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className={styles.podiumRow}>
                {p2Obj && (
                  <div className={styles.podiumCard}>
                    <div className={styles.podiumBadge}>🥈 2. SIRA (+18 PTS)</div>
                    <div className={styles.podiumDriver}>
                      <Image src={p2Obj.image} alt={p2Obj.name} width={60} height={60} className={styles.podiumImg} />
                      <div>
                        <div className={styles.podiumName}>{p2Obj.name}</div>
                        <div className={styles.podiumTeam}>{p2Obj.team}</div>
                      </div>
                    </div>
                  </div>
                )}

                {p3Obj && (
                  <div className={styles.podiumCard}>
                    <div className={styles.podiumBadge}>🥉 3. SIRA (+15 PTS)</div>
                    <div className={styles.podiumDriver}>
                      <Image src={p3Obj.image} alt={p3Obj.name} width={60} height={60} className={styles.podiumImg} />
                      <div>
                        <div className={styles.podiumName}>{p3Obj.name}</div>
                        <div className={styles.podiumTeam}>{p3Obj.team}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.finishersSection}>
                <h4 className={styles.finishersTitle}>Yarış İlk 10 Derecesi</h4>
                <div className={styles.finishersList}>
                  {lastRace.results.slice(0, 10).map((res) => {
                    const dObj = getDriverObj(res.name);
                    return (
                      <div key={res.name} className={styles.finisherRow}>
                        <span className={styles.finisherPos}>P{res.position}</span>
                        <span className={styles.finisherName}>{res.name}</span>
                        <span className={styles.finisherTeam}>{dObj?.team}</span>
                        <span className={styles.finisherPts}>
                          {res.position === 1 ? '+25' : res.position === 2 ? '+18' : res.position === 3 ? '+15' : res.position === 4 ? '+12' : res.position === 5 ? '+10' : res.position === 6 ? '+8' : res.position === 7 ? '+6' : res.position === 8 ? '+4' : res.position === 9 ? '+2' : res.position === 10 ? '+1' : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className={styles.placeholderCard}>
              <div className={styles.placeholderIcon}>🏎️</div>
              <h3>Simülasyon Başlamadı</h3>
              <p>Yarışları simüle etmek ve kazanan fotoğrafını görmek için <strong>&quot;▶️ Sezonu Simüle Et&quot;</strong> butonuna basın.</p>
            </div>
          )}
        </div>

        <div className={styles.sideColumn}>

          <div className={styles.standingsCard}>
            <div className={styles.cardHeader}>
              <h3>🏆 Canlı Sürücüler Puan Durumu</h3>
            </div>
            <div className={styles.leaderList}>
              {sortedDrivers.slice(0, 8).map((driver, index) => (
                <div key={driver.number} className={styles.leaderRow}>
                  <div className={`${styles.posBadge} ${styles[`pos${index + 1}`] || ''}`}>
                    {index + 1}
                  </div>
                  <div className={styles.leaderInfo}>
                    <span className={styles.leaderName}>{driver.name}</span>
                    <span className={styles.leaderTeam}>{driver.team}</span>
                  </div>
                  <div className={styles.leaderPts}>
                    <strong>{driver.points}</strong> <span>PTS</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/standings/drivers" className={styles.viewAllLink}>
              Tüm Sürücüler Puan Tablosu →
            </Link>
          </div>

          <div className={styles.standingsCard}>
            <div className={styles.cardHeader}>
              <h3>🏎️ Canlı Takımlar Puan Durumu</h3>
            </div>
            <div className={styles.leaderList}>
              {sortedTeams.slice(0, 5).map((team, index) => (
                <div key={team.name} className={styles.leaderRow}>
                  <div className={`${styles.posBadge} ${styles[`pos${index + 1}`] || ''}`}>
                    {index + 1}
                  </div>
                  <div className={styles.leaderInfo}>
                    <span className={styles.leaderName}>{team.name}</span>
                  </div>
                  <div className={styles.leaderPts}>
                    <strong>{team.points}</strong> <span>PTS</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/standings/teams" className={styles.viewAllLink}>
              Tüm Takımlar Puan Tablosu →
            </Link>
          </div>

          {raceHistory.length > 0 && (
            <div className={styles.historyCard}>
              <div className={styles.cardHeader}>
                <h3>📜 Tamamlanan Yarışlar ({raceHistory.length})</h3>
              </div>
              <div className={styles.historyList}>
                {raceHistory.map((item) => (
                  <div key={item.round} className={styles.historyItem}>
                    <span className={styles.historyRound}>R{item.round}</span>
                    <ReactCountryFlag countryCode={item.countryCode} svg style={{ width: '1.2em', height: '0.9em', borderRadius: '2px' }} />
                    <div className={styles.historyTrackInfo}>
                      <span className={styles.historyTrack}>{item.locationName}</span>
                      <span className={styles.historyWinner}> Kazanan: <strong>{item.winnerName}</strong> ({item.winnerTeam})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

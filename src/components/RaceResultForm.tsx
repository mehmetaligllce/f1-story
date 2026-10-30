'use client'

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useGameStore } from "../store/gameStore"
import locations from "../db/locations.json"
import { simulateRace } from "@/src/hooks/raceSimulator"
import styles from "./RaceResultForm.module.css"

interface SimResult {
  position: number
  name: string
  points: number
  teamScore: number
  driverScore: number
  luck: number
}

const getF1Points = (pos: number) => {
  const pts = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return pos <= 10 ? pts[pos - 1] : 0;
};

const RaceResultForm = () => {
  const router = useRouter();

  const round = useGameStore((state) => state.round);
  const season = useGameStore((state) => state.season);
  const storeDrivers = useGameStore((state) => state.drivers);
  const storeTeams = useGameStore((state) => state.teams);
  const addRaceResult = useGameStore((state) => state.addRaceResult);

  const currentLocation =
    locations.find((l) => l.round === round) ||
    locations[(round - 1) % locations.length] ||
    locations[0];

  const [raceResults, setRaceResults] = useState<SimResult[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [manualResults, setManualResults] = useState<string[]>(Array(10).fill(''));
  const [showManual, setShowManual] = useState(false);

  const handleStartRace = async () => {
    setIsSimulating(true);
    setNewsStatus('generating');

    try {
      const currentDrivers = useGameStore.getState().drivers;
      const currentTeams = useGameStore.getState().teams;
      const currentRoundNum = useGameStore.getState().round;

      const track =
        locations.find((l) => l.round === currentRoundNum) ||
        locations[(currentRoundNum - 1) % locations.length] ||
        locations[0];

      const results = simulateRace(currentDrivers, currentTeams, track);
      const trackName = `${track.name} (${track.country})`;

      const res = await fetch('/api/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: results,
          track: trackName
        })
      });

      if (res.ok) {
        setNewsStatus('done');
      } else {
        setNewsStatus('error');
      }

      addRaceResult(results.map((r) => r.name));

      setRaceResults(results);
    } catch (err) {
      console.error("Gemini haber üretimi hatası:", err);
      setNewsStatus('error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleManualSelect = (index: number, name: string) => {
    const updated = [...manualResults];
    updated[index] = name;
    setManualResults(updated);
  };

  const handleManualSubmit = async () => {
    if (manualResults.some((d) => !d)) {
      alert("Lütfen ilk 10 pozisyon için tüm sürücüleri seçin!");
      return;
    }

    setIsSimulating(true);
    setNewsStatus('generating');

    const trackName = `${currentLocation.name} (${currentLocation.country})`;

    addRaceResult(manualResults);

    try {
      await fetch('/api/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: manualResults,
          track: trackName
        })
      });
      setNewsStatus('done');
    } catch (err) {
      console.error(err);
      setNewsStatus('error');
    } finally {
      setIsSimulating(false);
      router.push('/');
    }
  };

  const p1 = raceResults ? raceResults[0] : null;
  const p2 = raceResults ? raceResults[1] : null;
  const p3 = raceResults ? raceResults[2] : null;

  return (
    <div className={styles.container}>
      <div className={styles.trackCard}>
        <div className={styles.trackHeader}>
          <div>
            <span className={styles.seasonBadge}>SEZON {season} • RAUND {round}</span>
            <h1 className={styles.trackTitle}>{currentLocation.name} Grand Prix</h1>
            <p className={styles.trackSubtitle}>📍 {currentLocation.country}</p>
          </div>
          <div className={styles.circuitBadges}>
            <span className={styles.chip}>☀️ Hava: <strong>{currentLocation.weather}</strong></span>
            <span className={styles.chip}>🏎️ Tip: <strong>{currentLocation.circuit_type.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>

      {isSimulating && (
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <h3>🏎️ Yarış Simüle Ediliyor ve Gemini AI Haberleri Üretiliyor...</h3>
          <p>Algoritma pist ve sürücü performanslarını hesaplıyor, Gemini AI yarış haberlerini kaleme alıyor. Lütfen bekleyin.</p>
        </div>
      )}

      {!raceResults && !isSimulating && (
        <div className={styles.actionCard}>
          <h2>Resmi Yarış Simülasyonu</h2>
          <p>Yarış algoritması sürücü yeteneği, takım performansı, pist özellikleri ve şans katsayısını hesaplar.</p>
          <button
            onClick={handleStartRace}
            disabled={isSimulating}
            className={styles.startRaceBtn}
          >
            🏁 YARIŞI BAŞLAT 🏁
          </button>
        </div>
      )}

      {raceResults && (
        <div className={`${styles.newsBanner} ${styles[newsStatus]}`}>
          {newsStatus === 'generating' && (
            <>
              <div className={styles.pulseDot}></div>
              <span>🤖 Gemini AI haberleri üretiyor ve ana sayfaya aktarıyor...</span>
            </>
          )}
          {newsStatus === 'done' && (
            <>
              <span>✨ Gemini F1 haberleri başarıyla üretildi ve ana sayfaya eklendi!</span>
            </>
          )}
          {newsStatus === 'error' && (
            <>
              <span>⚠️ Yarış simüle edildi fakat AI haber servisine ulaşılamadı.</span>
            </>
          )}
        </div>
      )}

      {raceResults && (
        <div className={styles.resultsSection}>
          <div className={styles.sectionHeader}>
            <h2>Yarış Sonuçları Grid Tablosu</h2>
            <span className={styles.liveTag}>CANLI SONUÇLAR</span>
          </div>

          <div className={styles.podiumContainer}>
            {p2 && (() => {
              const driver = storeDrivers.find((d) => d.name === p2.name);
              const team = storeTeams.find((t) => t.name === driver?.team);
              return (
                <div className={`${styles.podiumCard} ${styles.silverPodium}`}>
                  <div className={styles.podiumBadge}>P2</div>
                  <div className={styles.podiumAvatar}>
                    {driver && (
                      <Image
                        src={driver.image}
                        alt={driver.name}
                        width={120}
                        height={120}
                        className={styles.podiumDriverImg}
                      />
                    )}
                  </div>
                  <h3 className={styles.podiumDriverName}>{p2.name}</h3>
                  <div className={styles.podiumTeamRow}>
                    {team && (
                      <Image src={team.image} alt={team.name} width={24} height={24} className={styles.teamLogoImg} />
                    )}
                    <span>{driver?.team}</span>
                  </div>
                  <div className={styles.podiumScoreRow}>
                    <span className={styles.ptsBadge}>+18 PTS</span>
                  </div>
                </div>
              );
            })()}

            {p1 && (() => {
              const driver = storeDrivers.find((d) => d.name === p1.name);
              const team = storeTeams.find((t) => t.name === driver?.team);
              return (
                <div className={`${styles.podiumCard} ${styles.goldPodium}`}>
                  <div className={styles.winnerCrown}>🏆 KAZANAN</div>
                  <div className={styles.podiumBadge}>P1</div>
                  <div className={styles.podiumAvatar}>
                    {driver && (
                      <Image
                        src={driver.image}
                        alt={driver.name}
                        width={140}
                        height={140}
                        className={styles.podiumDriverImg}
                      />
                    )}
                  </div>
                  <h3 className={styles.podiumDriverName}>{p1.name}</h3>
                  <div className={styles.podiumTeamRow}>
                    {team && (
                      <Image src={team.image} alt={team.name} width={28} height={28} className={styles.teamLogoImg} />
                    )}
                    <span>{driver?.team}</span>
                  </div>
                  <div className={styles.podiumScoreRow}>
                    <span className={`${styles.ptsBadge} ${styles.goldPts}`}>+25 PTS</span>
                  </div>
                </div>
              );
            })()}

            {p3 && (() => {
              const driver = storeDrivers.find((d) => d.name === p3.name);
              const team = storeTeams.find((t) => t.name === driver?.team);
              return (
                <div className={`${styles.podiumCard} ${styles.bronzePodium}`}>
                  <div className={styles.podiumBadge}>P3</div>
                  <div className={styles.podiumAvatar}>
                    {driver && (
                      <Image
                        src={driver.image}
                        alt={driver.name}
                        width={120}
                        height={120}
                        className={styles.podiumDriverImg}
                      />
                    )}
                  </div>
                  <h3 className={styles.podiumDriverName}>{p3.name}</h3>
                  <div className={styles.podiumTeamRow}>
                    {team && (
                      <Image src={team.image} alt={team.name} width={24} height={24} className={styles.teamLogoImg} />
                    )}
                    <span>{driver?.team}</span>
                  </div>
                  <div className={styles.podiumScoreRow}>
                    <span className={styles.ptsBadge}>+15 PTS</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className={styles.gridList}>
            <div className={styles.gridListHeader}>
              <span>POS</span>
              <span>SÜRÜCÜ & TAKIM</span>
              <span>PUAN</span>
            </div>

            {raceResults.map((res) => {
              const driver = storeDrivers.find((d) => d.name === res.name);
              const team = storeTeams.find((t) => t.name === driver?.team);
              const ptsEarned = getF1Points(res.position);

              return (
                <div key={res.name} className={`${styles.gridRow} ${res.position <= 10 ? styles.pointsPosition : ''}`}>
                  <div className={`${styles.posBadge} ${styles[`pos${res.position}`] || ''}`}>
                    P{res.position}
                  </div>

                  <div className={styles.driverInfoCell}>
                    {driver && (
                      <div className={styles.rowAvatar}>
                        <Image
                          src={driver.image}
                          alt={res.name}
                          width={44}
                          height={44}
                          className={styles.rowDriverImg}
                        />
                      </div>
                    )}
                    <div className={styles.driverText}>
                      <span className={styles.rowDriverName}>
                        {res.name} <small>#{driver?.number}</small>
                      </span>
                      <span className={styles.rowTeamName}>
                        {team && (
                          <Image src={team.image} alt="" width={16} height={16} className={styles.miniTeamLogo} />
                        )}
                        {driver?.team}
                      </span>
                    </div>
                  </div>

                  <div className={styles.pointsCell}>
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

          <div className={styles.bottomActions}>
            <button className={styles.primaryNavBtn} onClick={() => router.push('/')}>
              🏠 Ana Sayfaya Dön (Haberleri Oku)
            </button>
          </div>
        </div>
      )}

      {!raceResults && (
        <div className={styles.manualToggleContainer}>
          <button
            className={styles.toggleManualBtn}
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? "▲ Manuel Giriş Formunu Gizle" : "▼ Manuel Giriş Yapmak İstiyorum"}
          </button>

          {showManual && (
            <div className={styles.manualForm}>
              <h3>Manuel Sonuç Girişi (İlk 10)</h3>
              <div className={styles.manualList}>
                {Array.from({ length: 10 }).map((_, index) => {
                  const selectedDriver = storeDrivers.find((d) => d.name === manualResults[index]);
                  return (
                    <div key={index} className={styles.manualRow}>
                      <span className={styles.manualPos}>P{index + 1}</span>
                      <div className={styles.selectWrapper}>
                        <select
                          value={manualResults[index]}
                          onChange={(e) => handleManualSelect(index, e.target.value)}
                          className={styles.select}
                        >
                          <option value="">Sürücü Seçin...</option>
                          {storeDrivers.map((d) => (
                            <option key={d.name} value={d.name} disabled={manualResults.includes(d.name) && manualResults[index] !== d.name}>
                              {d.name} ({d.team})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedDriver && (
                        <div className={styles.selectedDriverPreview}>
                          <Image src={selectedDriver.image} alt="" width={40} height={40} className={styles.miniDriverImg} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={handleManualSubmit} className={styles.manualSubmitBtn} disabled={isSimulating}>
                Manuel Sonuçları Kaydet & Simüle Et
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RaceResultForm;

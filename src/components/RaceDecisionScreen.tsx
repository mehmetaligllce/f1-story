"use client"
import { useGameStore } from '../store/gameStore'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import ReactCountryFlag from 'react-country-flag'
import styles from './RaceDecisionScreen.module.css'
import { useCountdown } from 'usehooks-ts'
import { useEffect, useState } from 'react'
import type{RaceEvent} from '@/src/types/events.ts'
import events from '@/src/db/events.json' 
import { simulateQualifying, simulateRace } from '../hooks/raceSimulator'
import locations from '@/src/db/locations.json'
import { PrepareEvent } from '../hooks/PrepareEvent'
import type { RaceOption } from '@/src/types/events.ts'

export const RaceDecisionScreen = () => {

    const router = useRouter();
    const { driverNumber } = useParams();
    const season = useGameStore((state) => state.season);
    const addRaceResult = useGameStore((state) => state.addRaceResult);
    const [count, { startCountdown, resetCountdown }] = useCountdown({ countStart: 15 });
    const driver = useGameStore((state) => state.drivers.find((d) => d.number == Number(driverNumber)));
    const team = useGameStore((state) => state.teams.find((d) => d.name === driver?.team));
    const location = locations.find((l) => l.round == useGameStore.getState().round) || locations[0];
    
    const [isRaceStarted, setIsRaceStarted] = useState<boolean>(false);
    const [totalImpact, setTotalImpact] = useState<number>(0);
    const [raceFinished, setRaceFinished] = useState<boolean>(false);
    const [finalResult, setFinalResult] = useState<{
        position: number;
        initialPosition: number;
        points: number;
        impact: number;
    } | null>(null);
    const [newsStatus, setNewsStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
    const [generatedNews, setGeneratedNews] = useState<{ id: number; title: string; category: string }[]>([]);

    const [decisionLaps] = useState(() => {
        const step = Math.floor(location.laps / 4);

        return [0, 1, 2, 3].map((i) => {
            const lap = i * step + 1 + Math.floor(Math.random() * step);
            return Math.max(2, Math.min(lap, location.laps));
        });
    });

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    };

    const [gridOrder] = useState(() => simulateQualifying(
        useGameStore.getState().drivers,
        useGameStore.getState().teams,
        location
    ));
    const position = gridOrder.findIndex((d) => d.name == driver?.name) + 1;

    const findEvents = (eventsList: RaceEvent[]) => {
        const resolveLap = (lap: number) => lap < 0 ? location.laps + lap + 1 : lap;
        const usedIds = new Set<string>();

        return decisionLaps.flatMap((decisionLap) => {
            const candidates = eventsList.filter((event) => {
                if (usedIds.has(event.id)) return false;
                const minLap = resolveLap(event.lap[0]);
                const maxLap = resolveLap(event.lap[1]);
                return decisionLap >= minLap && decisionLap <= maxLap
                    && position >= event.position[0] && position <= event.position[1];
            });

            let picked: RaceEvent;
            if (candidates.length > 0) {
                picked = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
                const fallback = eventsList.filter((event) => {
                    const minLap = resolveLap(event.lap[0]);
                    const maxLap = resolveLap(event.lap[1]);
                    return decisionLap >= minLap && decisionLap <= maxLap
                        && position >= event.position[0] && position <= event.position[1];
                });
                if (fallback.length === 0) return [];
                picked = fallback[Math.floor(Math.random() * fallback.length)];
            }

            usedIds.add(picked.id);
            return [{ lap: decisionLap, event: PrepareEvent(picked, driver!, gridOrder, location, decisionLap) }];
        });
    };

    const [raceEvents] = useState(() => findEvents(events as RaceEvent[]));
    const [currentIndex, setCurrentIndex] = useState(0);
    const current = raceEvents[currentIndex];

    const optionPositions = [
        { left: '8.4%',   top: '45.8%', right: '66.12%', bottom: '23.3%' },
        { left: '37.77%', top: '45.8%', right: '36.62%', bottom: '23.3%' },
        { left: '67.14%', top: '45.8%', right: '7.12%',  bottom: '23.3%' },
    ];

    const handleStartRace = () => {
        handleFullScreen();
        setIsRaceStarted(true);
        resetCountdown();
        startCountdown();
    };

    const finishRace = async (finalImpact: number) => {
        const currentDrivers = useGameStore.getState().drivers;
        const currentTeams = useGameStore.getState().teams;

        const simResults = simulateRace(currentDrivers, currentTeams, location);

        const initialIndex = simResults.findIndex((r) => r.name === driver?.name);
        const initialPos = initialIndex !== -1 ? initialIndex + 1 : 10;

        const newPos = Math.max(1, Math.min(22, initialPos - finalImpact));
        const newIndex = newPos - 1;

        const reordered = [...simResults];
        if (initialIndex !== -1) {
            const [playerItem] = reordered.splice(initialIndex, 1);
            reordered.splice(newIndex, 0, playerItem);
        }

        const finalResults = reordered.map((item, idx) => ({
            position: idx + 1,
            name: item.name,
            points: item.points
        }));

        addRaceResult(finalResults.map((r) => r.name));

        const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
        const pointsEarned = newPos <= 10 ? pointsTable[newPos - 1] : 0;

        setFinalResult({
            position: newPos,
            initialPosition: initialPos,
            points: pointsEarned,
            impact: finalImpact,
        });
        setRaceFinished(true);

        setNewsStatus('generating');
        try {
            const trackName = `${location.name} (${location.country})`;
            const res = await fetch('/api/generate-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    result: finalResults,
                    winner: finalResults[0].name,
                    top3: [finalResults[0].name, finalResults[1].name, finalResults[2].name],
                    track: trackName
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNewsStatus('done');
                if (data?.data && Array.isArray(data.data)) {
                    setGeneratedNews(data.data.slice(0, 3));
                }
            } else {
                setNewsStatus('error');
            }
        } catch (err) {
            console.error("Gemini haber üretimi hatası:", err);
            setNewsStatus('error');
        }
    };

    const selectOption = (option: RaceOption) => {
        const impact = option.impact ?? 0;
        const newTotalImpact = totalImpact + impact;
        setTotalImpact(newTotalImpact);

        const nextIndex = currentIndex + 1;
        if (nextIndex >= raceEvents.length) {
            finishRace(newTotalImpact);
        } else {
            setCurrentIndex(nextIndex);
            resetCountdown();
            startCountdown();
        }
    };

    useEffect(() => {
        if (!isRaceStarted || count !== 0 || !current || raceFinished) return;
        const timeout = setTimeout(() => {
            const options = current.event.options;
            const random = options[Math.floor(Math.random() * options.length)];
            selectOption(random);
        }, 0);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRaceStarted, count, raceFinished]);

    return (
        <div
            onClick={handleFullScreen}
            className={styles.screenContainer}
        >
            {team?.background && (
                <Image
                    src={team.background}
                    alt={team.name}
                    fill
                    priority
                    sizes="100vw"
                    draggable={false}
                    className={styles.bgImage}
                />
            )}

            <div className={styles.contentWrapper}>
                {!isRaceStarted ? (
                    <div className={styles.briefingOverlay}>
                        <div className={styles.briefingContainer}>
                            <div className={styles.briefingHeader}>
                                <p className={styles.briefingSubtitle}>SEZON {season} • RAUND {location.round}</p>
                                <h1 className={styles.briefingTitle}>{location.name} Grand Prix</h1>
                            </div>

                            <div className={styles.briefingGrid}>
                                {/* Sürücü & Takım Kartı */}
                                <div className={styles.briefingCard}>
                                    <div className={styles.briefingCardTitle}>🏎️ Sürücü & Takım</div>
                                    <div className={styles.briefingDriverContent}>
                                        <div className={styles.briefingAvatar}>
                                            {driver && (
                                                <Image
                                                    src={driver.image}
                                                    alt={driver.name}
                                                    fill
                                                    sizes="80px"
                                                    className={styles.driverImg}
                                                />
                                            )}
                                        </div>
                                        <div className={styles.briefingDriverInfo}>
                                            <span className={styles.briefingDriverNum}>#{driver?.number}</span>
                                            <div className={styles.briefingDriverName}>
                                                {driver?.name}
                                                {driver?.country && (
                                                    <ReactCountryFlag countryCode={driver.country} svg style={{ fontSize: '1rem' }} />
                                                )}
                                            </div>
                                            <div className={styles.briefingTeamRow}>
                                                {team?.image && (
                                                    <Image src={team.image} alt="" width={18} height={18} />
                                                )}
                                                <span>{driver?.team}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.briefingCard}>
                                    <div className={styles.briefingCardTitle}>⏱️ Sıralama Turları (Grid)</div>
                                    <div className={styles.qualiBadgeBig}>
                                        <div className={styles.qualiGridLabel}>BAŞLANGIÇ POZİSYONU</div>
                                        <div className={styles.qualiGridPos}>P{position}</div>
                                       
                                    </div>
                                    <div className={styles.qualiMiniList}>
                                        {gridOrder.slice(0, 4).map((g) => (
                                            <div
                                                key={g.name}
                                                className={`${styles.qualiMiniRow} ${g.name === driver?.name ? styles.qualiMiniRowActive : ''}`}
                                            >
                                                <span>P{g.gridPosition} {g.name} {g.name === driver?.name ? '(Sen)' : ''}</span>
                                                <small>{g.team.replace(' F1 Team', '').replace('Scuderia ', '')}</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.briefingCard}>
                                    <div className={styles.briefingCardTitle}>📍 Pist & Koşullar</div>
                                    <div className={styles.trackDetailList}  >
                                        <div className={styles.trackDetailRow}>
                                            <span>Ülke</span>
                                            <strong>
                                                {location.country}{' '}
                                                {location.country_code && (
                                                    <ReactCountryFlag countryCode={location.country_code} svg style={{ marginLeft: 4 }} />
                                                )}
                                            </strong>
                                        </div>
                                        <div className={styles.trackDetailRow}>
                                            <span>Hava Durumu</span>
                                            <strong>{location.weather}</strong>
                                        </div>
                                        <div className={styles.trackDetailRow}>
                                            <span>Pist Tipi</span>
                                            <strong>{location.circuit_type.toUpperCase()}</strong>
                                        </div>
                                        <div className={styles.trackDetailRow}>
                                            <span>Mesafe</span>
                                            <strong>{location.laps} Tur</strong>
                                        </div>
                                       
                                    </div>
                                </div>
                            </div>

                            <button
                                className={styles.briefingStartBtn}
                                onClick={handleStartRace}
                            >
                                🏁 KOKPİTE GEÇ VE YARIŞA BAŞLA
                            </button>
                        </div>
                    </div>
                ) : raceFinished && finalResult ? (
                    <div className={styles.resultOverlay}>
                        <div className={styles.resultCard}>
                            <div className={styles.flagIcon}>🏁</div>
                            <h1 className={styles.resultTitle}>YARIŞ TAMAMLANDI!</h1>
                            <p className={styles.resultTrackName}>{location.name} Grand Prix</p>

                            <div className={styles.driverHighlight}>
                                {driver && (
                                    <div className={styles.driverAvatarWrapper}>
                                        <Image
                                            src={driver.image}
                                            alt={driver.name}
                                            width={64}
                                            height={64}
                                            className={styles.driverImg}
                                        />
                                    </div>
                                )}
                                <div>
                                    <h2 className={styles.driverResultName}>{driver?.name}</h2>
                                    <span className={styles.teamResultBadge}>{driver?.team}</span>
                                </div>
                            </div>

                            <div className={styles.statsGrid}>
                                <div className={styles.statBox}>
                                    <span className={styles.statLabel}>BİTİŞ SIRASI</span>
                                    <span className={`${styles.statValue} ${styles[`pos${finalResult.position}`] || ''}`}>
                                        P{finalResult.position}
                                    </span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statLabel}>KAZANILAN PUAN</span>
                                    <span className={styles.pointsValue}>
                                        {finalResult.points > 0 ? `+${finalResult.points} PTS` : '0 PTS'}
                                    </span>
                                </div>
                                <div className={styles.statBox}>
                                    <span className={styles.statLabel}>KARAR ETKİSİ</span>
                                    <span
                                        className={styles.impactValue}
                                        style={{
                                            color: finalResult.impact > 0 ? '#00e676' : finalResult.impact < 0 ? '#ff5252' : '#ffffff'
                                        }}
                                    >
                                        {finalResult.impact > 0 ? `+${finalResult.impact} Sıra 🚀` :
                                         finalResult.impact < 0 ? `${finalResult.impact} Sıra ⚠️` : 'Sıranı Korudun 🛡️'}
                                    </span>
                                </div>
                            </div>

                            {newsStatus !== 'idle' && (
                                <div className={`${styles.newsBanner} ${styles[newsStatus] || ''}`}>
                                    {newsStatus === 'generating' && (
                                        <div className={styles.newsStatusRow}>
                                            <div className={styles.pulseDot}></div>
                                            <span>🤖 Gemini AI son yarış haberlerini kaleme alıyor...</span>
                                        </div>
                                    )}
                                    {newsStatus === 'done' && (
                                        <div className={styles.newsStatusRow}>
                                            <span>✨ 3 yeni yarış haberi üretilip ana sayfaya eklendi!</span>
                                        </div>
                                    )}
                                    {newsStatus === 'error' && (
                                        <div className={styles.newsStatusRow}>
                                            <span>⚠️ AI haber servisine ulaşılamadı.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {generatedNews.length > 0 && (
                                <div className={styles.miniNewsList}>
                                    {generatedNews.map((item, idx) => (
                                        <div key={idx} className={styles.miniNewsItem}>
                                            <span className={styles.miniNewsCategory}>{item.category}</span>
                                            <span className={styles.miniNewsTitle}>{item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.resultActions}>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => router.push('/')}
                                >
                                    🏠 Ana Sayfa
                                </button>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => router.push('/race-mode')}
                                >
                                    🏎️ Yeni Yarış
                                </button>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => router.push('/standings/drivers')}
                                >
                                    📊 Puan Durumu
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div 
                            className={styles.questionBox}
                            style={{
                                left: '26.35%',
                                top: '27.48%',
                                right: '26.33%',
                                bottom: '56.85%',
                            }}
                        >
                            {current ? current.event.question : 'Yarış Tamamlanıyor...'}
                        </div>

                        <div 
                            className={styles.timerCircle}
                            style={{
                                left: '88.5%',
                                top: '79.2%',
                                right: '3.9%',
                                bottom: '5%',
                            }}
                        >
                            <div className={styles.timerText}>{count}</div>
                        </div>

                        <div 
                            className={styles.lapBadge}
                            style={{
                                left: '42%',
                                top: '88.82%',
                                right: '42.1%',
                                bottom: '0%',
                            }}
                        >
                            TUR {current?.lap ?? location.laps} / {location.laps}
                        </div>

                        <div 
                            className={styles.driverBadge}
                            style={{
                                left: '3.3%',
                                top: '90%',
                                right: '74.1%',
                                bottom: '1.7%',
                            }}
                        >
                            {driver?.name || 'Sürücü'}
                        </div>

                        {current?.event.options.map((option, index) => (
                            <button
                                key={option.id}
                                className={styles.optionBtn}
                                style={optionPositions[index]}
                                onClick={() => selectOption(option)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

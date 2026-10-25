"use client"
import { useGameStore } from '../store/gameStore'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import styles from './RaceDecisionScreen.module.css'
import { useCountdown } from 'usehooks-ts'
import { useEffect, useState } from 'react'
import type{RaceEvent} from '@/src/types/events.ts'
import events from '@/src/db/events.json' 
import { simulateQualifying } from '../hooks/raceSimulator'
import locations from '@/src/db/locations.json'



export const RaceDecisionScreen = () => {

    const { driverNumber } = useParams();
    const [count,{startCountdown, resetCountdown}]=useCountdown({countStart:15})
    const driver = useGameStore((state) => state.drivers.find((d) => d.number == Number(driverNumber)));
    const team = useGameStore((state) => state.teams.find((d) => d.name === driver?.team));
    const location = locations.find((l)=>l.round == useGameStore.getState().round)|| locations[0]
    const [decisionLaps] = useState(() => {
        const step = Math.floor(location.laps / 4);

        return [0, 1, 2, 3].map((i) => {
            const lap = i * step + 1 + Math.floor(Math.random() * step);
            
            return Math.max(2,Math.min(lap, location.laps));
        });
    });



    useEffect(()=>{
        startCountdown();

    },[startCountdown])
    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    };


  
       
        const gridOrder = simulateQualifying(
            useGameStore.getState().drivers,
            useGameStore.getState().teams,
            location
        )
        const position = gridOrder.findIndex((d)=>d.name==driver?.name)+1

        

        const findEvents = (events: RaceEvent[]) => {
            // Negatif tur: sondan sayılır (-1 = son tur, -10 = sondan 10. tur)
            const resolveLap = (lap: number) => lap < 0 ? location.laps + lap + 1 : lap

            // Her karar turu için uygun event'lerden rastgele birini seç
            return decisionLaps.flatMap((decisionLap) => {
                const candidates = events.filter((event) => {
                    const minLap = resolveLap(event.lap[0])
                    const maxLap = resolveLap(event.lap[1])
                    return decisionLap >= minLap && decisionLap <= maxLap
                        && position >= event.position[0] && position <= event.position[1]
                })

                if (candidates.length === 0) return []
                const picked = candidates[Math.floor(Math.random() * candidates.length)]
                return [{ lap: decisionLap, event: picked }]
            })
        }

        const [raceEvents] = useState(() => findEvents(events as RaceEvent[]))
        const [currentIndex, setCurrentIndex] = useState(0)
        const current = raceEvents[currentIndex]

        const optionPositions = [
            { left: '8.4%',   top: '45.8%', right: '66.12%', bottom: '23.3%' },
            { left: '37.77%', top: '45.8%', right: '36.62%', bottom: '23.3%' },
            { left: '67.14%', top: '45.8%', right: '7.12%',  bottom: '23.3%' },
        ]

        // Seçimi uygula, sonraki karara geç ve geri sayımı sıfırla
        const selectOption = (optionId: string) => {
            console.log('Seçilen:', current?.event.id, optionId)
            setCurrentIndex((i) => i + 1)
            resetCountdown()
            startCountdown()
        }

        // Süre bitince rastgele bir seçenek seç
        useEffect(() => {
            if (count !== 0 || !current) return
            // setState'i effect gövdesinde senkron çağırmamak için callback içinde çalıştırıyoruz
            const timeout = setTimeout(() => {
                const options = current.event.options
                const random = options[Math.floor(Math.random() * options.length)]
                selectOption(random.id)
            }, 0)
            return () => clearTimeout(timeout)
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [count])

    

    return (
        <div
            onClick={handleFullScreen}
            className={styles.screenContainer}
        >
            

            {/* 🖼️ Arkaplan Resmi - Görünür ve Net */}
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

            
            <div className={styles.contentWrapper} >

                {/* Soru Ekranı */}
                <div 
                    className={styles.questionBox}
                    style={{
                        left: '26.35%',
                        top: '27.48%',
                        right: '26.33%',
                        bottom: '56.85%',
                    }}
                >
                    {current ? current.event.question : 'Yarış bitti'}
                </div>

                {/* Zaman Dairesi */}
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

                {/* Tur Sayısı */}
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

                {/* Sürücü Adı */}
                <div 
                    className={styles.driverBadge}
                    style={{
                        left: '3.3%',
                        top: '90%',
                        right: '74.1%',
                        bottom: '1.7%',
                    }}
                >
                    {driver?.name || 'Oscar Piastri'}
                </div>

                {/* Seçenekler */}
                {current?.event.options.map((option, index) => (
                    <button
                        key={option.id}
                        className={styles.optionBtn}
                        style={optionPositions[index]}
                        onClick={() => selectOption(option.id)}
                    >
                        {option.label}
                    </button>
                ))}

            </div>
        </div>
    );
}
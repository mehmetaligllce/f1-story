'use client'

import ReactCountryFlag from 'react-country-flag';
import styles from './DriverStanding.module.css';
import Link from "next/link"
import Image from "next/image"
import { useGameStore } from '../store/gameStore';
import { useRouter } from 'next/navigation';

export const DriverStandingsList = () => {
    const drivers = useGameStore(state => state.drivers);
    const isEnd=useGameStore(state=>state.round>=24?true:false)
    const standingDriver = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
    const router = useRouter();
    const handleNextSeason=()=>{
        useGameStore.getState().nextSeason()
        router.push('/standings')
    }
    
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>F1 Driver Standings</h2>
            {isEnd && (
                <div>
                    <p className={styles.end}>
                   {standingDriver[0]?.name} şampiyon oldu!
                </p>
                 <button onClick={handleNextSeason} className={styles.Button}>Sonraki Sezona Başla</button>
                </div>
                
            )}
            <div className={styles.list}>
                {standingDriver.map((driver, index) => (
                    <Link href={`/drivers/${driver.number}`} key={index} className={styles.driverRow}>
                        <div className={styles.position}>{index + 1}</div>
                        
                        <div className={styles.driverInfo}>
                            <ReactCountryFlag countryCode={driver.country} svg className={styles.countryFlag} />
                            
                            <div className={styles.nameTeam}>
                                <div className={styles.nameWrapper}>
                                    <span className={styles.driverName}>{driver.name}</span>
                                    <span className={styles.driverNumber}>{driver.number}</span>
                                </div>
                                <span className={styles.teamName}>{driver.team}</span>
                            </div>
                        </div>
                        
                        <div className={styles.rightContent}>
                            <div className={styles.imageWrapper}>
                                <Image src={driver.image} alt={driver.name} width={75} height={75} className={styles.driverImage} />
                            </div>
                            
                            <div className={styles.pointsWrapper}>
                                <span className={styles.points}>{Number.isNaN(driver.points) || driver.points == null ? 0 : driver.points}</span>
                                <span className={styles.ptsLabel}>PTS</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

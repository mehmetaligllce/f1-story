"use client";
import locations from "../db/locations.json"
import styles from "./Location.module.css"
import ReactCountryFlag from 'react-country-flag';
import Link from "next/link";
import { useGameStore } from "../store/gameStore";



const getWeatherIcon = (weather) => {
    switch(weather) {
        case "Yağmurlu": return "🌧️";
        case "Kuru": return "☀️";
        case "Geçiş": return "⛅";
        default: return "🌤️";
    }
}

export const LocationList = () => {
    const round=useGameStore((state)=>state.round);
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Race Calendar</h2>
            <div className={styles.grid}>
                {locations.map((location, index) => (
                  <Link href={`/locations/${location.round}`} key={index} className={round === index + 1 ? styles.cardTrue : styles.cardFalse}>
                        <div className={styles.cardHeader}>
                            <span className={styles.round}>Round {location.round}</span>
                            <ReactCountryFlag 
                                countryCode={location.country_code} 
                                svg 
                                className={styles.flag} 
                            />
                        </div>
                        <div className={styles.cardBody}>
                            <h3 className={styles.trackName}>{location.name}</h3>
                            <span>🏁 {location.laps} Laps</span>
                            <div className={styles.infoRow}>
                                <span className={styles.date}>📅 {location.date}</span>
                                <div className={styles.weatherWrapper}>
                                    <span className={styles.weatherIcon}>{getWeatherIcon(location.weather)}</span>
                                    <span className={styles.weatherText}>{location.weather}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
export default LocationList
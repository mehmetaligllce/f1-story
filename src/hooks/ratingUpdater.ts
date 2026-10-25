import type { Driver } from "../types/driver";
import { simulateRaceMany } from "./raceSimulator";
import type {Team} from "@/src/types/teams";
import type {Location} from "@/src/types/locations"
import type { Standing } from "../types/standing";
import type { deltaStats } from "../types/deltaStats";

type returnPackage={newDrivers:Driver[],deltaNumber:deltaStats[]}

export const UpdateDriverRatings =(drivers:Driver[],teams:Team[],round:number,locations:Location[]) =>{
    let driversPackage:returnPackage={newDrivers:drivers,deltaNumber:[]}
    
    switch(round){
        case 6:{ //? pace,wetskill,qualifying
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,0,6,["pace","wet_skill","qualifying"])
            break;
        }
        case 12:{ //? pace ,wetskill, quali,coldblood,aggression
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,6,12,["pace","wet_skill","qualifying"])
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,0,12,["coldblood","aggression"])
            break
        }
        case 18:{ //? pace,wetskill,qualifying, consistency
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,12,18,["pace","wet_skill","qualifying"])
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,0,18,["consistency"])
            break
        }
        case 24:{ //? pace ,wetskill, quali,coldblood,aggression,tyre management,racecraft
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,18,24,["pace","wet_skill","qualifying"])
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,12,24,["coldblood","aggression"])
            driversPackage=updateStatGroup(driversPackage.newDrivers,teams,locations,0,24,["tyre_management","racecraft"])
            break
        }
    }
    return driversPackage

  

}

const updateStatGroup=(drivers:Driver[],teams:Team[],locations:Location[],startRound:number,endRound:number,stats:(keyof Driver['rating'])[])=>{ 
    const deltaNumber :deltaStats[] = [] 
    const testLocations= locations.slice(startRound, endRound)
    if(testLocations.length === 0) {
        return {newDrivers:drivers,deltaNumber:[]} 
    } 
    const testResult = simulateRaceMany(drivers,teams,testLocations,(endRound-startRound)*1000)

    const newDrivers=drivers.map((driver:Driver)=>{
        const actualResult = (
            (driver.standings?.filter((i:Standing)=>i.round!=null && i.round<=endRound && i.round>startRound)
                .reduce((acc,curr)=> acc+curr.position, 0) ?? 0)
            / (endRound-startRound)
        )
        const expectedResult =testResult.find((t)=>t.name===driver.name)?.position

        if(actualResult === 0 || actualResult===null || expectedResult==null || isNaN(actualResult)) return driver

        const delta=expectedResult-actualResult

        Object.entries(driver.rating).forEach(([key, value]) => {
            if(stats.includes(key as keyof Driver['rating'])){
                const currentRating=driver.rating[key as keyof typeof driver.rating] 
                const newRating = updateStat(value,delta)
            
                if(currentRating!==newRating){
                    deltaNumber.push({name:driver.name,stats:key,delta:newRating-currentRating})
                }
                driver.rating[key as keyof typeof driver.rating]=newRating;
            }
        })
        return driver
                
    })
    const returnPackage:returnPackage={
        newDrivers,
        deltaNumber
    }
    return returnPackage    
    
}

const updateStat=(currValue:number,delta:number)=>{
    if(delta==0) return currValue
    if(delta>0){
      const growthMultiplier = Math.pow((100 - currValue),2) / 300
      const newRating = currValue + delta * growthMultiplier
      return Math.max(Math.min(newRating, 100), 30);
      
    } else{
      const decayMultiplier = currValue / 80;
      return Math.max(Math.min(currValue + delta * decayMultiplier, 100), 30);

    }

    

}
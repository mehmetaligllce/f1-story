import type {Driver} from '@/src/types/driver'
import type {Team} from '@/src/types/teams'
import type {Location} from '@/src/types/locations'





const getWeather = (weather: string): number => {
  if (weather === "Kuru") return 0
  if (weather === "Geçiş") return 1
  if (weather === "Yağmurlu") return 2
  return 0 
}

const getCircuitType = (circuit_type: string): number => {
  if (circuit_type === "street") return 0
  if (circuit_type === "power") return 1
  if (circuit_type === "technic") return 2
  return 3 
}



const calcDriverScore = (driver: Driver,location:Location)=>{
  const weather=getWeather(location.weather) //* 0-1-2
  const circuit_type=getCircuitType(location.circuit_type)

  const ratings = new Map<string , number>([
    ["pace",driver.rating.pace],
    ["racecraft",driver.rating.racecraft],
    ["aggresion",driver.rating.aggression],
    ["coldblood",driver.rating.coldblood],
    ["qualifying",driver.rating.qualifying],
    ["tyre_management",driver.rating.tyre_management],
    ["wet_skill",driver.rating.wet_skill],
    ["consistency",driver.rating.consistency],
  ])
 

  switch(weather){
     case 0:{
      ratings.set("pace",ratings.get("pace")! * 1.2)
      ratings.set("racecraft",ratings.get("racecraft")! * 1.2)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 0)
      break
    }

    case 1:{
      ratings.set("racecraft",ratings.get("racecraft")! * 1.2)
      ratings.set("aggresion",ratings.get("aggresion")! * 1.1)
      ratings.set("coldblood",ratings.get("coldblood")! * 1.3)
      ratings.set("qualifying",ratings.get("qualifying")! * 1.2)
      ratings.set("tyre_management",ratings.get("tyre_management")! * 0.8)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 1.2)
      ratings.set("consistency",ratings.get("consistency")! * 0.9)
      break
    }
    case 2:{
      ratings.set("pace",ratings.get("pace")! * 0.9)
      ratings.set("aggresion",ratings.get("aggresion")! * 0.7)
      ratings.set("coldblood",ratings.get("coldblood")! * 1.5)
      ratings.set("qualifying",ratings.get("qualifying")! * 0.7)
      ratings.set("tyre_management",ratings.get("tyre_management")! * 0.6)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 1.3)
      ratings.set("consistency",ratings.get("consistency")! * 0.7)
      break
    }
  }

  const x=location.overtake_diffuculity
  
  ratings.set("qualifying",ratings.get("qualifying")! * (0.17 * x))
  ratings.set("aggresion",ratings.get("aggresion")! * (0.8 + 0.0625*x))
  ratings.set("racecraft",ratings.get("racecraft")! * (0.9 + 0.04*x))
  ratings.set("pace",ratings.get("pace")! * (1.5 - 0.09*x))
  ratings.set("tyre_management",ratings.get("tyre_management")! * (1.5 - 0.1*x))


  switch(circuit_type){
    case 0: //street
      ratings.set("pace",ratings.get("pace")! * 1.1)
      ratings.set("racecraft",ratings.get("racecraft")! * 1.2)
      ratings.set("aggresion",ratings.get("aggresion")! * 1.2)
      ratings.set("coldblood",ratings.get("coldblood")! * 1.1)
      ratings.set("qualifying",ratings.get("qualifying")! * 1.1)
      ratings.set("tyre_management",ratings.get("tyre_management")! * 0.91)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 1.1)
      break
    case 1: //power
      ratings.set("pace",ratings.get("pace")! * 1.3)
      ratings.set("racecraft",ratings.get("racecraft")! * 0.9)
      ratings.set("aggresion",ratings.get("aggresion")! * 1.1)
      ratings.set("coldblood",ratings.get("coldblood")! * 0.8)
      ratings.set("tyre_management",ratings.get("tyre_management")! * 0.55)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 0.8)
      break
    case 2: //technic
      ratings.set("pace",ratings.get("pace")! * 0.8)
      ratings.set("racecraft",ratings.get("racecraft")! * 1.1)
      ratings.set("aggresion",ratings.get("aggresion")! * 0.9)
      ratings.set("coldblood",ratings.get("coldblood")! * 1.3)
      ratings.set("qualifying",ratings.get("qualifying")! * 1)
      ratings.set("tyre_management",ratings.get("tyre_management")! * 1.2)
      ratings.set("wet_skill",ratings.get("wet_skill")! * 1.3)
      ratings.set("consistency",ratings.get("consistency")! * 1.2)
      break
   
  }

  let score=0;
  for(const v of ratings.values()){
    score+=v 
  }

  const clamped = Math.min(Math.max(score, 300), 760);
  return Math.round(((clamped - 300) / (760 - 300)) * (100 ));
  
}




const calcTeamScore = (team:Team,location:Location)=>{
  const circuit_type=getCircuitType(location.circuit_type)

  const ratings = new Map<string , number>([
    ["pace",team.rating.pace],
    ["reliability",team.rating.reliability],
    ["development",team.rating.development],
    ["morale",team.rating.morale],
    ["downforce",team.rating.downforce],
    ["power_unit",team.rating.power_unit],
    ["tyre_management",team.rating.tyre_management],
    ["strategy",team.rating.strategy],
  ])


  switch(circuit_type){ 
    case 0: {
      ratings.set("reliability",ratings.get("reliability")! *1.2 )
      ratings.set("downforce",ratings.get("downforce")! *1.2 )
      ratings.set("power_unit",ratings.get("power_unit")! *1.1 )
      ratings.set("tyre_management",ratings.get("tyre_management")! *0.7 )
      ratings.set("strategy",ratings.get("strategy")! *0.9 )
      break
    } 
    case 1: {
      ratings.set("reliability",ratings.get("reliability")! *0.8 )
      ratings.set("downforce",ratings.get("downforce")! *0.8 )
      ratings.set("power_unit",ratings.get("power_unit")! *1.4 )
      ratings.set("tyre_management",ratings.get("tyre_management")! *0.5 )
      ratings.set("strategy",ratings.get("strategy")! *0.8 )
      break
    }
    case 2: {
      ratings.set("reliability",ratings.get("reliability")! *1.3 )
      ratings.set("morale",ratings.get("morale")! *1.2 )
      ratings.set("downforce",ratings.get("downforce")! *1.3 )
      ratings.set("power_unit",ratings.get("power_unit")! *0.7 )
      ratings.set("tyre_management",ratings.get("tyre_management")! *1.5 )
      ratings.set("strategy",ratings.get("strategy")! *1.3 )
      break
    }
    
  }
  ratings.set("strategy",ratings.get("strategy")! *(0.9+location.overtake_diffuculity*0.16))



 

  let score=0;
  for(const v of ratings.values()){
    score+=v 
  }

  const clamped = Math.min(Math.max(score, 250), 870);
  return Math.round(((clamped - 250) / (870 - 250)) * (100 ));
  
}



export const simulateRace = (drivers:Driver[],teams:Team[],location:Location)=>{


  return drivers.map(driver=>{
    const driverScore=calcDriverScore(driver,location)
    const teamScore=calcTeamScore(teams.find(t=>t.name===driver.team)!,location)
    const luck=0.85 + Math.random() * 0.30 
    return{name:driver.name,points:Math.round(((driverScore*teamScore*luck*10))),teamScore:teamScore,driverScore:driverScore,luck:luck}
  }).sort((a,b)=>b.points-a.points).map((a,i)=>{
    return {
      position:i+1,
      name:a.name,
      points:a.points,
      teamScore:a.teamScore,
      driverScore:a.driverScore,
      luck:a.luck
    }
  })

}





export const simulateRaceMany=(drivers:Driver[],teams:Team[],locations:Location[],testCount:number)=>{
const driversResult= new Map<string,number>()

for (const location of locations){
  for(let i = 0; i < testCount/locations.length; i++) {
    const listedDrivers= simulateRace(drivers,teams,location)
    listedDrivers.forEach(driver => {
      driversResult.set(driver.name,driver.position+(driversResult.get(driver.name)||0))
    });
  }
  
}
const result=Array.from(driversResult.entries()).map(([name,position])=>{
  return {
    name:name,
    position:position/testCount
  }

}).sort((a,b)=>a.position-b.position);
return result
}


export const simulateQualifying=(drivers:Driver[],teams:Team[],location:Location)=>{
  return drivers
    .map((driver) => {
      const team = teams.find((t) => t.name === driver.team);
      const driverQualyRating =
        driver.rating.qualifying * 1.5 +
        driver.rating.pace * 1.0 +
        driver.rating.coldblood * 0.8 +(getWeather(location.weather) === 1? driver.rating.wet_skill*1.2: 
      getWeather(location.weather)===2? driver.rating.wet_skill*1: 0);
      const teamQualyRating = team
        ? team.rating.power_unit * 1.2 + team.rating.downforce * 1.2
        : 100;
      const luck = 0.95 + Math.random() * 0.10;
      const qualyScore = (driverQualyRating + teamQualyRating) * luck;
      return {
        name: driver.name,
        number: driver.number,
        team: driver.team,
        score: Math.round(qualyScore),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({
      ...result,
      gridPosition: index + 1, 
    }));
  
}
import type{RaceEvent} from "@/src/types/events"
import type {Driver} from "@/src/types/driver" 
import type {Location} from "@/src/types/locations"  



const findRivalGroup=(pos:number)=>{
    let rival_group:string

    if(pos<6)
        rival_group=Math.random()<0.5 ? 'Orta' :'Arka'
    else if(pos<15)
        rival_group=Math.random()<0.5 ? 'ön' :'Arka'
    else
        rival_group=Math.random()<0.5 ? 'Orta' :'Ön'

    return rival_group

}
const findRemainPit=(lap:number)=>{return (30-lap)}
const findTireType=()=>{return Math.random()<0.33 ? 'Soft' : Math.random()<0.66 ? 'Medium' :'Hard'}
const findGapTime=()=>{return   (Math.random() * (5 - 1) + 1).toFixed(2);}


export const PrepareEvent=(event:RaceEvent,driver:Driver,grid:{name:string;team?:string}[],location:Location,lap:number)=>{
    const copEvent:RaceEvent=JSON.parse(JSON.stringify(event));
    
    const pos=grid.findIndex((n)=>n.name===driver.name)
   
    switch(copEvent.id){
        case "opponent_overtake":{
            const driver_front=grid[pos-1]?.name || "Rakip"; 
            let attack_site:string
            if(location.overtake_diffuculity>6)
                attack_site='düzlük'
            else
                attack_site=Math.random() < 0.5 ? "düzlük" : "viraj";

            copEvent.question=copEvent.question.replace('{{driver_front}}',driver_front).replace('{{attack_site}}',attack_site)
            break;
        }
        case "safety_car":{
            const rival_group=findRivalGroup(pos)


            const remain_pit=findRemainPit(lap)
            const tire_type=findTireType()

            copEvent.question=copEvent.question.replace('{{lap_number}}',lap.toString()).replace('{{rival_group}}',rival_group).replace('{{remain_pit}}',String(remain_pit)).replace('{{tire_type}}',tire_type)

            break;
        }
        case "strategy_call":{
            //?strategy_call	driver_front, gap_time


            const driver_front=grid[pos-1]?.name ||"Rakip";
            const gap_time= findGapTime()

            copEvent.question=copEvent.question.replace('{{driver_front}}',driver_front).replace('{{gap_time}}',gap_time)

            break;
        }
        case "ers_manage":{
                
            const driver_behind=grid[pos+1].name;
            copEvent.question=copEvent.question.replace('{{driver_behind}}',driver_behind)

            break;
        }
        case "tyre_warm":{
            //? tyre_warm	position, driver_behind, gap_time
            
            const driver_behind=grid[pos+1].name;
            const gap_time=findGapTime()
            copEvent.question=copEvent.question.replace('{{driver_behind}}',driver_behind).replace('{{gap_time}}',gap_time).replace('{{position}}',String(pos+1))

            break;
        }
        case "team_war":{
            //? team_war	driver_behind (hem soruda hem opsiyon içinde)
            
            const driver_behind=grid[pos+1].name;
            copEvent.question=copEvent.question.replace('{{driver_behind}}',driver_behind)
            copEvent.options[2].label= copEvent.options[2].label.replace('{{driver_behind}}',driver_behind)


                break;
        }
        case "damage":{
                //? damage	damage_site, remain_lap


                const remain_lap=location.laps-lap
                copEvent.question=copEvent.question.replace('{{remain_lap}}',String(remain_lap))


                break;
        }
        case "restart":{
                //? restart	remain_lap

                const remain_lap=location.laps-lap
                copEvent.question=copEvent.question.replace('{{remain_lap}}',String(remain_lap))

                break;
        }            
        case "blue_flag":{
                //? blue_flag	position, driver_behind, gap_time, oppenent_car
                const driver_behind=grid[pos+1].name;
                const gap_time=findGapTime()
                const opponent_car=grid[15].team

                copEvent.question=copEvent.question.replace('{{position}}',String(pos+1)).replace('{{gap_time}}',gap_time).replace('{{driver_behind}}',driver_behind).replace('{{opponent_car}}',String(opponent_car))


                break;
        }
        case "low_fuel":{
                //? low_fuel	remain_lap

                const remain_lap=location.laps-lap
                copEvent.question=copEvent.question.replace('{{remain_lap}}',String(remain_lap))

                break;
        }            
            
        
        
    

    }
    return copEvent

}
"use client"
import {useRouter} from "next/navigation"
import { useGameStore } from "../store/gameStore"



const ModeSelectPage = () => {
    const router=useRouter()
    const mode=useGameStore((state)=>state.mode)
    const setMode=useGameStore((state)=>state.setMode)

    

    return (
        <div>
            <h1>Mode Select Page</h1>
            <button onClick={()=>{setMode(0);router.push('/')}} style={{color:mode==0?'green':'white'}}>Normal Mode</button>
            <button onClick={()=>{setMode(1);router.push('/')}} style={{color:mode==1?'green':'white'}}>Game Mode</button>
        </div>
    )
}

export default ModeSelectPage
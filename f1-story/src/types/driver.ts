import { Standing } from "./standing"

export type Driver = {
  name: string
  number: number
  team: string
  country: string
  image: string
  points: number
  standings?:Standing[]
  rating: {
    pace: number,
    racecraft: number,
    aggression: number,
    coldblood: number,
    media_skill: number,
    qualifying: number,
    tyre_management: number,
    wet_skill: number,
    consistency: number
  }
}
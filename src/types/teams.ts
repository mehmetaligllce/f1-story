export type Team= {
    name: string,
    image: string,
    background : string,
    points: number,
    rating: {
      pace: number,
      reliability: number,
      development: number,
      morale: number,
      downforce: number,
      power_unit: number,
      tyre_management: number,
      strategy: number
    }
}
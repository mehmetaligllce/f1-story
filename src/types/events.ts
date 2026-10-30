export interface RaceEvent {
    id: string;
    question: string;
    lap: [number, number];
    position: [number, number];
    options: RaceOption[];
}

export interface RaceOption {
    id: string;
    icon: string;
    label: string;
    description: string;
    impact?: number
}
